import express, { Request, Response, NextFunction } from 'express';
import { createBooking, verifyPayment, getUserBookings } from '../controllers/bookingController';
import { protect } from '../middlewares/authMiddleware';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { User } from '../models';

const router = express.Router();

// Helper to provide req.user if token exists, but don't block if it doesn't
const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            (req as any).user = decoded;
        } catch (err) {
            // Ignore token error for guest flow
        }
    }
    const refreshToken = req.cookies.refreshToken;
    if (!(req as any).user && refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
            const user = await User.findById(decoded.userId).select('role refreshToken');
            if (user && user.refreshToken === refreshToken) {
                (req as any).user = { userId: String(user._id), role: user.role };
            }
        } catch {
            // Ignore refresh token error for guest flow
        }
    }
    next();
};

router.post('/create', optionalProtect, createBooking);
router.post('/verify', optionalProtect, verifyPayment);
router.get('/my-bookings', protect, getUserBookings);

export default router;
