import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { Therapist, TherapistAccount } from '../models';
import config from '../config/env';
import {
    clearTherapistAuthCookies,
    generateTherapistTokens,
    setTherapistAuthCookies,
    THERAPIST_REFRESH_COOKIE,
} from '../utils/therapistJwt';
import { type TherapistAuthRequest } from '../middlewares/therapistAuthMiddleware';
import { sendData, sendError } from '../lib/http';
import { hashToken, tokenMatchesHash } from '../lib/security';

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const formatTherapistAccount = (account: {
    _id: string;
    email: string;
    therapistId: string;
    status: string;
}) => ({
    _id: String(account._id),
    email: account.email,
    therapistId: account.therapistId,
    status: account.status,
});

const issueTherapistSession = async (
    res: Response,
    account: { _id: any; therapistId: any; save: () => Promise<unknown>; refreshToken?: string | undefined },
) => {
    const { accessToken, refreshToken } = generateTherapistTokens(account._id, account.therapistId);
    account.refreshToken = hashToken(refreshToken);
    await account.save();
    setTherapistAuthCookies(res, accessToken, refreshToken);
};

export const therapistLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email: string; password: string };
        const account = await TherapistAccount.findOne({ email: normalizeEmail(email) });
        if (!account) {
            return sendError(res, 401, 'Invalid email or password', { code: 'THERAPIST_INVALID_CREDENTIALS' });
        }
        if (account.status !== 'active') {
            clearTherapistAuthCookies(res);
            return sendError(res, 403, 'Account is suspended', { code: 'THERAPIST_ACCOUNT_SUSPENDED' });
        }

        const ok = await bcrypt.compare(String(password), account.passwordHash);
        if (!ok) {
            return sendError(res, 401, 'Invalid email or password', { code: 'THERAPIST_INVALID_CREDENTIALS' });
        }

        await issueTherapistSession(res, account);

        const therapist = await Therapist.findById(account.therapistId).select('name');
        return sendData(res, {
            ...formatTherapistAccount(account as any),
            therapist: therapist ? { _id: therapist._id, name: (therapist as any).name } : null,
        });
    } catch (error) {
        console.error('Therapist login error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_LOGIN_FAILED' });
    }
};

export const therapistRefresh = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.[THERAPIST_REFRESH_COOKIE];
        if (!token) {
            clearTherapistAuthCookies(res);
            return sendError(res, 401, 'Refresh token missing', { code: 'THERAPIST_REFRESH_MISSING' });
        }

        const decoded = jwt.verify(token, config.therapistJwtRefreshSecret) as { therapistAccountId: string };
        const account = await TherapistAccount.findById(decoded.therapistAccountId);
        if (!account || !tokenMatchesHash(token, account.refreshToken)) {
            clearTherapistAuthCookies(res);
            return sendError(res, 401, 'Invalid refresh token', { code: 'THERAPIST_REFRESH_INVALID' });
        }
        if (account.status !== 'active') {
            clearTherapistAuthCookies(res);
            return sendError(res, 403, 'Account is suspended', { code: 'THERAPIST_ACCOUNT_SUSPENDED' });
        }

        await issueTherapistSession(res, account);
        return sendData(res, formatTherapistAccount(account as any));
    } catch (error) {
        clearTherapistAuthCookies(res);
        return sendError(res, 401, 'Refresh token expired or invalid', { code: 'THERAPIST_REFRESH_EXPIRED' });
    }
};

export const therapistLogout = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const refreshToken = req.cookies?.[THERAPIST_REFRESH_COOKIE];
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, config.therapistJwtRefreshSecret) as { therapistAccountId: string };
                await TherapistAccount.findByIdAndUpdate(decoded.therapistAccountId, { $unset: { refreshToken: 1 } });
            } catch {
                // Ignore invalid token during logout
            }
        } else if (req.therapist?.therapistAccountId) {
            await TherapistAccount.findByIdAndUpdate(req.therapist.therapistAccountId, { $unset: { refreshToken: 1 } });
        }

        clearTherapistAuthCookies(res);
        return sendData(res, { message: 'Logged out' });
    } catch (error) {
        console.error('Therapist logout error:', error);
        clearTherapistAuthCookies(res);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_LOGOUT_FAILED' });
    }
};

export const therapistMe = async (req: TherapistAuthRequest, res: Response) => {
    try {
        if (!req.therapist?.therapistAccountId) {
            return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });
        }
        const account = await TherapistAccount.findById(req.therapist.therapistAccountId).select('-passwordHash -refreshToken');
        if (!account) return sendError(res, 404, 'Account not found', { code: 'THERAPIST_ACCOUNT_NOT_FOUND' });

        const therapist = await Therapist.findById(account.therapistId).select('name email specialties');
        return sendData(res, {
            account,
            therapist,
        });
    } catch (error) {
        console.error('Therapist me error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_ME_FAILED' });
    }
};

export const therapistUpdatePassword = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistAccountId = req.therapist?.therapistAccountId;
        const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
        if (!therapistAccountId) return sendError(res, 401, 'Unauthorized', { code: 'THERAPIST_UNAUTHORIZED' });

        const account = await TherapistAccount.findById(therapistAccountId);
        if (!account) return sendError(res, 404, 'Account not found', { code: 'THERAPIST_ACCOUNT_NOT_FOUND' });
        if (account.status !== 'active') return sendError(res, 403, 'Account is suspended', { code: 'THERAPIST_ACCOUNT_SUSPENDED' });

        const ok = await bcrypt.compare(String(currentPassword), account.passwordHash);
        if (!ok) {
            return sendError(res, 400, 'Current password is incorrect', {
                code: 'THERAPIST_PASSWORD_INCORRECT',
                fields: { currentPassword: 'Current password is incorrect.' },
            });
        }

        const salt = await bcrypt.genSalt(10);
        account.passwordHash = await bcrypt.hash(String(newPassword), salt);
        account.refreshToken = undefined;
        await account.save();

        clearTherapistAuthCookies(res);
        return sendData(res, { success: true, message: 'Password updated. Please sign in again.' });
    } catch (error) {
        console.error('Therapist password update error:', error);
        return sendError(res, 500, 'Server error', { code: 'THERAPIST_UPDATE_PASSWORD_FAILED' });
    }
};
