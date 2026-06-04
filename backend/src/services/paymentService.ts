import crypto from 'crypto';

import config from '../config/env';
import { Availability, Booking } from '../models';

type PaymentConfirmationResult =
    | { ok: true; booking: any; idempotent?: boolean }
    | { ok: false; status: number; error: string };

export const assertRazorpayConfig = () => {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        throw new Error('RAZORPAY_NOT_CONFIGURED');
    }

    return {
        keyId: config.razorpayKeyId,
        keySecret: config.razorpayKeySecret,
    };
};

export const verifyRazorpayPaymentSignature = (options: {
    orderId: string;
    paymentId: string;
    signature: string;
}) => {
    const { keySecret } = assertRazorpayConfig();
    const body = `${options.orderId}|${options.paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

    return expectedSignature === options.signature;
};

export const verifyRazorpayWebhookSignature = (payload: Buffer, signature?: string) => {
    if (!config.razorpayWebhookSecret || !signature) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', config.razorpayWebhookSecret)
        .update(payload)
        .digest('hex');

    return expectedSignature === signature;
};

const releasePendingHold = async (booking: any) => {
    await Availability.updateOne(
        {
            therapistId: booking.therapistId,
            date: booking.date,
            'slots.time': booking.time,
            'slots.isBooked': false,
        },
        { $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 } }
    );
};

export const confirmBookingPaymentByOrderId = async (options: {
    orderId: string;
    paymentId: string;
}): Promise<PaymentConfirmationResult> => {
    const booking = await Booking.findOne({ razorpayOrderId: options.orderId })
        .populate('userId', 'name email')
        .populate('therapistId', 'name');

    if (!booking) {
        return { ok: false, status: 404, error: 'Booking record not found' };
    }

    if (booking.status === 'confirmed' && booking.razorpayPaymentId === options.paymentId) {
        return { ok: true, booking, idempotent: true };
    }

    if (booking.status !== 'pending' && booking.status !== 'cancelled') {
        return { ok: false, status: 409, error: `Booking is already ${booking.status}` };
    }

    const therapistFromRef = booking.therapistId as any;
    const therapistId = String(therapistFromRef?._id || therapistFromRef);
    const now = new Date();

    const slotUpdate = await Availability.updateOne(
        {
            therapistId,
            date: booking.date,
            slots: {
                $elemMatch: {
                    time: booking.time,
                    isBooked: false,
                    $or: [
                        { reservedBookingId: booking._id },
                        { reservedUntil: { $exists: false } },
                        { reservedUntil: { $lt: now } },
                    ],
                },
            },
        },
        {
            $set: { 'slots.$.isBooked': true },
            $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 },
        }
    );

    if (slotUpdate.modifiedCount === 0) {
        await Booking.updateOne(
            { _id: booking._id, status: { $ne: 'confirmed' } },
            { $set: { status: 'cancelled', razorpayPaymentId: options.paymentId } }
        );

        return {
            ok: false,
            status: 409,
            error: 'Payment successful, but the slot was highly contested and taken by someone else. Support will refund/reschedule.',
        };
    }

    try {
        await Booking.updateOne(
            { _id: booking._id },
            { $set: { status: 'confirmed', razorpayPaymentId: options.paymentId } }
        );
        if (booking.couponCode) {
            const mongoose = require('mongoose');
            await mongoose.model('Coupon').updateOne({ code: booking.couponCode }, { $inc: { currentUsage: 1 } });
        }
    } catch (saveError) {
        await Availability.updateOne(
            { therapistId, date: booking.date, 'slots.time': booking.time, 'slots.isBooked': true },
            { $set: { 'slots.$.isBooked': false } }
        );
        throw saveError;
    }

    const populated = await Booking.findById(booking._id)
        .populate('userId', 'name email')
        .populate('therapistId', 'name');

    return { ok: true, booking: populated };
};

export const markBookingPaymentFailed = async (options: {
    orderId?: string;
    paymentId?: string;
    reason?: string;
}) => {
    if (!options.orderId) {
        return { ok: false as const, status: 404, error: 'Booking record not found' };
    }

    const booking = await Booking.findOne({ razorpayOrderId: options.orderId });
    if (!booking) {
        return { ok: false as const, status: 404, error: 'Booking record not found' };
    }

    if (booking.status === 'confirmed' || booking.status === 'completed') {
        return { ok: true as const, booking, idempotent: true };
    }

    if (booking.status !== 'cancelled') {
        booking.status = 'cancelled';
        if (options.paymentId) {
            booking.razorpayPaymentId = options.paymentId;
        }
        await booking.save();
    }

    await releasePendingHold(booking);

    return {
        ok: true as const,
        booking,
        reason: options.reason,
    };
};
