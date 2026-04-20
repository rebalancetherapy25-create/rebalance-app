import { Availability, Booking } from '../models';

const STALE_PENDING_MINUTES = 15;

export const releaseExpiredSlotHolds = async () => {
    const now = new Date();
    await Availability.updateMany(
        { 'slots.reservedUntil': { $lt: now }, 'slots.isBooked': false },
        {
            $unset: { 'slots.$[slot].reservedUntil': 1, 'slots.$[slot].reservedBookingId': 1 },
        },
        {
            arrayFilters: [
                { 'slot.reservedUntil': { $lt: now }, 'slot.isBooked': false },
            ],
        }
    );
};

export const cancelStalePendingBookings = async () => {
    const staleCutoff = new Date(Date.now() - STALE_PENDING_MINUTES * 60 * 1000);
    const staleBookings = await Booking.find({
        status: 'pending',
        createdAt: { $lt: staleCutoff },
    }).select('_id therapistId date time');

    if (staleBookings.length === 0) return;

    for (const booking of staleBookings) {
        await Availability.updateOne(
            {
                therapistId: booking.therapistId,
                date: booking.date,
                'slots.time': booking.time,
                'slots.isBooked': false,
            },
            {
                $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 },
            }
        );
    }

    await Booking.updateMany(
        { _id: { $in: staleBookings.map((booking) => booking._id) } },
        { $set: { status: 'cancelled' } }
    );
};

export const runBookingMaintenance = async () => {
    await releaseExpiredSlotHolds();
    await cancelStalePendingBookings();
};
