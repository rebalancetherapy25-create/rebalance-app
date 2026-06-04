import express from 'express';
import { protectTherapist } from '../middlewares/therapistAuthMiddleware';
import {
    getTherapistAvailabilityRange,
    putTherapistAvailabilityForDate,
    getTherapistWeeklySchedule,
    putTherapistWeeklySchedule,
    getTherapistBookings,
    getTherapistBookingById,
    updateTherapistBooking,
} from '../controllers/therapistPortalController';
import { validate } from '../lib/http';
import { therapistPortalSchemas } from '../validation/schemas';

const router = express.Router();

router.use(protectTherapist);

router.get('/weekly-schedule', getTherapistWeeklySchedule);
router.put('/weekly-schedule', putTherapistWeeklySchedule);
router.get('/availability', getTherapistAvailabilityRange);
router.put('/availability/:date', validate(therapistPortalSchemas.putAvailabilityForDate), putTherapistAvailabilityForDate);

router.get('/bookings', getTherapistBookings);
router.get('/bookings/:id', getTherapistBookingById);
router.put('/bookings/:id', validate(therapistPortalSchemas.updateBooking), updateTherapistBooking);

export default router;
