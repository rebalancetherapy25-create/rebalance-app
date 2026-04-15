import { Booking, Therapist, User } from '../models';
import { sendEmail } from './emailService';
import { sessionReminderEmail } from '../emails/templates/sessionReminder';

/**
 * Finds confirmed bookings scheduled in the next 24–25 hour window
 * and sends a reminder email to the client.
 *
 * Designed to run every hour via node-cron so each booking receives
 * exactly one reminder (the window moves forward with each run).
 */
export const sendSessionReminders = async (): Promise<void> => {
    const now = new Date();

    // Target: sessions starting between 24h and 25h from now
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Dates to check (YYYY-MM-DD range)
    const dateStart = windowStart.toISOString().slice(0, 10);
    const dateEnd = windowEnd.toISOString().slice(0, 10);

    const bookings = await Booking.find({
        status: 'confirmed',
        reminderSent: { $ne: true },
        date: { $gte: dateStart, $lte: dateEnd },
    })
        .populate('therapistId', 'name')
        .populate('userId', 'name email')
        .lean();

    if (bookings.length === 0) return;

    for (const booking of bookings) {
        const therapist = booking.therapistId as any;
        const userRef = booking.userId as any;

        const recipientEmail: string | undefined = userRef?.email ?? booking.guestContact?.email;
        const recipientName: string = userRef?.name ?? booking.guestContact?.name ?? 'there';

        if (!recipientEmail) continue;

        // Check if the booking time falls within today's specific hour window
        const [bookingHour, bookingMinute] = (booking.time as string)
            .split(':')
            .map(Number);

        const sessionDateTime = new Date(`${booking.date}T${String(bookingHour).padStart(2, '0')}:${String(bookingMinute ?? 0).padStart(2, '0')}:00`);

        if (sessionDateTime < windowStart || sessionDateTime > windowEnd) continue;

        const tpl = sessionReminderEmail({
            recipientName,
            therapistName: therapist?.name ?? 'your therapist',
            date: booking.date as string,
            time: booking.time as string,
            ...(booking.meetingLink ? { meetingLink: booking.meetingLink as string } : {}),
        });

        const sent = await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });

        if (sent) {
            // Mark so we don't send a duplicate on the next cron tick
            await Booking.updateOne({ _id: booking._id }, { $set: { reminderSent: true } });
        }
    }
};
