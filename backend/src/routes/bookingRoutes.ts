import express, { Request, Response, NextFunction } from 'express';
import { createBooking, verifyPayment, getUserBookings } from '../controllers/bookingController';
import { protect } from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { bookingLimiter } from '../middlewares/rateLimit';
import { validate } from '../lib/http';
import { bookingSchemas } from '../validation/schemas';

const router = express.Router();

// Provide req.user from access token only — never from refresh token.
// Refresh tokens are solely for issuing new access tokens, not for authorising API requests.
const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            (req as any).user = decoded;
        } catch {
            // Expired / invalid access token — treat as guest, do not fall back to refresh token
        }
    }
    next();
};

router.post('/create', bookingLimiter, optionalProtect, validate(bookingSchemas.create), createBooking);
router.post('/verify', bookingLimiter, optionalProtect, validate(bookingSchemas.verifyPayment), verifyPayment);
router.get('/my-bookings', protect, getUserBookings);

export default router;
