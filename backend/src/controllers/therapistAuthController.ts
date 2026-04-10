import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Therapist, TherapistAccount } from '../models';
import config from '../config/env';
import { clearTherapistAuthCookies, generateTherapistTokens, setTherapistAuthCookies, THERAPIST_REFRESH_COOKIE } from '../utils/therapistJwt';
import { TherapistAuthRequest } from '../middlewares/therapistAuthMiddleware';

const formatTherapistAccount = (account: any) => ({
    _id: account._id,
    email: account.email,
    therapistId: account.therapistId,
    status: account.status,
});

export const therapistLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const account = await TherapistAccount.findOne({ email: normalizedEmail });
        if (!account) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (account.status !== 'active') {
            clearTherapistAuthCookies(res);
            return res.status(403).json({ error: 'Account is suspended' });
        }

        const ok = await bcrypt.compare(String(password), account.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { accessToken, refreshToken } = generateTherapistTokens(account._id, account.therapistId as any);
        account.refreshToken = refreshToken;
        await account.save();

        setTherapistAuthCookies(res, accessToken, refreshToken);

        const therapist = await Therapist.findById(account.therapistId).select('name');
        return res.status(200).json({
            ...formatTherapistAccount(account),
            therapist: therapist ? { _id: therapist._id, name: (therapist as any).name } : null,
        });
    } catch (error) {
        console.error('Therapist login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const therapistRefresh = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.[THERAPIST_REFRESH_COOKIE];
        if (!token) {
            clearTherapistAuthCookies(res);
            return res.status(401).json({ error: 'Refresh token missing' });
        }

        const decoded = jwt.verify(token, config.therapistJwtRefreshSecret) as { therapistAccountId: string };
        const account = await TherapistAccount.findById(decoded.therapistAccountId);
        if (!account || account.refreshToken !== token) {
            clearTherapistAuthCookies(res);
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        if (account.status !== 'active') {
            clearTherapistAuthCookies(res);
            return res.status(403).json({ error: 'Account is suspended' });
        }

        const { accessToken, refreshToken } = generateTherapistTokens(account._id, account.therapistId as any);
        account.refreshToken = refreshToken;
        await account.save();
        setTherapistAuthCookies(res, accessToken, refreshToken);

        return res.status(200).json(formatTherapistAccount(account));
    } catch {
        clearTherapistAuthCookies(res);
        return res.status(401).json({ error: 'Refresh token expired or invalid' });
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
                // ignore
            }
        } else if (req.therapist?.therapistAccountId) {
            await TherapistAccount.findByIdAndUpdate(req.therapist.therapistAccountId, { $unset: { refreshToken: 1 } });
        }

        clearTherapistAuthCookies(res);
        return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        console.error('Therapist logout error:', error);
        clearTherapistAuthCookies(res);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const therapistMe = async (req: TherapistAuthRequest, res: Response) => {
    try {
        if (!req.therapist?.therapistAccountId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const account = await TherapistAccount.findById(req.therapist.therapistAccountId).select('-passwordHash -refreshToken');
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const therapist = await Therapist.findById(account.therapistId).select('name email specialties');
        return res.status(200).json({
            account,
            therapist,
        });
    } catch (error) {
        console.error('Therapist me error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const therapistUpdatePassword = async (req: TherapistAuthRequest, res: Response) => {
    try {
        const therapistAccountId = req.therapist?.therapistAccountId;
        const { currentPassword, newPassword } = req.body || {};
        if (!therapistAccountId) return res.status(401).json({ error: 'Unauthorized' });
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });

        const account = await TherapistAccount.findById(therapistAccountId);
        if (!account) return res.status(404).json({ error: 'Account not found' });
        if (account.status !== 'active') return res.status(403).json({ error: 'Account is suspended' });

        const ok = await bcrypt.compare(String(currentPassword), account.passwordHash);
        if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        account.passwordHash = await bcrypt.hash(String(newPassword), salt);
        account.refreshToken = undefined;
        await account.save();

        clearTherapistAuthCookies(res);
        return res.status(200).json({ success: true, message: 'Password updated. Please sign in again.' });
    } catch (error) {
        console.error('Therapist password update error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
