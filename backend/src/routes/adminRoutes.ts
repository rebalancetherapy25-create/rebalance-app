import express from 'express';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import {
    getDashboardStats,
    getUsers,
    updateUser,
    deleteUser,
    createUser,
    getTherapists,
    getTherapistById,
    updateTherapist,
    deleteTherapist,
    createTherapist,
    getBookings,
    updateBookingStatus,
    createBooking,
    deleteBooking,
    updateAdminProfile,
    updateAdminPassword,
    getTherapistReviews,
    createTherapistReview,
    deleteTherapistReview,
    uploadTherapistImageAdmin
} from '../controllers/adminController';
import {
    listTherapistAccounts,
    createTherapistAccount,
    updateTherapistAccount,
} from '../controllers/adminTherapistAccountController';
import {
    getAdminAvailabilityRange,
    putAdminAvailabilityForDate,
    generateAdminAvailabilityRange,
    adminReleaseHoldsNow,
} from '../controllers/adminAvailabilityController';
import { validate } from '../lib/http';
import { adminSchemas } from '../validation/schemas';
import { therapistImageUpload } from '../config/cloudinary';

const router = express.Router();

// All routes here are protected and require admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);

router.route('/users')
    .get(getUsers)
    .post(validate(adminSchemas.createUser), createUser);
router.route('/users/:id')
    .put(validate(adminSchemas.updateUser), updateUser)
    .delete(deleteUser);

router.route('/therapists')
    .get(getTherapists)
    .post(createTherapist);
router.route('/therapists/:id')
    .get(getTherapistById)
    .put(updateTherapist)
    .delete(deleteTherapist);

router.post('/therapists/:id/image', therapistImageUpload.single('image'), uploadTherapistImageAdmin);

router.route('/therapists/:id/reviews')
    .get(getTherapistReviews)
    .post(createTherapistReview);
router.delete('/therapists/:id/reviews/:reviewId', deleteTherapistReview);

router.route('/bookings')
    .get(getBookings)
    .post(validate(adminSchemas.createBooking), createBooking);
router.route('/bookings/:id')
    .put(validate(adminSchemas.updateBooking), updateBookingStatus)
    .delete(deleteBooking);

router.put('/settings/profile', updateAdminProfile);
router.put('/settings/password', updateAdminPassword);

router.route('/therapist-accounts')
    .get(listTherapistAccounts)
    .post(validate(adminSchemas.createTherapistAccount), createTherapistAccount);
router.put('/therapist-accounts/:id', validate(adminSchemas.updateTherapistAccount), updateTherapistAccount);

router.post('/availability/release-holds', adminReleaseHoldsNow);
router.get('/availability/:therapistId', getAdminAvailabilityRange);
router.put('/availability/:therapistId/:date', putAdminAvailabilityForDate);
router.post('/availability/:therapistId/generate', generateAdminAvailabilityRange);

export default router;
