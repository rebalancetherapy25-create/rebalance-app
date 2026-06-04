import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, Therapist, Booking, Availability } from '../models';
import { extractWeeklyTemplate, formatSlotTime, normalizeDate, normalizeTime } from '../utils/schedule';
import { runBookingMaintenance } from '../services/bookingMaintenanceService';
import { createTherapistAccountAndInvite } from '../services/therapistInviteService';
import { sendEmail } from '../services/emailService';
import { bookingRescheduledEmail } from '../emails/templates/bookingRescheduled';
import { bookingCancelledEmail } from '../emails/templates/bookingCancelled';
import { sendData, sendError } from '../lib/http';
import {
    ACTIVE_BOOKING_STATUSES,
    type BookingStatus,
    releaseSlot,
    STATUS_TRANSITIONS,
    syncAvailabilityForStatus,
    VALID_BOOKING_STATUSES,
} from '../services/bookingStateService';

// Admin override: upsert a booked slot directly without requiring the therapist's weekly template.
const adminMarkSlotBooked = async (therapistId: string, date: string, time: string) => {
    const updated = await Availability.updateOne(
        { therapistId, date, 'slots.time': time },
        { $set: { 'slots.$.isBooked': true }, $unset: { 'slots.$.reservedUntil': 1, 'slots.$.reservedBookingId': 1 } }
    );
    if (updated.matchedCount === 0) {
        await Availability.findOneAndUpdate(
            { therapistId, date },
            { $push: { slots: { time, isBooked: true } } },
            { upsert: true }
        );
    }
};
const VALID_SESSION_TYPES = new Set(['video', 'phone', 'chat', 'audio']);

const normalizeSessionType = (value: string): 'video' | 'phone' | 'chat' | 'audio' | null => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!VALID_SESSION_TYPES.has(normalized)) return null;
    return normalized as 'video' | 'phone' | 'chat' | 'audio';
};


export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        await runBookingMaintenance();

        const totalUsers = await User.countDocuments();
        const totalTherapists = await Therapist.countDocuments();
        const totalBookings = await Booking.countDocuments();

        const revenueAgg = await Booking.aggregate([
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: null, revenue: { $sum: '$amount' } } },
        ]);
        const revenue = revenueAgg[0]?.revenue || 0;

        return sendData(res, {
            users: totalUsers,
            therapists: totalTherapists,
            bookings: totalBookings,
            revenue: revenue
        });
    } catch (error) {
        return sendError(res, 500, 'Server error fetching dashboard stats', { code: 'ADMIN_STATS_FAILED' });
    }
};

// --- USERS ---

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return sendData(res, users);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching users', { code: 'ADMIN_USERS_LIST_FAILED' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return sendError(res, 400, 'User already exists', { code: 'ADMIN_USER_EXISTS' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            isVerified: true,
        });

        return sendData(res, {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }, 201);
    } catch (error) {
        return sendError(res, 500, 'Server error creating user', { code: 'ADMIN_USER_CREATE_FAILED' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        if (email && String(email).trim().toLowerCase() !== user.email) {
            const existing = await User.findOne({ email: String(email).trim().toLowerCase(), _id: { $ne: user._id } }).select('_id');
            if (existing) {
                return sendError(res, 400, 'Email is already in use', { code: 'AUTH_EMAIL_IN_USE' });
            }
        }

        user.name = name || user.name;
        user.email = email ? String(email).trim().toLowerCase() : user.email;
        user.role = role || user.role;

        await user.save();
        return sendData(res, { success: true, user });
    } catch (error) {
        return sendError(res, 500, 'Server error updating user', { code: 'ADMIN_USER_UPDATE_FAILED' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }
        return sendData(res, { success: true, message: 'User deleted' });
    } catch (error) {
        return sendError(res, 500, 'Server error deleting user', { code: 'ADMIN_USER_DELETE_FAILED' });
    }
};

// --- THERAPISTS ---

export const getTherapists = async (req: Request, res: Response) => {
    try {
        const therapists = await Therapist.find().sort({ createdAt: -1 });
        const mappedTherapists = therapists.map((t) => {
            const obj = t.toObject();
            return {
                ...obj,
                about: t.bio,
                weeklyAvailability: obj.weeklyAvailability?.length
                    ? obj.weeklyAvailability
                    : extractWeeklyTemplate(obj),
            };
        });
        return sendData(res, mappedTherapists);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching therapists', { code: 'ADMIN_THERAPIST_LIST_FAILED' });
    }
};

export const getTherapistById = async (req: Request, res: Response) => {
    try {
        const therapist = await Therapist.findById(req.params.id);
        if (!therapist) {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }
        const obj = therapist.toObject();
        return sendData(res, {
            ...obj,
            about: therapist.bio,
            weeklyAvailability: obj.weeklyAvailability?.length
                ? obj.weeklyAvailability
                : extractWeeklyTemplate(obj),
        });
    } catch (error) {
        return sendError(res, 500, 'Server error fetching therapist details', { code: 'ADMIN_THERAPIST_GET_FAILED' });
    }
};

export const createTherapist = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body };
        const portalAccess = payload.portalAccess;
        delete payload.portalAccess;

        if (portalAccess?.create && !payload.email) {
            return sendError(res, 400, 'Email is required to send therapist portal invite', { code: 'THERAPIST_EMAIL_REQUIRED' });
        }

        if (payload.email !== undefined) {
            payload.email = String(payload.email || '').trim().toLowerCase() || undefined;
        }

        if (payload.about && !payload.bio) {
            payload.bio = payload.about;
        }
        payload.weeklyAvailability = extractWeeklyTemplate(payload);
        const therapist = await Therapist.create(payload);

        let portalAccessResult: any = undefined;
        if (portalAccess?.create && payload.email) {
            try {
                const created = await createTherapistAccountAndInvite({
                    therapistId: String(therapist._id),
                    email: String(payload.email),
                });
                portalAccessResult = created.ok ? { created: true } : { created: false, error: created.error };
            } catch (error: any) {
                portalAccessResult = { created: false, error: 'Failed to create therapist portal account' };
            }
        }

        const response = therapist.toObject();
        if (portalAccessResult) {
            (response as any).portalAccess = portalAccessResult;
        }
        return sendData(res, response, 201);
    } catch (error) {
        return sendError(res, 400, 'Invalid data for creating therapist', { code: 'ADMIN_THERAPIST_CREATE_INVALID' });
    }
};

