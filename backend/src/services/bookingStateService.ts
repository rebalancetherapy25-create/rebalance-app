import { Availability, Booking, Therapist } from '../models';
import { getTemplateSlotsForDate } from '../utils/schedule';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const VALID_BOOKING_STATUSES = new Set<BookingStatus>(['pending', 'confirmed', 'completed', 'cancelled']);
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed'];

export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

const ensureRuntimeAvailabilityForDate = async (therapist: any, date: string) => {
    const therapistId = String(therapist._id);
    const existing = await Availability.findOne({ therapistId, date });
    if (existing) return existing;

    const templateSlots = getTemplateSlotsForDate(therapist, date);
    if (templateSlots.length === 0) return null;

    try {
        return await Availability.create({
            therapistId,
            date,
            slots: templateSlots.map((slot) => ({ time: slot, isBooked: false })),
        });
    } catch (error: any) {
        if (error?.code === 11000) {
            return Availability.findOne({ therapistId, date });
        }
        throw error;
    }
};

export const ensureAvailabilityForSlot = async (therapistId: string, date: string, time: string) => {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) return { ok: false as const, error: 'Therapist not found' };

    const runtimeAvailability = await ensureRuntimeAvailabilityForDate(therapist, date);
    if (!runtimeAvailability) return { ok: false as const, error: 'No availability template exists for this therapist/date' };

    const slotExists = runtimeAvailability.slots.some((slot: any) => String(slot.time) === String(time));
    if (!slotExists) return { ok: false as const, error: 'Selected slot is not in therapist availability for that date' };

    return { ok: true as const, therapist, runtimeAvailability };
};

export const bookSlotIfAvailable = async (therapistId: string, date: string, time: string) => {
    const now = new Date();
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
        { $set: { 'slots.$.isBooked': true }, $unset: { 'slots.$.reservedUntil': 1 } }
    );
    return lockResult.modifiedCount > 0;
};

export const releaseSlot = async (therapistId: string, date: string, time: string) => {
    const result = await Availability.updateOne(
        { therapistId, date, 'slots.time': time },
        { $set: { 'slots.$.isBooked': false }, $unset: { 'slots.$.reservedUntil': 1 } }
    );
    return result.matchedCount > 0;
};

export const syncAvailabilityForStatus = async (booking: any, nextStatus: BookingStatus, previousStatus?: BookingStatus) => {
    const wasBooked = previousStatus === 'confirmed' || previousStatus === 'completed';
    const shouldBeBooked = nextStatus === 'confirmed' || nextStatus === 'completed';
    if (wasBooked === shouldBeBooked) return { ok: true as const };

    const therapistId = String(booking.therapistId?._id || booking.therapistId);
    const ensure = await ensureAvailabilityForSlot(therapistId, booking.date, booking.time);
    if (!ensure.ok) return { ok: false as const, error: ensure.error };

    if (shouldBeBooked) {
        const booked = await bookSlotIfAvailable(therapistId, booking.date, booking.time);
        if (!booked) return { ok: false as const, error: 'Selected slot is already booked or currently held' };
        return { ok: true as const };
    }

    const released = await releaseSlot(therapistId, booking.date, booking.time);
    if (!released) return { ok: false as const, error: 'Availability slot was not found for release' };
    return { ok: true as const };
};

export const rescheduleBooking = async (bookingId: string, therapistId: string, nextDate: string, nextTime: string) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) return { ok: false as const, status: 404 as const, error: 'Booking not found' };
    if (String(booking.therapistId) !== String(therapistId)) return { ok: false as const, status: 403 as const, error: 'Forbidden' };
    if (booking.status === 'cancelled' || booking.status === 'completed') {
        return { ok: false as const, status: 409 as const, error: `Booking is already ${booking.status}` };
    }

    const ensure = await ensureAvailabilityForSlot(therapistId, nextDate, nextTime);
    if (!ensure.ok) return { ok: false as const, status: 409 as const, error: ensure.error };

    const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        therapistId,
        date: nextDate,
        time: nextTime,
        status: { $in: ACTIVE_BOOKING_STATUSES },
    }).select('_id');
    if (conflict) {
        return { ok: false as const, status: 409 as const, error: 'Another active booking already exists for this slot' };
    }

    const bookedNew = await bookSlotIfAvailable(therapistId, nextDate, nextTime);
    if (!bookedNew) {
        return { ok: false as const, status: 409 as const, error: 'Selected slot is not available' };
    }

    const oldDate = booking.date;
    const oldTime = booking.time;
    const shouldReleaseOld = booking.status === 'confirmed';

    if (shouldReleaseOld) {
        const releasedOld = await releaseSlot(therapistId, oldDate, oldTime);
        if (!releasedOld) {
            await releaseSlot(therapistId, nextDate, nextTime);
            return { ok: false as const, status: 409 as const, error: 'Failed to release previous slot; reschedule aborted' };
        }
    }

    booking.date = nextDate;
    booking.time = nextTime;
    await booking.save();

    return { ok: true as const, booking };
};

