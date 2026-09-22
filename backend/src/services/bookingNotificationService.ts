import { Booking, TherapistAccount } from '../models';
import { queueEmail } from './emailOutboxService';
import { bookingConfirmedEmail } from '../emails/templates/bookingConfirmed';
import { meetingLinkAddedEmail } from '../emails/templates/meetingLinkAdded';
import { therapistBookingConfirmedEmail } from '../emails/templates/therapistBookingConfirmed';
import { therapistMeetingLinkAddedEmail } from '../emails/templates/therapistMeetingLinkAdded';
import { paymentFailedEmail } from '../emails/templates/paymentFailed';
import { formatSlotTime } from '../utils/schedule';

const resolveTherapistEmail = async (therapistRef: any): Promise<string | undefined> => {
    if (therapistRef?.email) {
        return therapistRef.email;
    }
    const therapistId = therapistRef?._id || therapistRef;
    if (therapistId) {
        try {
            const account = await TherapistAccount.findOne({ therapistId });
            if (account?.email) return account.email;
        } catch (err) {
            console.error('[Notification] Error finding therapist account email:', err);
        }
    }
    return undefined;
};

export const sendBookingConfirmedNotification = async (bookingOrId: any): Promise<boolean> => {
    try {
        let booking = bookingOrId;
        if (typeof booking === 'string' || booking?._bsontype === 'ObjectID' || !booking?.date) {
            booking = await Booking.findById(bookingOrId)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        } else if (!booking.populated || !booking.populated('userId') || !booking.populated('therapistId')) {
            booking = await Booking.findById(booking._id)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        }

        if (!booking) {
            console.warn('[Notification] Cannot send confirmation email: booking not found');
            return false;
        }

        // Atomic check & set to prevent duplicate confirmation emails between concurrent verify and webhook calls
        const lock = await Booking.updateOne(
            { _id: booking._id, confirmationEmailSent: { $ne: true } },
            { $set: { confirmationEmailSent: true } }
        );

        if (lock.modifiedCount === 0) {
            console.log(`[Notification] Confirmation email already sent for booking: ${booking._id}`);
            return true;
        }

        const userRef = booking.userId as any;
        const therapistRef = booking.therapistId as any;

        // Works for both registered user and guest user
        const clientEmail: string | undefined = userRef?.email || booking.guestContact?.email;
        const clientName: string = userRef?.name || booking.guestContact?.name || 'there';
        const therapistName: string = therapistRef?.name || 'your therapist';

        // 1. Send confirmation email to client
        if (clientEmail) {
            const clientTpl = bookingConfirmedEmail({
                recipientName: clientName,
                therapistName,
                date: booking.date,
                time: formatSlotTime(booking.time),
                ...(booking.meetingLink ? { meetingLink: booking.meetingLink } : {}),
            });

            await queueEmail(clientEmail, clientTpl.subject, clientTpl.html);
            console.log(`[Notification] Client confirmation email queued for ${clientEmail} (booking ${booking._id})`);
        } else {
            console.warn(`[Notification] No client email found for booking: ${booking._id}`);
        }

        // 2. Send confirmation email to therapist
        const therapistEmail = await resolveTherapistEmail(therapistRef);
        if (therapistEmail) {
            const therapistTpl = therapistBookingConfirmedEmail({
                therapistName,
                clientName,
                date: booking.date,
                time: formatSlotTime(booking.time),
                sessionType: booking.sessionType,
                bookingReason: booking.bookingReason,
                meetingLink: booking.meetingLink,
            });

            await queueEmail(therapistEmail, therapistTpl.subject, therapistTpl.html);
            console.log(`[Notification] Therapist confirmation email queued for ${therapistEmail} (booking ${booking._id})`);
        } else {
            console.log(`[Notification] No therapist email registered for therapist ${therapistName}`);
        }

        return true;
    } catch (error) {
        console.error('[Notification] Error sending booking confirmed notification:', error);
        return false;
    }
};

