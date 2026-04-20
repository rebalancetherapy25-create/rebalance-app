import { Response } from 'express';
import { Availability, Booking, Therapist } from '../models';
import { TherapistAuthRequest } from '../middlewares/therapistAuthMiddleware';
import { extractWeeklyTemplate, normalizeDate, normalizeTime } from '../utils/schedule';
import { ACTIVE_BOOKING_STATUSES, BookingStatus, STATUS_TRANSITIONS, syncAvailabilityForStatus, VALID_BOOKING_STATUSES, rescheduleBooking } from '../services/bookingStateService';
import { sendEmail } from '../services/emailService';
import { bookingRescheduledEmail } from '../emails/templates/bookingRescheduled';
import { bookingCancelledEmail } from '../emails/templates/bookingCancelled';
import { sendData, sendError } from '../lib/http';

const listDatesInclusive = (from: Date, to: Date) => {
    const dates: string[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
        const iso = cursor.toISOString().slice(0, 10);
        dates.push(iso);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
};

const parseRange = (fromRaw?: string, toRaw?: string) => {
    const now = new Date();
    const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const defaultTo = new Date(defaultFrom);
    defaultTo.setUTCDate(defaultFrom.getUTCDate() + 29);

    const from = fromRaw ? new Date(`${fromRaw}T00:00:00.000Z`) : defaultFrom;
    const to = toRaw ? new Date(`${toRaw}T00:00:00.000Z`) : defaultTo;
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
    if (to < from) return null;
    return { from, to };
};

export const getTherapistAvailabilityRange = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistId = req.therapist?.therapistId;
        if (!therapistId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const fromQ = typeof req.query.from === 'string' ? req.query.from : undefined;
        const toQ = typeof req.query.to === 'string' ? req.query.to : undefined;
        const range = parseRange(fromQ, toQ);
        if (!range) return sendError(res, 400, 'Invalid from/to', { code: 'AVAILABILITY_RANGE_INVALID' });

        const therapist = await Therapist.findById(therapistId).lean();
        if (!therapist) return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });

        const normalizedFrom = range.from.toISOString().slice(0, 10);
        const normalizedTo = range.to.toISOString().slice(0, 10);

        const records = await Availability.find({
            therapistId,
            date: { $gte: normalizedFrom, $lte: normalizedTo },
        }).lean();
        const byDate = new Map(records.map((r: any) => [r.date, r]));

        const template = extractWeeklyTemplate(therapist);
        const dates = listDatesInclusive(range.from, range.to);
        const results = dates.map((date) => {
            const record = byDate.get(date);
            if (record) {
                return { date, slots: record.slots, source: 'record' as const };
            }
            const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
            const slots = (template.find((t) => t.dayOfWeek === day)?.slots || []).map((time) => ({ time, isBooked: false }));
            return { date, slots, source: 'template' as const };
        });

        return sendData(res, results);
    } catch (error) {
        console.error('Therapist availability range error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_AVAILABILITY_RANGE_FAILED' });
    }
};

