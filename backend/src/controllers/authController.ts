import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { User } from '../models';
import { clearAuthCookies, generateTokens, setAuthCookies } from '../utils/jwt';
import { type AuthRequest } from '../middlewares/authMiddleware';
import config from '../config/env';
import { sendEmail } from '../services/emailService';
import { otpVerificationEmail } from '../emails/templates/otpVerification';
import { userPasswordResetEmail } from '../emails/templates/userPasswordReset';
import { sendData, sendError } from '../lib/http';
import { hashToken, tokenMatchesHash } from '../lib/security';

type SerializableUser = {
    _id: unknown;
    name: string;
    email: string;
    role: 'user' | 'admin';
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const createOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const formatUser = (user: { _id: unknown; name: string; email: string; role: 'user' | 'admin' }): SerializableUser => ({
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
});

const issueSession = async (res: Response, user: { _id: any; role: 'user' | 'admin'; save: () => Promise<unknown>; refreshToken?: string | undefined }) => {
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    setAuthCookies(res, accessToken, refreshToken);
};

const clearSession = async (res: Response, userId?: string) => {
    if (userId) {
        await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }
    clearAuthCookies(res);
};

const sendOtpEmail = async (email: string, otpCode: string) => {
    const tpl = otpVerificationEmail({ otpCode });
    return sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
};

const buildPasswordResetUrl = (token: string) => {
    const resetUrl = new URL('/reset-password', config.frontendUrl);
    resetUrl.searchParams.set('token', token);
    return resetUrl.toString();
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body as { name: string; email: string; password: string };
        const trimmedName = String(name).trim();
        const trimmedEmail = normalizeEmail(email);
        const userExists = await User.findOne({ email: trimmedEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (userExists) {
            if (userExists.isVerified) {
                return sendError(res, 400, 'User already exists', { code: 'AUTH_USER_EXISTS' });
            }

            userExists.name = trimmedName;
            userExists.password = hashedPassword;
            userExists.otpCode = createOtpCode();
            userExists.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
            await userExists.save();

            const emailSent = await sendOtpEmail(userExists.email, userExists.otpCode);
            if (!emailSent) {
                return sendError(res, 502, 'Unable to send the verification code right now. Please try again shortly.', {
                    code: 'EMAIL_SEND_FAILED',
                });
            }

            return sendData(res, {
                message: 'Your account already exists but is not verified. We sent a fresh verification code.',
                email: userExists.email,
            });
        }

        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            otpCode: createOtpCode(),
            otpExpiry: new Date(Date.now() + OTP_EXPIRY_MS),
        });

        const emailSent = await sendOtpEmail(user.email, user.otpCode ?? '');
        if (!emailSent) {
            return sendError(res, 502, 'Unable to send the verification code right now. Please try again shortly.', {
                code: 'EMAIL_SEND_FAILED',
            });
        }

        return sendData(res, { message: 'User registered. Please verify OTP.', email: user.email }, 201);
    } catch (error) {
        console.error('register user error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_REGISTER_FAILED' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body as { email: string; otp: string };
        const user = await User.findOne({ email: normalizeEmail(email) });
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        if (user.isVerified) {
            return sendError(res, 400, 'User is already verified', { code: 'AUTH_ALREADY_VERIFIED' });
        }

        if (user.otpCode !== otp || !user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
            return sendError(res, 400, 'Invalid or expired OTP', { code: 'AUTH_INVALID_OTP' });
        }

        user.isVerified = true;
        user.set({
            otpCode: undefined,
            otpExpiry: undefined,
        });

        await issueSession(res, user);
        return sendData(res, formatUser(user));
    } catch (error) {
        console.error('verify otp error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_VERIFY_FAILED' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body as { email: string };
        const user = await User.findOne({ email: normalizeEmail(email) });
        if (!user) return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        if (user.isVerified) return sendError(res, 400, 'User already verified', { code: 'AUTH_ALREADY_VERIFIED' });

        const otpCode = createOtpCode();
        user.otpCode = otpCode;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
        await user.save();

        const emailSent = await sendOtpEmail(user.email, otpCode);
        if (!emailSent) {
            return sendError(res, 502, 'Unable to resend the verification code right now. Please try again shortly.', {
                code: 'EMAIL_SEND_FAILED',
            });
        }

        return sendData(res, { message: 'OTP resent successfully' });
    } catch (error) {
        console.error('resend otp error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_RESEND_FAILED' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email: string; password: string };
        const user = await User.findOne({ email: normalizeEmail(email) });

        if (!user?.password || !(await bcrypt.compare(password, user.password))) {
            return sendError(res, 401, 'Invalid email or password', { code: 'AUTH_INVALID_CREDENTIALS' });
        }

        if (!user.isVerified) {
            return sendError(res, 403, 'Please verify your email to log in', {
                code: 'AUTH_EMAIL_UNVERIFIED',
                data: { unverified: true, email: user.email },
            });
        }

        await issueSession(res, user);
        return sendData(res, formatUser(user));
    } catch (error) {
        console.error('login user error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_LOGIN_FAILED' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body as { email: string };
        const trimmedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return sendData(res, { message: 'If an account exists for that email, a reset link has been sent.' });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), purpose: 'password-reset' },
            config.jwtRefreshSecret,
            { expiresIn: '1h' },
        );

        const resetUrl = buildPasswordResetUrl(token);
        const resetTpl = userPasswordResetEmail({ resetUrl });
        const emailSent = await sendEmail({ to: user.email, subject: resetTpl.subject, html: resetTpl.html });

        if (!emailSent) {
            return sendError(res, 502, 'Unable to send the reset email right now. Please try again shortly.', {
                code: 'EMAIL_SEND_FAILED',
            });
        }

        return sendData(res, { message: 'If an account exists for that email, a reset link has been sent.' });
    } catch (error) {
        console.error('forgot password error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_FORGOT_PASSWORD_FAILED' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body as { token: string; password: string };

        let decoded: { userId: string; purpose?: string };
        try {
            decoded = jwt.verify(String(token), config.jwtRefreshSecret) as { userId: string; purpose?: string };
        } catch {
            return sendError(res, 400, 'Reset link is invalid or has expired', { code: 'AUTH_INVALID_RESET_TOKEN' });
        }

        if (decoded.purpose !== 'password-reset') {
            return sendError(res, 400, 'Reset link is invalid or has expired', { code: 'AUTH_INVALID_RESET_TOKEN' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.set('refreshToken', undefined);
        await user.save();

        clearAuthCookies(res);
        return sendData(res, { message: 'Password reset successfully' });
    } catch (error) {
        console.error('reset password error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_RESET_PASSWORD_FAILED' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            clearAuthCookies(res);
            return sendError(res, 401, 'Refresh token missing', { code: 'AUTH_REFRESH_MISSING' });
        }

        const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (!user || !tokenMatchesHash(token, user.refreshToken)) {
            clearAuthCookies(res);
            return sendError(res, 401, 'Invalid refresh token', { code: 'AUTH_REFRESH_INVALID' });
        }

        await issueSession(res, user);
        return sendData(res, formatUser(user));
    } catch (error) {
        clearAuthCookies(res);
        return sendError(res, 401, 'Refresh token expired or invalid', { code: 'AUTH_REFRESH_EXPIRED' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return sendError(res, 401, 'Unauthorized', { code: 'AUTH_UNAUTHORIZED' });
        }

        const user = await User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        return sendData(res, formatUser(user as unknown as SerializableUser));
    } catch (error) {
        console.error('get me error', error);
        return sendError(res, 500, 'Server error', { code: 'AUTH_GET_ME_FAILED' });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, email } = req.body as { name?: string; email?: string };
        if (!userId) {
            return sendError(res, 401, 'Unauthorized', { code: 'AUTH_UNAUTHORIZED' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        const trimmedEmail = email ? normalizeEmail(email) : undefined;
        if (trimmedEmail && trimmedEmail !== user.email) {
            const userExists = await User.findOne({ email: trimmedEmail, _id: { $ne: user._id } }).select('_id');
            if (userExists) {
                return sendError(res, 400, 'Email is already in use', {
                    code: 'AUTH_EMAIL_IN_USE',
                    fields: { email: 'Email is already in use.' },
                });
            }
            user.email = trimmedEmail;
        }

        if (name) user.name = String(name).trim();
        await user.save();

        return sendData(res, formatUser(user));
    } catch (error) {
        console.error('update me error', error);
        return sendError(res, 500, 'Server error updating profile', { code: 'AUTH_UPDATE_PROFILE_FAILED' });
    }
};

export const updateMyPassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

        if (!userId) {
            return sendError(res, 401, 'Unauthorized', { code: 'AUTH_UNAUTHORIZED' });
        }

        const user = await User.findById(userId);
        if (!user?.password) {
            return sendError(res, 404, 'User not found', { code: 'AUTH_USER_NOT_FOUND' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendError(res, 400, 'Current password is incorrect', {
                code: 'AUTH_PASSWORD_INCORRECT',
                fields: { currentPassword: 'Current password is incorrect.' },
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.set('refreshToken', undefined);
        await user.save();

        clearAuthCookies(res);
        return sendData(res, { success: true, message: 'Password updated successfully. Please sign in again.' });
    } catch (error) {
        console.error('update password error', error);
        return sendError(res, 500, 'Server error updating password', { code: 'AUTH_UPDATE_PASSWORD_FAILED' });
    }
};

export const logoutUser = async (req: AuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
                await clearSession(res, decoded.userId);
                return sendData(res, { message: 'User logged out' });
            } catch {
                clearAuthCookies(res);
                return sendData(res, { message: 'User logged out' });
            }
        }

        await clearSession(res, req.user?.userId);
        return sendData(res, { message: 'User logged out' });
    } catch (error) {
        console.error('logout user error', error);
        clearAuthCookies(res);
        return sendError(res, 500, 'Server error', { code: 'AUTH_LOGOUT_FAILED' });
    }
};