export const sendMeetingLinkAddedNotification = async (bookingOrId: any): Promise<boolean> => {
    try {
        let booking = bookingOrId;
        if (typeof booking === 'string' || booking?._bsontype === 'ObjectID' || !booking?.meetingLink) {
            booking = await Booking.findById(bookingOrId)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        } else if (!booking.populated || !booking.populated('userId') || !booking.populated('therapistId')) {
            booking = await Booking.findById(booking._id)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        }

        if (!booking || !booking.meetingLink) {
            console.warn('[Notification] Cannot send meeting link email: booking or meetingLink missing');
            return false;
        }

        const userRef = booking.userId as any;
        const therapistRef = booking.therapistId as any;

        // Works for both registered user and guest user
        const clientEmail: string | undefined = userRef?.email || booking.guestContact?.email;
        const clientName: string = userRef?.name || booking.guestContact?.name || 'there';
        const therapistName: string = therapistRef?.name || 'your therapist';

        // 1. Send meeting link email to client
        if (clientEmail) {
            const clientTpl = meetingLinkAddedEmail({
                recipientName: clientName,
                therapistName,
                date: booking.date,
                time: formatSlotTime(booking.time),
                meetingLink: booking.meetingLink,
            });

            await queueEmail(clientEmail, clientTpl.subject, clientTpl.html);
            console.log(`[Notification] Client meeting link email queued for ${clientEmail} (booking ${booking._id})`);
        } else {
            console.warn(`[Notification] No client email found for booking: ${booking._id}`);
        }

        // 2. Send meeting link email to therapist
        const therapistEmail = await resolveTherapistEmail(therapistRef);
        if (therapistEmail) {
            const therapistTpl = therapistMeetingLinkAddedEmail({
                therapistName,
                clientName,
                date: booking.date,
                time: formatSlotTime(booking.time),
                meetingLink: booking.meetingLink,
            });

            await queueEmail(therapistEmail, therapistTpl.subject, therapistTpl.html);
            console.log(`[Notification] Therapist meeting link email queued for ${therapistEmail} (booking ${booking._id})`);
        }

        return true;
    } catch (error) {
        console.error('[Notification] Error sending meeting link notification:', error);
        return false;
    }
};

export const sendPaymentFailedNotification = async (bookingOrId: any, reason?: string): Promise<boolean> => {
    try {
        let booking = bookingOrId;
        if (typeof booking === 'string' || booking?._bsontype === 'ObjectID' || !booking?.date) {
            booking = await Booking.findById(bookingOrId)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        } else if (!booking.populated || !booking.populated('userId') || !booking.populated('therapistId')) {
            booking = await Booking.findById(booking._id)
                .populate('userId', 'name email')
                .populate('therapistId', 'name email');
        }

        if (!booking) {
            console.warn('[Notification] Cannot send payment failed email: booking not found');
            return false;
        }

        // Prevent duplicate failure emails
        const lock = await Booking.updateOne(
            { _id: booking._id, paymentFailedEmailSent: { $ne: true } },
            { $set: { paymentFailedEmailSent: true } }
        );

        if (lock.modifiedCount === 0) {
            console.log(`[Notification] Payment failed email already sent for booking: ${booking._id}`);
            return true;
        }

        const userRef = booking.userId as any;
        const therapistRef = booking.therapistId as any;

        const clientEmail: string | undefined = userRef?.email || booking.guestContact?.email;
        const clientName: string = userRef?.name || booking.guestContact?.name || 'there';
        const therapistName: string = therapistRef?.name || 'your therapist';

        if (!clientEmail) {
            console.warn(`[Notification] No client email found for payment failed booking: ${booking._id}`);
            return false;
        }

        const appUrl = process.env.APP_URL || 'https://rebalancetherapy.in';
        const retryUrl = therapistRef?._id ? `${appUrl}/therapists/${therapistRef._id}` : `${appUrl}/therapists`;

        const clientTpl = paymentFailedEmail({
            recipientName: clientName,
            therapistName,
            date: booking.date,
            time: formatSlotTime(booking.time),
            retryUrl,
        });

        await queueEmail(clientEmail, clientTpl.subject, clientTpl.html);
        console.log(`[Notification] Payment failed email queued for ${clientEmail} (booking ${booking._id}, reason: ${reason || 'unspecified'})`);

        return true;
    } catch (error) {
        console.error('[Notification] Error sending payment failed notification:', error);
        return false;
    }
};

