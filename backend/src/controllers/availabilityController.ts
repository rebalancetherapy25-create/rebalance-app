import { Request, Response } from 'express';
import { Availability } from '../models';
import { normalizeDate, normalizeTime } from '../utils/schedule';
import { releaseExpiredSlotHolds } from '../services/bookingMaintenanceService';
import { sendData, sendError } from '../lib/http';

// Client route to get available slots
export const getTherapistAvailability = async (req: Request, res: Response) => {
    try {
        const { therapistId } = req.params;
        const { date } = req.query;

        if (!date) {
            return sendError(res, 400, 'Date is required', { code: 'AVAILABILITY_DATE_REQUIRED' });
        }

        const normalizedDate = normalizeDate(String(date));
        if (!normalizedDate) {
            return sendError(res, 400, 'Invalid date format. Use YYYY-MM-DD.', { code: 'AVAILABILITY_DATE_INVALID' });
        }

        await releaseExpiredSlotHolds();

        const availability = await Availability.findOne({
            therapistId: therapistId as string,
            date: normalizedDate,
        });

        if (!availability) {
            // No record means no slots have been booked or held yet for this date.
            // Return empty so frontend can fallback to its template.
            res.setHeader('X-Availability-Record', '0');
            return sendData(res, []);
        }

        res.setHeader('X-Availability-Record', '1');
        const now = new Date();

        // Filter out booked and currently locked slots (5 mins expiry)
        const availableSlots = availability.slots.filter((slot) => {
            if (slot.isBooked) return false;
            // A slot is "locked" if reservedUntil exists AND is in the future
            if (slot.reservedUntil && new Date(slot.reservedUntil) > now) return false;
            return true;
        });

        return sendData(res, availableSlots);
    } catch (error) {
        console.error('Fetch availability error:', error);
        return sendError(res, 500, 'Server error fetching availability', { code: 'AVAILABILITY_FETCH_FAILED' });
    }
};

// Route to lock a slot safely (atomic update)
export const lockSlot = async (req: Request, res: Response) => {
    try {
        const { therapistId } = req.params;
        const { date, time } = req.body;
        const normalizedDate = normalizeDate(String(date));
        const normalizedTime = normalizeTime(String(time));

        if (!normalizedDate || !normalizedTime) {
            return sendError(res, 400, 'Invalid date/time format. Expected YYYY-MM-DD and HH:mm.', { code: 'AVAILABILITY_LOCK_INVALID' });
        }

        const now = new Date();
        const lockExpiry = new Date(now.getTime() + 5 * 60000); // 5 minutes locking

        const result = await Availability.updateOne(
            {
                therapistId: therapistId as string,
                date: normalizedDate,
                slots: {
                    $elemMatch: {
                        time: normalizedTime,
                        isBooked: false,
                        $or: [
                            { reservedUntil: { $exists: false } },
                            { reservedUntil: { $lt: now } },
                        ],
                    },
                },
            },
            {
                $set: { 'slots.$.reservedUntil': lockExpiry },
            }
        );

        if (result.modifiedCount === 0) {
            return sendError(res, 409, 'Slot is no longer available', { code: 'AVAILABILITY_SLOT_UNAVAILABLE' });
        }

        return sendData(res, { message: 'Slot locked successfully', lockExpiry });
    } catch (error) {
        return sendError(res, 500, 'Server error locking slot', { code: 'AVAILABILITY_LOCK_FAILED' });
    }
};

// Admin/Therapist route to set availability
export const setAvailability = async (req: Request, res: Response) => {
    try {
        const { therapistId, date, slots } = req.body;

        if (!therapistId || !date || !slots) {
            return sendError(res, 400, 'Missing required fields', { code: 'AVAILABILITY_SET_MISSING_FIELDS' });
        }

        const normalizedDate = normalizeDate(String(date));
        if (!normalizedDate) {
            return sendError(res, 400, 'Invalid date format. Use YYYY-MM-DD.', { code: 'AVAILABILITY_DATE_INVALID' });
        }

        const existing = await Availability.findOne({ therapistId: therapistId as string, date: normalizedDate }).lean();
        const existingSlots = new Map((existing?.slots || []).map((s: any) => [String(s.time), s]));

        // Data Normalization: If slots come as strings, convert to ISlot objects
        const normalizedSlots = slots.map((s: any) => {
            const timeRaw = typeof s === 'string' ? s : s.time;
            const normalizedTime = normalizeTime(timeRaw);
            if (!normalizedTime) return null;
            
            const prev = existingSlots.get(normalizedTime);
            if (prev) {
                return { time: normalizedTime, isBooked: Boolean(prev.isBooked), reservedUntil: prev.reservedUntil, reservedBookingId: prev.reservedBookingId };
            }
            return { time: normalizedTime, isBooked: false };
        }).filter(Boolean);

        // Upsert the availability for that date
        const availability = await Availability.findOneAndUpdate(
            { therapistId: therapistId as string, date: normalizedDate },
            { therapistId, date: normalizedDate, slots: normalizedSlots },
            { upsert: true, new: true }
        );

        return sendData(res, availability);
    } catch (error) {
        console.error('Set availability error:', error);
        return sendError(res, 500, 'Server error setting availability', { code: 'AVAILABILITY_SET_FAILED' });
    }
};
