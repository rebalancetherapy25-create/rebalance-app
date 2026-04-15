import express from 'express';
import {
    registerUser,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    loginUser,
    logoutUser,
    refreshToken,
    getMe,
    updateMe,
    updateMyPassword
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit';
import { validate } from '../lib/http';
import { authSchemas } from '../validation/schemas';

const router = express.Router();

router.post('/register', authLimiter, validate(authSchemas.register), registerUser);
router.post('/verify-otp', otpLimiter, validate(authSchemas.verifyOtp), verifyOtp);
router.post('/resend-otp', otpLimiter, validate(authSchemas.resendOtp), resendOtp);
router.post('/forgot-password', otpLimiter, validate(authSchemas.forgotPassword), forgotPassword);
router.post('/reset-password', otpLimiter, validate(authSchemas.resetPassword), resetPassword);
router.post('/login', authLimiter, validate(authSchemas.login), loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/me', protect, validate(authSchemas.updateProfile), updateMe);
router.put('/password', protect, validate(authSchemas.updatePassword), updateMyPassword);

export default router;