export const updateTherapist = async (req: Request, res: Response) => {
    try {
        const { name, specialties, price, about, bio, profileImage, email } = req.body;
        const therapist = await Therapist.findById(req.params.id);

        if (!therapist) {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }

        therapist.name = name || therapist.name;
        therapist.specialties = specialties || therapist.specialties;
        therapist.price = price || therapist.price;
        therapist.bio = bio || about || therapist.bio;
        if (email !== undefined) {
            (therapist as any).email = String(email || '').trim().toLowerCase() || undefined;
        }

        // Handle other fields from req.body
        const optionalFields = ['languages', 'sessionTypes', 'responseRate', 'totalSessions', 'faq', 'availability', 'profileImage', 'experienceYears', 'credentials'];
        optionalFields.forEach(field => {
            if (req.body[field] !== undefined) {
                (therapist as any)[field] = req.body[field];
            }
        });

        if (req.body.weeklyAvailability !== undefined || req.body.availability !== undefined) {
            (therapist as any).weeklyAvailability = extractWeeklyTemplate({
                weeklyAvailability: req.body.weeklyAvailability,
                availability: req.body.availability,
            });
        }

        await therapist.save();
        return sendData(res, { success: true, therapist });
    } catch (error) {
        return sendError(res, 500, 'Server error updating therapist', { code: 'ADMIN_THERAPIST_UPDATE_FAILED' });
    }
};

export const deleteTherapist = async (req: Request, res: Response) => {
    try {
        const therapist = await Therapist.findByIdAndDelete(req.params.id);
        if (!therapist) {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }
        return sendData(res, { success: true, message: 'Therapist deleted' });
    } catch (error) {
        return sendError(res, 500, 'Server error deleting therapist', { code: 'ADMIN_THERAPIST_DELETE_FAILED' });
    }
};

// --- BOOKINGS ---

export const getBookings = async (req: Request, res: Response) => {
    try {
        await runBookingMaintenance();
        const { therapistId } = req.query;
        let query: any = {};

        if (therapistId) {
            query.therapistId = therapistId;
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'name email')
            .populate('therapistId', 'name')
            .sort({ createdAt: -1 });

        return sendData(res, bookings);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching bookings', { code: 'ADMIN_BOOKINGS_LIST_FAILED' });
    }
};

