import express from 'express';
import { getTherapistAvailability, lockSlot, setAvailability } from '../controllers/availabilityController';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { bookingLimiter } from '../middlewares/rateLimit';
import { validate } from '../lib/http';
import { bookingSchemas } from '../validation/schemas';

const router = express.Router();

router.route('/:therapistId')
    .get(getTherapistAvailability);

router.post('/:therapistId/lock', bookingLimiter, protect, validate(bookingSchemas.lockSlot), lockSlot);

router.post('/', protect, adminOnly, validate(bookingSchemas.setAvailability), setAvailability);

export default router;
