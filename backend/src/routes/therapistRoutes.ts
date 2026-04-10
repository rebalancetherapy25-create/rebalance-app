import express from 'express';
import { getTherapists, getTherapistById, createTherapist } from '../controllers/therapistController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/')
    .get(getTherapists)
    .post(protect, adminOnly, createTherapist);

router.route('/:id')
    .get(getTherapistById);

export default router;
