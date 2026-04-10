import express from 'express';
import { protectTherapist } from '../middlewares/therapistAuthMiddleware';
import {
    getTherapistAvailabilityRange,
    putTherapistAvailabilityForDate,
    getTherapistBookings,
    getTherapistBookingById,
    updateTherapistBooking,
} from '../controllers/therapistPortalController';

const router = express.Router();

router.use(protectTherapist);

router.get('/availability', getTherapistAvailabilityRange);
router.put('/availability/:date', putTherapistAvailabilityForDate);

router.get('/bookings', getTherapistBookings);
router.get('/bookings/:id', getTherapistBookingById);
router.put('/bookings/:id', updateTherapistBooking);

export default router;

