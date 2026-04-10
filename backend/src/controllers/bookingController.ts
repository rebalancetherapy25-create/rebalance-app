import { Response } from 'express';
import { Availability, Booking, Therapist } from '../models';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService';
import { releaseExpiredSlotHolds, runBookingMaintenance } from '../services/bookingMaintenanceService';
import config from '../config/env';
import { AuthRequest } from '../middlewares/authMiddleware';
import { getTemplateSlotsForDate, normalizeDate, normalizeTime } from '../utils/schedule';
import { bookingConfirmedEmail } from '../emails/templates/bookingConfirmed';

const LOCK_DURATION_MS = 5 * 60 * 1000;
const VALID_SESSION_TYPES = new Set(['video', 'phone', 'chat', 'audio']);
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

let razorpayInstance: Razorpay | null = null;
const getRazorpayConfig = () => {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        throw new Error('RAZORPAY_NOT_CONFIGURED');
    }
    return { keyId: config.razorpayKeyId, keySecret: config.razorpayKeySecret };
};

const getRazorpay = () => {
    if (!razorpayInstance) {
        const razorpayConfig = getRazorpayConfig();
        razorpayInstance = new Razorpay({
            key_id: razorpayConfig.keyId,
            key_secret: razorpayConfig.keySecret,
        });
    }
    return razorpayInstance;
};

const normalizeSessionType = (value: string): 'video' | 'phone' | 'chat' | 'audio' | null => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!VALID_SESSION_TYPES.has(normalized)) return null;
    return normalized as 'video' | 'phone' | 'chat' | 'audio';
};

const tryLockSlot = async (therapistId: string, date: string, time: string, now: Date, lockExpiry: Date) => {
    const lockResult = await Availability.updateOne(
        {
            therapistId,
            date,
            slots: {
                $elemMatch: {
                    time,
                    isBooked: false,
                    $or: [
                        { reservedUntil: { $exists: false } },
                        { reservedUntil: { $lt: now } },
                    ],
                },
            },
        },
        { $set: { 'slots.$.reservedUntil': lockExpiry } }
    );

    return lockResult.modifiedCount > 0;
};

const ensureRuntimeAvailability = async (therapist: any, normalizedDate: string, normalizedTime: string, lockExpiry: Date) => {
    const templateSlots = getTemplateSlotsForDate(therapist, normalizedDate);
    if (!templateSlots.includes(normalizedTime)) {
        return { ok: false, error: 'Requested slot is not available in therapist weekly schedule' };
    }

    try {
        await Availability.create({
            therapistId: therapist._id,
            date: normalizedDate,
            slots: templateSlots.map((slot) => ({
                time: slot,
                isBooked: false,
                reservedUntil: slot === normalizedTime ? lockExpiry : undefined,
            })),
        });
        return { ok: true };
    } catch (error: any) {
        if (error?.code === 11000) {
            return { ok: false, conflict: true };
        }
        throw error;
    }
};

const releaseHold = async (therapistId: any, date: string, time: string) => {
    await Availability.updateOne(
        { therapistId, date, 'slots.time': time, 'slots.isBooked': false },
        { $unset: { 'slots.$.reservedUntil': 1 } }
    );
};

