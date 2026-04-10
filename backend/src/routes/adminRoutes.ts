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
    updateAdminPassword
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

const router = express.Router();

// All routes here are protected and require admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);

router.route('/users')
    .get(getUsers)
    .post(createUser);
router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

router.route('/therapists')
    .get(getTherapists)
    .post(createTherapist);
router.route('/therapists/:id')
    .get(getTherapistById)
    .put(updateTherapist)
    .delete(deleteTherapist);

router.route('/bookings')
    .get(getBookings)
    .post(createBooking);
router.route('/bookings/:id')
    .put(updateBookingStatus)
    .delete(deleteBooking);

router.put('/settings/profile', updateAdminProfile);
router.put('/settings/password', updateAdminPassword);

router.route('/therapist-accounts')
    .get(listTherapistAccounts)
    .post(createTherapistAccount);
router.put('/therapist-accounts/:id', updateTherapistAccount);

router.get('/availability/:therapistId', getAdminAvailabilityRange);
router.put('/availability/:therapistId/:date', putAdminAvailabilityForDate);
router.post('/availability/:therapistId/generate', generateAdminAvailabilityRange);
router.post('/availability/release-holds', adminReleaseHoldsNow);

export default router;
