import rateLimit from 'express-rate-limit';
import { sendError } from '../lib/http';

const buildLimiter = (windowMs: number, max: number, code: string, message: string) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, 429, message, { code }),
});

export const apiLimiter = buildLimiter(15 * 60 * 1000, 400, 'RATE_LIMIT_API', 'Too many requests. Please try again shortly.');
export const authLimiter = buildLimiter(15 * 60 * 1000, 20, 'RATE_LIMIT_AUTH', 'Too many authentication attempts. Please wait before trying again.');
export const otpLimiter = buildLimiter(10 * 60 * 1000, 8, 'RATE_LIMIT_OTP', 'Too many verification attempts. Please wait before requesting another code.');
export const bookingLimiter = buildLimiter(10 * 60 * 1000, 30, 'RATE_LIMIT_BOOKING', 'Too many booking requests. Please slow down and try again.');
