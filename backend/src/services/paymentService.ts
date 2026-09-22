import crypto from 'crypto';

import config from '../config/env';
import { Availability, Booking } from '../models';
import { sendPaymentFailedNotification } from './bookingNotificationService';

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
    const cleanSecret = keySecret.trim().replace(/^['"]+|['"]+$/g, '');
    const cleanOrderId = options.orderId.trim();
    const cleanPaymentId = options.paymentId.trim();
    const cleanSignature = options.signature.trim();

    const body = `${cleanOrderId}|${cleanPaymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', cleanSecret)
        .update(body)
        .digest('hex');

    return expectedSignature.toLowerCase() === cleanSignature.toLowerCase();
};

export const verifyRazorpayWebhookSignature = (payload: Buffer, signature?: string) => {
    if (!config.razorpayWebhookSecret || !signature) {
        return false;
    }

    const cleanSecret = config.razorpayWebhookSecret.trim().replace(/^['"]+|['"]+$/g, '');
    const cleanSignature = signature.trim();

    const expectedSignature = crypto
        .createHmac('sha256', cleanSecret)
        .update(payload)
        .digest('hex');

    return expectedSignature.toLowerCase() === cleanSignature.toLowerCase();
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
    paymentId?: string;
}): Promise<PaymentConfirmationResult> => {
    const cleanOrderId = options.orderId.trim();
    const cleanPaymentId = options.paymentId ? options.paymentId.trim() : undefined;

    const booking = await Booking.findOne({ razorpayOrderId: cleanOrderId })
        .populate('userId', 'name email')
        .populate('therapistId', 'name');

    if (!booking) {
        console.error(`[confirmBookingPayment] Booking not found for orderId: ${cleanOrderId}`);
        return { ok: false, status: 404, error: 'Booking record not found' };
    }

    if (booking.status === 'confirmed') {
        if (cleanPaymentId && (!booking.razorpayPaymentId || booking.razorpayPaymentId !== cleanPaymentId)) {
            await Booking.updateOne({ _id: booking._id }, { $set: { razorpayPaymentId: cleanPaymentId } });
            booking.razorpayPaymentId = cleanPaymentId;
        }
        return { ok: true, booking, idempotent: true };
    }

    const therapistFromRef = booking.therapistId as any;
    const therapistId = therapistFromRef?._id || therapistFromRef;

    // 1. Ensure slot is marked as booked in Availability so nobody else takes it
    try {
        const slotUpdate = await Availability.updateOne(
            {
                therapistId,
                date: booking.date,
                'slots.time': booking.time,
            },
            {
                $set: { 'slots.$.isBooked': true },
                $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 },
            }
        );

        if (slotUpdate.matchedCount === 0) {
            const availDoc = await Availability.findOne({ therapistId, date: booking.date });
            if (availDoc) {
                await Availability.updateOne(
                    { therapistId, date: booking.date },
                    {
                        $push: {
                            slots: {
                                time: booking.time,
                                isBooked: true,
                            },
                        },
                    }
                );
            } else {
                await Availability.create({
                    therapistId,
                    date: booking.date,
                    slots: [
                        {
                            time: booking.time,
                            isBooked: true,
                        },
                    ],
                });
            }
        }
    } catch (availErr) {
        console.error('[confirmBookingPayment] Non-fatal error updating slot availability:', availErr);
    }

    // 2. Mark booking as confirmed
    try {
        await Booking.updateOne(
            { _id: booking._id },
            {
                $set: {
                    status: 'confirmed',
                    ...(cleanPaymentId ? { razorpayPaymentId: cleanPaymentId } : {}),
                },
            }
        );

        if (booking.couponCode) {
            try {
                const mongoose = require('mongoose');
                let bookingEmail = booking.guestContact?.email;
                if (booking.userId) {
                    bookingEmail = (booking.userId as any).email?.toLowerCase();
                }
                await mongoose.model('Coupon').updateOne(
                    { code: booking.couponCode }, 
                    { $inc: { currentUsage: 1 }, $push: { usedBy: bookingEmail } }
                );
            } catch (couponErr) {
                console.error('[confirmBookingPayment] Non-fatal coupon usage update error:', couponErr);
            }
        }
    } catch (saveError) {
        console.error('[confirmBookingPayment] Failed to update booking to confirmed:', saveError);
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

    try {
        await sendPaymentFailedNotification(booking, options.reason);
    } catch (notifyErr) {
        console.error('[Payment] Error sending payment failed notification:', notifyErr);
    }

    return {
        ok: true as const,
        booking,
        reason: options.reason,
    };
};
