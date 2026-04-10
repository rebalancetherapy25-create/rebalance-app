import { Request, Response } from 'express';
import { Availability } from '../models';
import { normalizeDate, normalizeTime } from '../utils/schedule';
import { releaseExpiredSlotHolds } from '../services/bookingMaintenanceService';

// Client route to get available slots
export const getTherapistAvailability = async (req: Request, res: Response) => {
    try {
        const { therapistId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const normalizedDate = normalizeDate(String(date));
        if (!normalizedDate) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
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
            return res.status(200).json([]);
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

        res.status(200).json(availableSlots);
    } catch (error) {
        console.error('Fetch availability error:', error);
        res.status(500).json({ error: 'Server error fetching availability' });
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
            return res.status(400).json({ error: 'Invalid date/time format. Expected YYYY-MM-DD and HH:mm.' });
        }

        const now = new Date();
        const lockExpiry = new Date(now.getTime() + 5 * 60000); // 5 minutes locking

        const result = await Availability.updateOne(
            {
                therapistId: therapistId as string,
                date: normalizedDate,
                'slots.time': normalizedTime,
                'slots.isBooked': false,
                $or: [
                    { 'slots.reservedUntil': { $exists: false } },
                    { 'slots.reservedUntil': { $lt: now } },
                ],
            },
            {
                $set: { 'slots.$.reservedUntil': lockExpiry },
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(409).json({ error: 'Slot is no longer available' });
        }

        res.status(200).json({ message: 'Slot locked successfully', lockExpiry });
    } catch (error) {
        res.status(500).json({ error: 'Server error locking slot' });
    }
};

// Admin/Therapist route to set availability
export const setAvailability = async (req: Request, res: Response) => {
    try {
        const { therapistId, date, slots } = req.body;

        if (!therapistId || !date || !slots) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedDate = normalizeDate(String(date));
        if (!normalizedDate) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        // Data Normalization: If slots come as strings, convert to ISlot objects
        const normalizedSlots = slots.map((s: any) => {
            if (typeof s === 'string') {
                const normalizedTime = normalizeTime(s);
                return normalizedTime ? { time: normalizedTime, isBooked: false } : null;
            }
            const normalizedTime = normalizeTime(s.time);
            if (!normalizedTime) return null;
            return { ...s, time: normalizedTime };
        }).filter(Boolean);

        // Upsert the availability for that date
        const availability = await Availability.findOneAndUpdate(
            { therapistId: therapistId as string, date: normalizedDate },
            { therapistId, date: normalizedDate, slots: normalizedSlots },
            { upsert: true, new: true }
        );

        res.status(200).json(availability);
    } catch (error) {
        console.error('Set availability error:', error);
        res.status(500).json({ error: 'Server error setting availability' });
    }
};
