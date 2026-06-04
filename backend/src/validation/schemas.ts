import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address.').transform((value) => value.toLowerCase());
const password = z.string().min(8, 'Password must be at least 8 characters long.');
const objectId = z.string().trim().min(1, 'Value is required.');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
const timeLike = z.string().trim().min(1, 'Time is required.');
const availabilitySlotValue = z.union([
    z.string().trim().min(1),
    z.object({
        time: z.string().trim().min(1),
        isBooked: z.boolean().optional(),
        reservedUntil: z.string().optional(),
    }),
]);
const therapistAvailabilitySlotValue = z.union([
    z.string().trim().min(1),
    z.object({
        time: z.string().trim().min(1),
    }),
]);

export const authSchemas = {
    register: z.object({
        name: z.string().trim().min(2, 'Full name must be at least 2 characters long.'),
        email,
        password,
    }),
    verifyOtp: z.object({
        email,
        otp: z.string().trim().length(6, 'OTP must be 6 digits.'),
    }),
    resendOtp: z.object({
        email,
    }),
    login: z.object({
        email,
        password: z.string().min(1, 'Password is required.'),
    }),
    forgotPassword: z.object({
        email,
    }),
    resetPassword: z.object({
        token: z.string().trim().min(1, 'Reset token is required.'),
        password,
    }),
    updateProfile: z.object({
        name: z.string().trim().min(2, 'Full name must be at least 2 characters long.').optional(),
        email: email.optional(),
    }).refine((value) => value.name !== undefined || value.email !== undefined, {
        message: 'Provide at least one field to update.',
        path: ['name'],
    }),
    updatePassword: z.object({
        currentPassword: z.string().min(1, 'Current password is required.'),
        newPassword: password,
    }),
};

export const therapistAuthSchemas = {
    login: authSchemas.login,
    updatePassword: z.object({
        currentPassword: z.string().min(1, 'Current password is required.'),
        newPassword: password,
    }),
};

export const bookingSchemas = {
    create: z.object({
        therapistId: objectId,
        date: isoDate,
        time: timeLike,
        sessionType: z.preprocess((val) => typeof val === 'string' ? val.toLowerCase() : val, z.enum(['video', 'phone', 'chat', 'audio'])),
        name: z.string().trim().min(2, 'Full name must be at least 2 characters long.').optional(),
        email: email.optional(),
        couponCode: z.string().trim().optional(),
    }),
    verifyPayment: z.object({
        razorpay_order_id: z.string().trim().min(1, 'razorpay_order_id is required'),
        razorpay_payment_id: z.string().trim().min(1, 'razorpay_payment_id is required'),
        razorpay_signature: z.string().trim().min(1, 'razorpay_signature is required'),
        bookingId: objectId,
    }),
    lockSlot: z.object({
        date: isoDate,
        time: timeLike,
    }),
    setAvailability: z.object({
        therapistId: objectId,
        date: isoDate,
        slots: z.array(availabilitySlotValue).default([]),
    }),
};

export const therapistPortalSchemas = {
    putAvailabilityForDate: z.object({
        slots: z.array(therapistAvailabilitySlotValue).default([]),
    }),
    updateBooking: z.object({
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
        meetingLink: z.string().trim().optional(),
        reschedule: z.object({
            date: isoDate,
            time: timeLike,
        }).partial().optional(),
    }),
};

export const adminSchemas = {
    createUser: z.object({
        name: z.string().trim().min(2),
        email,
        password,
        role: z.enum(['user', 'admin']).optional(),
    }),
    updateUser: z.object({
        name: z.string().trim().min(2).optional(),
        email: email.optional(),
        role: z.enum(['user', 'admin']).optional(),
    }),
    createBooking: z.object({
        userId: objectId.optional(),
        therapistId: objectId,
        date: isoDate,
        time: timeLike,
        sessionType: z.preprocess((val) => typeof val === 'string' ? val.toLowerCase() : val, z.enum(['video', 'phone', 'chat', 'audio'])),
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
    }),
    updateBooking: z.object({
        status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
        meetingLink: z.string().trim().optional(),
        reschedule: z.object({
            date: isoDate,
            time: timeLike,
        }).partial().optional(),
    }),
    createTherapistAccount: z.object({
        therapistId: objectId,
        email,
        password: z.string().min(8).optional(),
        status: z.enum(['active', 'suspended']).optional(),
    }),
    updateTherapistAccount: z.object({
        email: email.optional(),
        password: z.string().min(8).optional(),
        status: z.enum(['active', 'suspended']).optional(),
    }),
    bannerCreate: z.object({
        title: z.string().trim().min(2, 'Banner title is required.'),
        isActive: z.union([z.boolean(), z.string()]).optional(),
        imageUrl: z.string().trim().url('Banner image URL must be valid.').optional(),
    }),
    bannerUpdate: z.object({
        title: z.string().trim().min(2, 'Banner title is required.').optional(),
        isActive: z.union([z.boolean(), z.string()]).optional(),
        imageUrl: z.string().trim().url('Banner image URL must be valid.').optional(),
    }),
    offerBannerCreate: z.object({
        type: z.enum(['text', 'image']).default('text'),
        text: z.string().trim().optional(),
        code: z.string().trim().optional(),
        link: z.string().trim().optional(),
        mobileImageUrl: z.string().trim().optional(),
        desktopImageUrl: z.string().trim().optional(),
        isActive: z.union([z.boolean(), z.string()]).optional(),
    }),
    offerBannerUpdate: z.object({
        type: z.enum(['text', 'image']).optional(),
        text: z.string().trim().optional(),
        code: z.string().trim().optional(),
        link: z.string().trim().optional(),
        mobileImageUrl: z.string().trim().optional(),
        desktopImageUrl: z.string().trim().optional(),
        isActive: z.union([z.boolean(), z.string()]).optional(),
    }),
    rangeQuery: z.object({
        from: isoDate.optional(),
        to: isoDate.optional(),
        status: z.string().trim().optional(),
    }),
    couponCreate: z.object({
        code: z.string().trim().min(1, 'Coupon code is required.').toUpperCase(),
        discountPercentage: z.number().min(1).max(100),
        isActive: z.union([z.boolean(), z.string()]).optional(),
        expiresAt: z.string().optional(),
        maxUsage: z.number().optional(),
    }),
    couponUpdate: z.object({
        code: z.string().trim().toUpperCase().optional(),
        discountPercentage: z.number().min(1).max(100).optional(),
        isActive: z.union([z.boolean(), z.string()]).optional(),
        expiresAt: z.string().optional(),
        maxUsage: z.number().optional(),
    }),
};