export const putTherapistAvailabilityForDate = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistId = req.therapist?.therapistId;
        if (!therapistId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const date = normalizeDate(String(req.params.date));
        if (!date) return sendError(res, 400, 'Invalid date. Use YYYY-MM-DD.', { code: 'AVAILABILITY_DATE_INVALID' });

        const rawSlots: any[] = Array.isArray(req.body?.slots) ? req.body.slots : [];
        const normalizedTimes = rawSlots
            .map((slot) => normalizeTime(typeof slot === 'string' ? slot : slot?.time))
            .filter((t): t is string => typeof t === 'string' && t.length > 0);
        const normalizedSlots = Array.from(new Set<string>(normalizedTimes)).sort();

        const existing = await Availability.findOne({ therapistId, date }).lean();
        const existingSlots = new Map((existing?.slots || []).map((s: any) => [String(s.time), s]));
        const bookedTimes = new Set((existing?.slots || []).filter((s: any) => s.isBooked).map((s: any) => String(s.time)));
        const now = new Date();
        const lockedTimes = new Set((existing?.slots || []).filter((s: any) => !s.isBooked && s.reservedUntil && new Date(s.reservedUntil) > now).map((s: any) => String(s.time)));
        
        const protectedTimes = new Set([...bookedTimes, ...lockedTimes]);

        if (protectedTimes.size > 0) {
            const missingProtected = Array.from(protectedTimes).filter((t) => !normalizedSlots.includes(t));
            if (missingProtected.length > 0) {
                return sendError(res, 409, 'Cannot remove slots that are booked or currently being checked out by a customer', { code: 'AVAILABILITY_BOOKED_SLOT_PROTECTED', fields: { bookedSlots: missingProtected.join(', ') } });
            }
        } else {
            // Safety: if for some reason availability record is missing but bookings exist, prevent destructive edits.
            const activeBookings = await Booking.find({
                therapistId,
                date,
                status: { $in: ACTIVE_BOOKING_STATUSES },
            }).select('time');
            const bookingTimes = new Set(activeBookings.map((b) => String(b.time)));
            const missing = Array.from(bookingTimes).filter((t) => !normalizedSlots.includes(t));
            if (missing.length > 0) {
                return sendError(res, 409, 'Cannot remove slots with active bookings', { code: 'AVAILABILITY_BOOKED_SLOT_PROTECTED', fields: { bookedSlots: missing.join(', ') } });
            }
        }

        const nextSlots = normalizedSlots.map((time) => {
            const prev = existingSlots.get(time);
            if (prev) {
                return { time, isBooked: Boolean(prev.isBooked), reservedUntil: prev.reservedUntil, reservedBookingId: prev.reservedBookingId };
            }
            return { time, isBooked: false };
        });

        const updated = await Availability.findOneAndUpdate(
            { therapistId, date },
            { therapistId, date, slots: nextSlots },
            { upsert: true, new: true }
        );

        return sendData(res, updated);
    } catch (error) {
        console.error('Therapist availability put error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_AVAILABILITY_UPDATE_FAILED' });
    }
};

export const getTherapistBookings = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistId = req.therapist?.therapistId;
        if (!therapistId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const from = req.query.from ? normalizeDate(String(req.query.from)) : null;
        const to = req.query.to ? normalizeDate(String(req.query.to)) : null;
        const status = req.query.status ? String(req.query.status).toLowerCase() : null;

        const query: any = { therapistId };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = from;
            if (to) query.date.$lte = to;
        }
        if (status) {
            if (!VALID_BOOKING_STATUSES.has(status as BookingStatus)) {
                return sendError(res, 400, 'Invalid status filter', { code: 'BOOKING_STATUS_INVALID' });
            }
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return sendData(res, bookings);
    } catch (error) {
        console.error('Therapist bookings error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_BOOKINGS_LIST_FAILED' });
    }
};

export const getTherapistBookingById = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistId = req.therapist?.therapistId;
        if (!therapistId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const booking = await Booking.findById(req.params.id).populate('userId', 'name email');
        if (!booking) return sendError(res, 404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
        if (String(booking.therapistId) !== String(therapistId)) return sendError(res, 403, 'Forbidden', { code: 'THERAPIST_FORBIDDEN' });
        return sendData(res, booking);
    } catch (error) {
        console.error('Therapist booking get error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_BOOKING_GET_FAILED' });
    }
};