export const createBooking = async (req: Request, res: Response) => {
    try {
        const { userId, therapistId, date, time, sessionType, status } = req.body;
        const normalizedDate = normalizeDate(String(date));
        const normalizedTime = normalizeTime(String(time));
        const normalizedSessionType = normalizeSessionType(String(sessionType));
        const normalizedStatus = String(status || 'confirmed').toLowerCase() as BookingStatus;

        if (!userId || !therapistId || !normalizedDate || !normalizedTime || !normalizedSessionType) {
            return sendError(res, 400, 'userId, therapistId, date, time and valid sessionType are required', {
                code: 'ADMIN_BOOKING_FIELDS_REQUIRED',
            });
        }
        if (!VALID_BOOKING_STATUSES.has(normalizedStatus)) {
            return sendError(res, 400, 'Invalid booking status', { code: 'BOOKING_STATUS_INVALID' });
        }

        const user = await User.findById(userId).select('_id');
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }

        if (normalizedStatus !== 'cancelled') {
            const existing = await Booking.findOne({
                therapistId,
                date: normalizedDate,
                time: normalizedTime,
                status: { $in: ACTIVE_BOOKING_STATUSES },
            }).select('_id');
            if (existing) {
                return sendError(res, 409, 'Slot already has an active booking', { code: 'BOOKING_SLOT_CONFLICT' });
            }
        }

        const booking = await Booking.create({
            userId,
            therapistId,
            date: normalizedDate,
            time: normalizedTime,
            sessionType: normalizedSessionType,
            amount: Math.round(Number(therapist.price || 0)),
            status: normalizedStatus,
        });

        if (normalizedStatus === 'confirmed' || normalizedStatus === 'completed') {
            await adminMarkSlotBooked(String(therapistId), normalizedDate, normalizedTime);
        }

        return sendData(res, booking, 201);
    } catch (error) {
        return sendError(res, 500, 'Server error creating booking', { code: 'ADMIN_BOOKING_CREATE_FAILED' });
    }
};
export const updateAdminProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { name, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        if (email && String(email).trim().toLowerCase() !== user.email) {
            const existing = await User.findOne({ email: String(email).trim().toLowerCase(), _id: { $ne: userId } }).select('_id');
            if (existing) {
                return sendError(res, 400, 'Email is already in use', { code: 'AUTH_EMAIL_IN_USE' });
            }
        }

        user.name = name || user.name;
        user.email = email ? String(email).trim().toLowerCase() : user.email;

        await user.save();

        return sendData(res, {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        return sendError(res, 500, 'Server error updating admin profile', { code: 'ADMIN_PROFILE_UPDATE_FAILED' });
    }
};

export const updateAdminPassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 400, 'Current password and new password are required', {
                code: 'AUTH_PASSWORD_FIELDS_REQUIRED',
            });
        }
        if (String(newPassword).length < 8) {
            return sendError(res, 400, 'New password must be at least 8 characters long', {
                code: 'AUTH_PASSWORD_TOO_SHORT',
            });
        }

        const user = await User.findById(userId);
        if (!user || !user.password) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendError(res, 400, 'Incorrect current password', { code: 'AUTH_PASSWORD_INCORRECT' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        return sendData(res, { success: true, message: 'Password updated successfully' });
    } catch (error) {
        return sendError(res, 500, 'Server error updating password', { code: 'ADMIN_PASSWORD_UPDATE_FAILED' });
    }
};
export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('userId', 'name email').populate('therapistId', 'name');

        if (!booking) {
            return sendError(res, 404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
        }

        const recipientEmail = (booking.userId as any)?.email || booking.guestContact?.email;
        const recipientName = (booking.userId as any)?.name || booking.guestContact?.name || 'there';
        const therapistName = (booking.therapistId as any)?.name || 'your therapist';
        const previousDate = booking.date;
        const previousTime = booking.time;
        let didReschedule = false;
        let didCancel = false;

        // Reject combined reschedule+status — reschedule saves to DB first; if status sync
        // then fails the booking ends up with new date/time but old status (inconsistent state).
        if ((req.body?.reschedule?.date || req.body?.reschedule?.time) && req.body?.status !== undefined) {
            return sendError(res, 400, 'Cannot reschedule and change status in the same request. Apply each change separately.', {
                code: 'BOOKING_UPDATE_CONFLICT',
            });
        }

        // Reschedule (admin) — bypasses availability template check
        if (req.body?.reschedule?.date || req.body?.reschedule?.time) {
            const nextDate = normalizeDate(String(req.body.reschedule.date));
            const nextTime = normalizeTime(String(req.body.reschedule.time));
            if (!nextDate || !nextTime) {
                return sendError(res, 400, 'Invalid reschedule date/time', { code: 'BOOKING_RESCHEDULE_INVALID' });
            }
            const therapistId = String((booking.therapistId as any)?._id || booking.therapistId);
            const conflict = await Booking.findOne({
                _id: { $ne: booking._id },
                therapistId,
                date: nextDate,
                time: nextTime,
                status: { $in: ACTIVE_BOOKING_STATUSES },
            }).select('_id');
            if (conflict) {
                return sendError(res, 409, 'Another active booking already exists for this slot', { code: 'BOOKING_RESCHEDULE_CONFLICT' });
            }
            await adminMarkSlotBooked(therapistId, nextDate, nextTime);
            if (booking.status === 'confirmed' || booking.status === 'pending') {
                await releaseSlot(therapistId, booking.date, booking.time);
            }
            booking.date = nextDate;
            booking.time = nextTime;
            await booking.save();
            didReschedule = true;
        }

        // Meeting link update
        if (req.body?.meetingLink !== undefined) {
            booking.meetingLink = String(req.body.meetingLink || '').trim() || undefined;
            await booking.save();
        }

        // Status transition update (legacy route name)
        if (req.body?.status !== undefined) {
            const status = String(req.body.status || '').toLowerCase() as BookingStatus;
            if (!VALID_BOOKING_STATUSES.has(status)) {
                return sendError(res, 400, 'Invalid booking status', { code: 'BOOKING_STATUS_INVALID' });
            }

            if (booking.status !== status) {
                if (!STATUS_TRANSITIONS[booking.status]?.includes(status)) {
                    return sendError(res, 400, `Cannot transition booking from ${booking.status} to ${status}`, {
                        code: 'BOOKING_STATUS_TRANSITION_INVALID',
                    });
                }

                const wasBooked = booking.status === 'confirmed' || booking.status === 'completed';
                const shouldBeBooked = status === 'confirmed' || status === 'completed';

                if (shouldBeBooked && !wasBooked) {
                    const conflictingBooking = await Booking.findOne({
                        _id: { $ne: booking._id },
                        therapistId: booking.therapistId,
                        date: booking.date,
                        time: booking.time,
                        status: { $in: ACTIVE_BOOKING_STATUSES },
                    }).select('_id');
                    if (conflictingBooking) {
                        return sendError(res, 409, 'Another active booking already exists for this slot', {
                            code: 'BOOKING_SLOT_CONFLICT',
                        });
                    }
                }

                const previousStatus = booking.status;
                booking.status = status;
                await booking.save();
                const syncResult = await syncAvailabilityForStatus(booking, status, previousStatus);
                if (!syncResult.ok) {
                    booking.status = previousStatus;
                    await booking.save();
                    return sendError(res, 409, syncResult.error || 'Failed to sync availability', {
                        code: 'BOOKING_AVAILABILITY_SYNC_FAILED',
                    });
                }
                if (status === 'cancelled') {
                    didCancel = true;
                }
            }
        }

        if (recipientEmail) {
            if (didReschedule) {
                const tpl = bookingRescheduledEmail({
                    recipientName,
                    therapistName,
                    previousDate,
                    previousTime: formatSlotTime(previousTime),
                    nextDate: booking.date,
                    nextTime: formatSlotTime(booking.time),
                    ...(booking.meetingLink ? { meetingLink: booking.meetingLink } : {}),
                });
                await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
            } else if (didCancel) {
                const tpl = bookingCancelledEmail({
                    recipientName,
                    therapistName,
                    date: booking.date,
                    time: formatSlotTime(booking.time),
                });
                await sendEmail({ to: recipientEmail, subject: tpl.subject, html: tpl.html });
            }
        }

        const populated = await Booking.findById(booking._id).populate('userId', 'name email').populate('therapistId', 'name');
        return sendData(res, { success: true, booking: populated });
    } catch (error) {
        return sendError(res, 500, 'Server error updating booking', { code: 'ADMIN_BOOKING_UPDATE_FAILED' });
    }
};

export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return sendError(res, 404, 'Booking not found', { code: 'BOOKING_NOT_FOUND' });
        }

        if (booking.status !== 'cancelled') {
            const syncResult = await syncAvailabilityForStatus(booking, 'cancelled', booking.status);
            if (!syncResult.ok) {
                return sendError(res, 409, syncResult.error || 'Failed to release availability for booking delete', {
                    code: 'BOOKING_AVAILABILITY_RELEASE_FAILED',
                });
            }
        }
        await booking.deleteOne();

        return sendData(res, { success: true, message: 'Booking deleted' });
    } catch (error) {
        return sendError(res, 500, 'Server error deleting booking', { code: 'ADMIN_BOOKING_DELETE_FAILED' });
    }
};