export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        await runBookingMaintenance();

        const { therapistId, date, time, sessionType, name, email } = req.body;
        if (!therapistId || !date || !time || !sessionType) {
            return res.status(400).json({ error: 'therapistId, date, time, and sessionType are required' });
        }

        const normalizedDate = normalizeDate(String(date));
        const normalizedTime = normalizeTime(String(time));
        const normalizedSessionType = normalizeSessionType(String(sessionType));
        if (!normalizedDate || !normalizedTime || !normalizedSessionType) {
            return res.status(400).json({ error: 'Invalid date/time/sessionType format' });
        }

        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }

        const userId = req.user?.userId;
        const guestName = String(name || '').trim();
        const guestEmail = String(email || '').trim().toLowerCase();
        if (!userId && (!guestName || !guestEmail)) {
            return res.status(400).json({ error: 'Guest bookings require name and email' });
        }

        const now = new Date();
        const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);

        let locked = await tryLockSlot(String(therapistId), normalizedDate, normalizedTime, now, lockExpiry);
        if (!locked) {
            const existingRecord = await Availability.findOne({ therapistId, date: normalizedDate });
            if (!existingRecord) {
                const created = await ensureRuntimeAvailability(therapist, normalizedDate, normalizedTime, lockExpiry);
                if (!created.ok) {
                    if (created.conflict) {
                        return res.status(409).json({ error: 'Slot was just taken by someone else' });
                    }
                    return res.status(400).json({ error: created.error });
                }
                locked = true;
            } else {
                return res.status(409).json({ error: 'Slot is no longer available or currently held by someone else' });
            }
        }

        if (!locked) {
            return res.status(409).json({ error: 'Slot is no longer available' });
        }

        const amount = Math.round(Number(therapist.price || 0));
        const bookingPayload: {
            userId?: string;
            guestContact?: { name: string; email: string };
            therapistId: string;
            date: string;
            time: string;
            sessionType: 'video' | 'phone' | 'chat' | 'audio';
            amount: number;
            status: BookingStatus;
        } = {
            therapistId,
            date: normalizedDate,
            time: normalizedTime,
            sessionType: normalizedSessionType,
            amount,
            status: 'pending',
        };
        if (userId) {
            bookingPayload.userId = userId;
        } else {
            bookingPayload.guestContact = { name: guestName, email: guestEmail };
        }

        const booking = await Booking.create(bookingPayload);

        try {
            const order = await getRazorpay().orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: `receipt_order_${booking._id}`,
            });

            booking.razorpayOrderId = order.id;
            await booking.save();

            res.status(200).json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                bookingId: booking._id,
            });
        } catch (orderError) {
            await Booking.findByIdAndDelete(booking._id);
            await releaseHold(therapistId, normalizedDate, normalizedTime);
            throw orderError;
        }
    } catch (error) {
        console.error('Booking Error:', error);
        if ((error as Error).message === 'RAZORPAY_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Payment gateway is not configured' });
        }
        res.status(500).json({ error: 'Server error creating booking' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        // Keep hold cleanup, but do not cancel stale pending bookings before payment verification.
        await releaseExpiredSlotHolds();

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            return res.status(400).json({ error: 'Missing payment verification details' });
        }

        const booking = await Booking.findById(bookingId).populate('userId', 'name email').populate('therapistId', 'name');
        if (!booking) {
            return res.status(404).json({ error: 'Booking record not found' });
        }

        if (booking.status === 'confirmed' && booking.razorpayPaymentId === razorpay_payment_id) {
            return res.status(200).json({ success: true, booking, idempotent: true });
        }

        if (booking.status !== 'pending' && booking.status !== 'cancelled') {
            return res.status(409).json({ error: `Booking is already ${booking.status}` });
        }

        if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ error: 'Order does not match booking' });
        }

        const razorpayConfig = getRazorpayConfig();
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.keySecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        const therapistFromRef = booking.therapistId as any;
        const therapistId = String(therapistFromRef?._id || therapistFromRef);
        const slotUpdate = await Availability.updateOne(
            {
                therapistId,
                date: booking.date,
                slots: { $elemMatch: { time: booking.time, isBooked: false } },
            },
            { $set: { 'slots.$.isBooked': true }, $unset: { 'slots.$.reservedUntil': 1 } }
        );

        if (slotUpdate.modifiedCount === 0) {
            return res.status(409).json({
                error: 'Selected slot is no longer available. Payment requires manual support.',
            });
        }

        booking.status = 'confirmed';
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.meetingLink = `https://zoom.us/mock/${booking._id}`;
        try {
            await booking.save();
        } catch (saveError) {
            await Availability.updateOne(
                { therapistId, date: booking.date, 'slots.time': booking.time, 'slots.isBooked': true },
                { $set: { 'slots.$.isBooked': false } }
            );
            throw saveError;
        }

        const userFromRef = booking.userId as any;
        const recipientEmail = userFromRef?.email || booking.guestContact?.email;
        const recipientName = userFromRef?.name || booking.guestContact?.name || 'there';

        if (recipientEmail) {
            const tpl = bookingConfirmedEmail({
                recipientName,
                therapistName: therapistFromRef?.name || 'your therapist',
                date: booking.date,
                time: booking.time,
                meetingLink: booking.meetingLink,
            });
            await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
        }

        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Payment verification error:', error);
        if ((error as Error).message === 'RAZORPAY_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Payment gateway is not configured' });
        }
        res.status(500).json({ error: 'Error verifying payment' });
    }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
    try {
        await runBookingMaintenance();

        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const bookings = await Booking.find({ userId })
            .populate('therapistId', 'name profileImage specialties')
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching user bookings' });
    }
};