export const updateTherapistBooking = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistId = req.therapist?.therapistId;
        if (!therapistId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const booking = await Booking.findById(req.params.id).populate('userId', 'name email').populate('therapistId', 'name');
        if (!booking) return sendError(res, 404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
        if (String(booking.therapistId) !== String(therapistId)) return sendError(res, 403, 'Forbidden', { code: 'THERAPIST_FORBIDDEN' });

        const recipientEmail = (booking.userId as any)?.email || booking.guestContact?.email;
        const recipientName = (booking.userId as any)?.name || booking.guestContact?.name || 'there';
        const therapistName = (booking.therapistId as any)?.name || 'your therapist';
        const previousDate = booking.date;
        const previousTime = booking.time;

        // Reject combined reschedule+status — reschedule saves to DB first; if status sync
        // then fails the booking ends up with new date/time but old status (inconsistent state).
        if ((req.body?.reschedule?.date || req.body?.reschedule?.time) && req.body?.status !== undefined) {
            return sendError(res, 400, 'Cannot reschedule and change status in the same request. Apply each change separately.', { code: 'BOOKING_UPDATE_CONFLICT' });
        }

        let didReschedule = false;
        let didCancel = false;

        // Reschedule (date/time)
        if (req.body?.reschedule?.date || req.body?.reschedule?.time) {
            const nextDate = normalizeDate(String(req.body.reschedule.date));
            const nextTime = normalizeTime(String(req.body.reschedule.time));
            if (!nextDate || !nextTime) return sendError(res, 400, 'Invalid reschedule date/time', { code: 'BOOKING_RESCHEDULE_INVALID' });

            const result = await rescheduleBooking(String(booking._id), String(therapistId), nextDate, nextTime);
            if (!result.ok) return sendError(res, result.status, result.error, { code: 'BOOKING_RESCHEDULE_FAILED' });

            didReschedule = true;
            booking.date = nextDate;
            booking.time = nextTime;
        }

        // Status transition
        if (req.body?.status !== undefined) {
            const nextStatus = String(req.body.status).toLowerCase() as BookingStatus;
            if (!VALID_BOOKING_STATUSES.has(nextStatus)) return sendError(res, 400, 'Invalid booking status', { code: 'BOOKING_STATUS_INVALID' });

            const current = booking.status as BookingStatus;
            if (current !== nextStatus) {
                if (!STATUS_TRANSITIONS[current]?.includes(nextStatus)) {
                    return sendError(res, 400, `Cannot transition booking from ${current} to ${nextStatus}`, { code: 'BOOKING_STATUS_TRANSITION_INVALID' });
                }

                if (nextStatus === 'confirmed') {
                    const conflict = await Booking.findOne({
                        _id: { $ne: booking._id },
                        therapistId,
                        date: booking.date,
                        time: booking.time,
                        status: { $in: ACTIVE_BOOKING_STATUSES },
                    }).select('_id');
                    if (conflict) return sendError(res, 409, 'Another active booking already exists for this slot', { code: 'BOOKING_SLOT_CONFLICT' });
                }

                booking.status = nextStatus;
                await booking.save();
                const sync = await syncAvailabilityForStatus(booking, nextStatus, current);
                if (!sync.ok) {
                    booking.status = current;
                    await booking.save();
                    return sendError(res, 409, sync.error || 'Failed to sync availability', { code: 'BOOKING_AVAILABILITY_SYNC_FAILED' });
                }
                if (nextStatus === 'cancelled') {
                    didCancel = true;
                }
            }
        }

        // Meeting link update
        if (req.body?.meetingLink !== undefined) {
            booking.meetingLink = String(req.body.meetingLink || '').trim() || undefined;
            await booking.save();
        }

        if (recipientEmail) {
            if (didReschedule) {
                const tpl = bookingRescheduledEmail({
                    recipientName,
                    therapistName,
                    previousDate,
                    previousTime,
                    nextDate: booking.date,
                    nextTime: booking.time,
                    ...(booking.meetingLink ? { meetingLink: booking.meetingLink } : {}),
                });
                await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
            } else if (didCancel) {
                const tpl = bookingCancelledEmail({
                    recipientName,
                    therapistName,
                    date: booking.date,
                    time: booking.time,
                });
                await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
            }
        }

        const populated = await Booking.findById(booking._id).populate('userId', 'name email').populate('therapistId', 'name');
        return sendData(res, { success: true, booking: populated });
    } catch (error) {
        console.error('Therapist booking update error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_BOOKING_UPDATE_FAILED' });
    }
};
