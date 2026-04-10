import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';
import config, { cookiePolicy } from '../config/env';

export const THERAPIST_ACCESS_COOKIE = 'therapistAccessToken';
export const THERAPIST_REFRESH_COOKIE = 'therapistRefreshToken';

export const generateTherapistTokens = (therapistAccountId: Types.ObjectId, therapistId: Types.ObjectId) => {
    const accessToken = jwt.sign(
        { therapistAccountId, therapistId },
        config.therapistJwtSecret,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { therapistAccountId },
        config.therapistJwtRefreshSecret,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

export const setTherapistAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    res.cookie(THERAPIST_ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie(THERAPIST_REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const clearTherapistAuthCookies = (res: Response) => {
    res.cookie(THERAPIST_ACCESS_COOKIE, '', {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        expires: new Date(0),
    });
    res.cookie(THERAPIST_REFRESH_COOKIE, '', {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        expires: new Date(0),
    });
};

