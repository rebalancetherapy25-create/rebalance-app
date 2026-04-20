import { Request, Response } from 'express';
import { Availability, Booking, Therapist } from '../models';
import { extractWeeklyTemplate, normalizeDate, normalizeTime } from '../utils/schedule';
import { ACTIVE_BOOKING_STATUSES } from '../services/bookingStateService';
import { releaseExpiredSlotHolds } from '../services/bookingMaintenanceService';
import { sendData, sendError } from '../lib/http';

const listDatesInclusive = (from: Date, to: Date) => {
    const dates: string[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
        dates.push(cursor.toISOString().slice(0, 10));
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

const normalizeSlotsInput = (rawSlots: any[]) => {
    const normalized = rawSlots
        .map((slot) => normalizeTime(typeof slot === 'string' ? slot : slot?.time))
        .filter((t: string | null): t is string => Boolean(t));
    return Array.from(new Set(normalized)).sort();
};

export const getAdminAvailabilityRange = async (req: Request, res: Response) => {
    try {
        const therapistId = String(req.params.therapistId || '');
        const range = parseRange(req.query.from ? String(req.query.from) : undefined, req.query.to ? String(req.query.to) : undefined);
        if (!therapistId) return sendError(res, 400, 'therapistId is required', { code: 'AVAILABILITY_THERAPIST_REQUIRED' });
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
            if (record) return { date, slots: record.slots, source: 'record' as const };
            const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
            const slots = (template.find((t) => t.dayOfWeek === day)?.slots || []).map((time) => ({ time, isBooked: false }));
            return { date, slots, source: 'template' as const };
        });

        return sendData(res, results);
    } catch (error) {
        console.error('Admin availability range error:', error);
        return sendError(res, 500, 'Server error', { code: 'ADMIN_AVAILABILITY_RANGE_FAILED' });
    }
};

export const putAdminAvailabilityForDate = async (req: Request, res: Response) => {
    try {
        const therapistId = String(req.params.therapistId || '');
        const date = normalizeDate(String(req.params.date));
        if (!therapistId) return sendError(res, 400, 'therapistId is required', { code: 'AVAILABILITY_THERAPIST_REQUIRED' });
        if (!date) return sendError(res, 400, 'Invalid date. Use YYYY-MM-DD.', { code: 'AVAILABILITY_DATE_INVALID' });

        const normalizedSlots = normalizeSlotsInput(Array.isArray(req.body?.slots) ? req.body.slots : []);

        const existing = await Availability.findOne({ therapistId, date }).lean();
        const existingSlots = new Map((existing?.slots || []).map((s: any) => [String(s.time), s]));
        const bookedTimes = new Set((existing?.slots || []).filter((s: any) => s.isBooked).map((s: any) => String(s.time)));

        if (bookedTimes.size > 0) {
            const missingBooked = Array.from(bookedTimes).filter((t) => !normalizedSlots.includes(t));
            if (missingBooked.length > 0) {
                return sendError(res, 409, 'Cannot remove booked slots', { code: 'AVAILABILITY_BOOKED_SLOT_PROTECTED', fields: { bookedSlots: missingBooked.join(', ') } });
            }
        } else {
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
            if (prev) return { time, isBooked: Boolean(prev.isBooked), reservedUntil: prev.reservedUntil };
            return { time, isBooked: false };
        });

        const updated = await Availability.findOneAndUpdate(
            { therapistId, date },
            { therapistId, date, slots: nextSlots },
            { upsert: true, new: true }
        );

        return sendData(res, updated);
    } catch (error) {
        console.error('Admin availability put error:', error);
        return sendError(res, 500, 'Server error', { code: 'ADMIN_AVAILABILITY_UPDATE_FAILED' });
    }
};

export const generateAdminAvailabilityRange = async (req: Request, res: Response) => {
    try {
        const therapistId = String(req.params.therapistId || '');
        if (!therapistId) return sendError(res, 400, 'therapistId is required', { code: 'AVAILABILITY_THERAPIST_REQUIRED' });

        const range = parseRange(req.body?.from ? String(req.body.from) : undefined, req.body?.to ? String(req.body.to) : undefined);
        if (!range) return sendError(res, 400, 'Invalid from/to', { code: 'AVAILABILITY_RANGE_INVALID' });

        const overwrite = Boolean(req.body?.overwrite);
        const therapist = await Therapist.findById(therapistId).lean();
        if (!therapist) return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });

        const template = extractWeeklyTemplate(therapist);
        const dates = listDatesInclusive(range.from, range.to);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const date of dates) {
            const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
            const templateSlots = template.find((t) => t.dayOfWeek === day)?.slots || [];
            if (templateSlots.length === 0) {
                skipped += 1;
                continue;
            }

            const existing = await Availability.findOne({ therapistId, date }).lean();
            if (!existing) {
                await Availability.create({
                    therapistId,
                    date,
                    slots: templateSlots.map((time) => ({ time, isBooked: false })),
                });
                created += 1;
                continue;
            }

            if (!overwrite) {
                skipped += 1;
                continue;
            }

            const prevByTime = new Map((existing.slots || []).map((s: any) => [String(s.time), s]));
            const bookedTimes = (existing.slots || []).filter((s: any) => s.isBooked).map((s: any) => String(s.time));
            const nextTimes = Array.from(new Set([...templateSlots, ...bookedTimes])).sort();
            const nextSlots = nextTimes.map((time) => {
                const prev = prevByTime.get(time);
                if (prev) return { time, isBooked: Boolean(prev.isBooked), reservedUntil: prev.reservedUntil };
                return { time, isBooked: false };
            });

            await Availability.updateOne({ therapistId, date }, { $set: { slots: nextSlots } });
            updated += 1;
        }

        return sendData(res, { created, updated, skipped });
    } catch (error) {
        console.error('Admin availability generate error:', error);
        return sendError(res, 500, 'Server error', { code: 'ADMIN_AVAILABILITY_GENERATE_FAILED' });
    }
};

export const adminReleaseHoldsNow = async (req: Request, res: Response) => {
    try {
        const force = Boolean(req.body?.force);
        if (!force) {
            await releaseExpiredSlotHolds();
            return sendData(res, { success: true, mode: 'expiredOnly' });
        }

        await Availability.updateMany(
            { 'slots.isBooked': false, 'slots.reservedUntil': { $exists: true } },
            { $unset: { 'slots.$[slot].reservedUntil': 1 } },
            { arrayFilters: [{ 'slot.isBooked': false, 'slot.reservedUntil': { $exists: true } }] }
        );

        return sendData(res, { success: true, mode: 'forceAll' });
    } catch (error) {
        console.error('Admin release holds error:', error);
        return sendError(res, 500, 'Server error', { code: 'ADMIN_AVAILABILITY_RELEASE_FAILED' });
    }
};
