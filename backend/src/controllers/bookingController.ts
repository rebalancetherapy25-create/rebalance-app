import { Response } from 'express';
import mongoose from 'mongoose';
import { Availability, Booking, Therapist, User } from '../models';
import Razorpay from 'razorpay';
import { queueEmail } from '../services/emailOutboxService';
import { releaseExpiredSlotHolds, runBookingMaintenance } from '../services/bookingMaintenanceService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { formatSlotTime, getTemplateSlotsForDate, normalizeDate, normalizeTime, isWithin30DayWindow } from '../utils/schedule';
import { bookingConfirmedEmail } from '../emails/templates/bookingConfirmed';
import { sendData, sendError } from '../lib/http';
import { assertRazorpayConfig, confirmBookingPaymentByOrderId, verifyRazorpayPaymentSignature } from '../services/paymentService';

const LOCK_DURATION_MS = 5 * 60 * 1000;
const VALID_SESSION_TYPES = new Set(['video', 'phone', 'chat', 'audio']);
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

let razorpayInstance: Razorpay | null = null;

const getRazorpay = () => {
    if (!razorpayInstance) {
        const razorpayConfig = assertRazorpayConfig();
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

const tryLockSlot = async (therapistId: string, date: string, time: string, now: Date, lockExpiry: Date, bookingId: mongoose.Types.ObjectId) => {
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
        { $set: { 'slots.$.reservedUntil': lockExpiry, 'slots.$.reservedBookingId': bookingId } }
    );

    return lockResult.modifiedCount > 0;
};

const ensureRuntimeAvailability = async (therapist: any, normalizedDate: string, normalizedTime: string, lockExpiry: Date, bookingId: mongoose.Types.ObjectId) => {
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
                reservedBookingId: slot === normalizedTime ? bookingId : undefined,
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

const releaseHold = async (therapistId: any, date: string, time: string, bookingId: mongoose.Types.ObjectId) => {
    await Availability.updateOne(
        { therapistId, date, 'slots.time': time, 'slots.isBooked': false, 'slots.reservedBookingId': bookingId },
        { $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 } }
    );
};

export const createBooking = async (req: AuthRequest, res: Response) => {
    try {
        await runBookingMaintenance();

        const { therapistId, date, time, sessionType, name, email, couponCode, bookingReason, notes } = req.body;
        if (!therapistId || !date || !time || !sessionType) {
            return sendError(res, 400, 'therapistId, date, time, and sessionType are required', { code: 'BOOKING_MISSING_FIELDS' });
        }

        const normalizedDate = normalizeDate(String(date));
        const normalizedTime = normalizeTime(String(time));
        const normalizedSessionType = normalizeSessionType(String(sessionType));
        if (!normalizedDate || !normalizedTime || !normalizedSessionType) {
            return sendError(res, 400, 'Invalid date/time/sessionType format', { code: 'BOOKING_INVALID_SLOT' });
        }

        if (!isWithin30DayWindow(normalizedDate)) {
            return sendError(res, 400, 'Appointments can only be booked within the next 30 days.', { code: 'BOOKING_OUT_OF_RANGE' });
        }

        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }

        const userId = req.user?.userId;
        const guestName = String(name || '').trim();
        const guestEmail = String(email || '').trim().toLowerCase();
        if (!userId && (!guestName || !guestEmail)) {
            return sendError(res, 400, 'Guest bookings require name and email', { code: 'BOOKING_GUEST_DETAILS_REQUIRED' });
        }

        const now = new Date();
        const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);
        const bookingId = new mongoose.Types.ObjectId();

        let locked = await tryLockSlot(String(therapistId), normalizedDate, normalizedTime, now, lockExpiry, bookingId);
        if (!locked) {
            const existingRecord = await Availability.findOne({ therapistId, date: normalizedDate });
            if (!existingRecord) {
                const created = await ensureRuntimeAvailability(therapist, normalizedDate, normalizedTime, lockExpiry, bookingId);
                if (!created.ok) {
                    if (created.conflict) {
                        return sendError(res, 409, 'Slot was just taken by someone else', { code: 'BOOKING_SLOT_TAKEN' });
                    }
                    return sendError(res, 400, created.error || 'Selected slot is invalid', { code: 'BOOKING_SLOT_INVALID' });
                }
                locked = true;
            } else {
                return sendError(res, 409, 'Slot is no longer available or currently held by someone else', { code: 'BOOKING_SLOT_UNAVAILABLE' });
            }
        }

        if (!locked) {
            return sendError(res, 409, 'Slot is no longer available', { code: 'BOOKING_SLOT_UNAVAILABLE' });
        }

        let originalAmount = Math.round(Number(therapist.price || 0));
        let amount = originalAmount;
        let discountAmount = 0;
        let appliedCouponCode = undefined;

        if (couponCode) {
            const coupon = await mongoose.model('Coupon').findOne({ code: String(couponCode).toUpperCase() });
            if (coupon && coupon.isActive && (!coupon.expiresAt || new Date() < coupon.expiresAt) && (!coupon.maxUsage || coupon.currentUsage < coupon.maxUsage)) {
                discountAmount = Math.round(originalAmount * (coupon.discountPercentage / 100));
                amount = Math.max(0, originalAmount - discountAmount);
                appliedCouponCode = coupon.code;
            } else {
                await releaseHold(therapistId, normalizedDate, normalizedTime, bookingId);
                return sendError(res, 400, 'Invalid or expired coupon code', { code: 'COUPON_INVALID' });
            }
        }

        const bookingPayload: any = {
            _id: bookingId,
            therapistId,
            date: normalizedDate,
            time: normalizedTime,
            sessionType: normalizedSessionType,
            amount,
            status: 'pending',
            bookingReason,
            notes,
            ...(appliedCouponCode ? {
                couponCode: appliedCouponCode,
                discountAmount,
                originalAmount
            } : {})
        };
        if (userId) {
            bookingPayload.userId = userId;
        } else {
            bookingPayload.guestContact = { name: guestName, email: guestEmail };
        }

        const booking = await Booking.create(bookingPayload);

        if (amount === 0) {
            // Free booking (e.g. 100% discount coupon)
            booking.status = 'confirmed';
            await booking.save();

            // Permanently book the slot
            await Availability.updateOne(
                { therapistId, date: normalizedDate, 'slots.time': normalizedTime },
                {
                    $set: { 'slots.$.isBooked': true },
                    $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 },
                }
            );

            if (appliedCouponCode) {
                await mongoose.model('Coupon').updateOne({ code: appliedCouponCode }, { $inc: { currentUsage: 1 } });
            }

            let recipientEmail = guestEmail;
            let recipientName = guestName || 'there';
            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    recipientEmail = user.email;
                    recipientName = user.name;
                }
            }

            if (recipientEmail) {
                const tpl = bookingConfirmedEmail({
                    recipientName,
                    therapistName: therapist.name,
                    date: normalizedDate,
                    time: formatSlotTime(normalizedTime),
                });
                await queueEmail(recipientEmail, tpl.subject, tpl.html);
            }

            return sendData(res, {
                orderId: `FREE_BOOKING_${booking._id}`,
                amount: 0,
                currency: 'INR',
                bookingId: booking._id,
            });
        }

        try {
            const order = await getRazorpay().orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: `receipt_order_${booking._id}`,
            });

            booking.razorpayOrderId = order.id;
            await booking.save();

            return sendData(res, {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                bookingId: booking._id,
            });
        } catch (orderError) {
            await Booking.findByIdAndDelete(booking._id);
            await releaseHold(therapistId, normalizedDate, normalizedTime, bookingId);
            throw orderError;
        }
    } catch (error) {
        console.error('Booking Error:', error);
        if ((error as Error).message === 'RAZORPAY_NOT_CONFIGURED') {
            return sendError(res, 503, 'Payment gateway is not configured', { code: 'PAYMENT_GATEWAY_NOT_CONFIGURED' });
        }
        return sendError(res, 500, 'Server error creating booking', { code: 'BOOKING_CREATE_FAILED' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        // Keep hold cleanup, but do not cancel stale pending bookings before payment verification.
        await releaseExpiredSlotHolds();

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            return sendError(res, 400, 'Missing payment verification details', { code: 'PAYMENT_VERIFY_MISSING_FIELDS' });
        }

        const booking = await Booking.findById(bookingId).populate('userId', 'name email').populate('therapistId', 'name');
        if (!booking) {
            return sendError(res, 404, 'Booking record not found', { code: 'BOOKING_NOT_FOUND' });
        }

        if (booking.status === 'confirmed' && booking.razorpayPaymentId === razorpay_payment_id) {
            return sendData(res, { success: true, booking, idempotent: true });
        }

        if (booking.status !== 'pending' && booking.status !== 'cancelled') {
            return sendError(res, 409, `Booking is already ${booking.status}`, { code: 'BOOKING_STATUS_INVALID' });
        }

        if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
            return sendError(res, 400, 'Order does not match booking', { code: 'PAYMENT_ORDER_MISMATCH' });
        }

        if (!verifyRazorpayPaymentSignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        })) {
            return sendError(res, 400, 'Invalid payment signature', { code: 'PAYMENT_SIGNATURE_INVALID' });
        }

        const confirmationResult = await confirmBookingPaymentByOrderId({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });

        if (!confirmationResult.ok) {
            return sendError(res, confirmationResult.status, confirmationResult.error, { code: 'PAYMENT_CONFIRM_FAILED' });
        }

        const confirmedBooking = confirmationResult.booking;
        const therapistFromRef = confirmedBooking.therapistId as any;
        const userFromRef = confirmedBooking.userId as any;
        const recipientEmail = userFromRef?.email || confirmedBooking.guestContact?.email;
        const recipientName = userFromRef?.name || confirmedBooking.guestContact?.name || 'there';

        if (recipientEmail) {
            const tpl = bookingConfirmedEmail({
                recipientName,
                therapistName: therapistFromRef?.name || 'your therapist',
                date: confirmedBooking.date,
                time: formatSlotTime(confirmedBooking.time),
                ...(confirmedBooking.meetingLink ? { meetingLink: confirmedBooking.meetingLink } : {}),
            });
            await queueEmail(recipientEmail, tpl.subject, tpl.html);
        }

        return sendData(res, { success: true, booking: confirmedBooking });
    } catch (error) {
        console.error('Payment verification error:', error);
        if ((error as Error).message === 'RAZORPAY_NOT_CONFIGURED') {
            return sendError(res, 503, 'Payment gateway is not configured', { code: 'PAYMENT_GATEWAY_NOT_CONFIGURED' });
        }
        return sendError(res, 500, 'Error verifying payment', { code: 'PAYMENT_VERIFY_FAILED' });
    }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
    try {
        await runBookingMaintenance();

        const userId = req.user?.userId;
        if (!userId) return sendError(res, 401, 'Unauthorized', { code: 'AUTH_UNAUTHORIZED' });

        const bookings = await Booking.find({ userId })
            .populate('therapistId', 'name profileImage specialties')
            .sort({ createdAt: -1 })
            .lean();

        const now = new Date();
        const processedBookings = bookings.map(booking => {
            if (booking.meetingLink) {
                const bookingTime = new Date(`${booking.date}T${booking.time}:00`);
                // 1 hour session duration buffer
                const isExpired = new Date(bookingTime.getTime() + 60 * 60 * 1000) < now;
                
                if (booking.status !== 'confirmed' || isExpired) {
                    delete booking.meetingLink;
                }
            }
            return booking;
        });

        return sendData(res, processedBookings);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching user bookings', { code: 'BOOKING_LIST_FAILED' });
    }
};
