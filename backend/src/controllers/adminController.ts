import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, Therapist, Booking } from '../models';
import { extractWeeklyTemplate, normalizeDate, normalizeTime } from '../utils/schedule';
import { runBookingMaintenance } from '../services/bookingMaintenanceService';
import { createTherapistAccountAndInvite } from '../services/therapistInviteService';
import { sendEmail } from '../services/emailService';
import { bookingRescheduledEmail } from '../emails/templates/bookingRescheduled';
import { bookingCancelledEmail } from '../emails/templates/bookingCancelled';
import {
    ACTIVE_BOOKING_STATUSES,
    type BookingStatus,
    rescheduleBooking,
    STATUS_TRANSITIONS,
    syncAvailabilityForStatus,
    VALID_BOOKING_STATUSES,
} from '../services/bookingStateService';
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

        res.status(200).json({
            users: totalUsers,
            therapists: totalTherapists,
            bookings: totalBookings,
            revenue: revenue
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
};

// --- USERS ---

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
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

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error creating user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (email && String(email).trim().toLowerCase() !== user.email) {
            const existing = await User.findOne({ email: String(email).trim().toLowerCase(), _id: { $ne: user._id } }).select('_id');
            if (existing) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
        }

        user.name = name || user.name;
        user.email = email ? String(email).trim().toLowerCase() : user.email;
        user.role = role || user.role;

        await user.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting user' });
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
        res.status(200).json(mappedTherapists);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching therapists' });
    }
};

export const getTherapistById = async (req: Request, res: Response) => {
    try {
        const therapist = await Therapist.findById(req.params.id);
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }
        const obj = therapist.toObject();
        res.status(200).json({
            ...obj,
            about: therapist.bio,
            weeklyAvailability: obj.weeklyAvailability?.length
                ? obj.weeklyAvailability
                : extractWeeklyTemplate(obj),
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching therapist details' });
    }
};

export const createTherapist = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body };
        const portalAccess = payload.portalAccess;
        delete payload.portalAccess;

        if (portalAccess?.create && !payload.email) {
            return res.status(400).json({ error: 'Email is required to send therapist portal invite' });
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
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data for creating therapist' });
    }
};

export const updateTherapist = async (req: Request, res: Response) => {
    try {
        const { name, specialties, price, about, bio, profileImage, email } = req.body;
        const therapist = await Therapist.findById(req.params.id);

        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
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
        res.status(200).json({ success: true, therapist });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating therapist' });
    }
};

export const deleteTherapist = async (req: Request, res: Response) => {
    try {
        const therapist = await Therapist.findByIdAndDelete(req.params.id);
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }
        res.status(200).json({ success: true, message: 'Therapist deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting therapist' });
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

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching bookings' });
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
            return res.status(400).json({ error: 'userId, therapistId, date, time and valid sessionType are required' });
        }
        if (!VALID_BOOKING_STATUSES.has(normalizedStatus)) {
            return res.status(400).json({ error: 'Invalid booking status' });
        }

        const user = await User.findById(userId).select('_id');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const therapist = await Therapist.findById(therapistId);
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }

        if (normalizedStatus !== 'cancelled') {
            const existing = await Booking.findOne({
                therapistId,
                date: normalizedDate,
                time: normalizedTime,
                status: { $in: ACTIVE_BOOKING_STATUSES },
            }).select('_id');
            if (existing) {
                return res.status(409).json({ error: 'Slot already has an active booking' });
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
            const syncResult = await syncAvailabilityForStatus(booking, normalizedStatus, 'pending');
            if (!syncResult.ok) {
                await booking.deleteOne();
                return res.status(409).json({ error: syncResult.error || 'Failed to sync availability' });
            }
        }

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating booking' });
    }
};
export const updateAdminProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { name, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (email && String(email).trim().toLowerCase() !== user.email) {
            const existing = await User.findOne({ email: String(email).trim().toLowerCase(), _id: { $ne: userId } }).select('_id');
            if (existing) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
        }

        user.name = name || user.name;
        user.email = email ? String(email).trim().toLowerCase() : user.email;

        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating admin profile' });
    }
};

export const updateAdminPassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        if (String(newPassword).length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        const user = await User.findById(userId);
        if (!user || !user.password) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating password' });
    }
};
export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('userId', 'name email').populate('therapistId', 'name');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
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
            return res.status(400).json({ error: 'Cannot reschedule and change status in the same request. Apply each change separately.' });
        }

        // Reschedule (admin)
        if (req.body?.reschedule?.date || req.body?.reschedule?.time) {
            const nextDate = normalizeDate(String(req.body.reschedule.date));
            const nextTime = normalizeTime(String(req.body.reschedule.time));
            if (!nextDate || !nextTime) {
                return res.status(400).json({ error: 'Invalid reschedule date/time' });
            }
            const therapistId = String((booking.therapistId as any)?._id || booking.therapistId);
            const result = await rescheduleBooking(String(booking._id), therapistId, nextDate, nextTime);
            if (!result.ok) return res.status(result.status).json({ error: result.error });
            didReschedule = true;
            booking.date = nextDate;
            booking.time = nextTime;
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
                return res.status(400).json({ error: 'Invalid booking status' });
            }

            if (booking.status !== status) {
                if (!STATUS_TRANSITIONS[booking.status]?.includes(status)) {
                    return res.status(400).json({ error: `Cannot transition booking from ${booking.status} to ${status}` });
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
                        return res.status(409).json({ error: 'Another active booking already exists for this slot' });
                    }
                }

                const previousStatus = booking.status;
                booking.status = status;
                await booking.save();
                const syncResult = await syncAvailabilityForStatus(booking, status, previousStatus);
                if (!syncResult.ok) {
                    booking.status = previousStatus;
                    await booking.save();
                    return res.status(409).json({ error: syncResult.error || 'Failed to sync availability' });
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
        res.status(200).json({ success: true, booking: populated });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating booking' });
    }
};

export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'cancelled') {
            const syncResult = await syncAvailabilityForStatus(booking, 'cancelled', booking.status);
            if (!syncResult.ok) {
                return res.status(409).json({ error: syncResult.error || 'Failed to release availability for booking delete' });
            }
        }
        await booking.deleteOne();

        res.status(200).json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting booking' });
    }
};
