import express, { Request, Response, NextFunction } from 'express';
import { createBooking, verifyPayment, getUserBookings } from '../controllers/bookingController';
import { protect } from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import config from '../config/env';

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

router.post('/create', optionalProtect, createBooking);
router.post('/verify', optionalProtect, verifyPayment);
router.get('/my-bookings', protect, getUserBookings);

export default router;
