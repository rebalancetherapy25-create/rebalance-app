import express from 'express';
import { getTherapistAvailability, lockSlot, setAvailability } from '../controllers/availabilityController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/:therapistId')
    .get(getTherapistAvailability);

router.post('/:therapistId/lock', protect, lockSlot);

router.post('/', protect, adminOnly, setAvailability);

export default router;
