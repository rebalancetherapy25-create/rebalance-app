import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Types } from 'mongoose';
import config, { cookiePolicy } from '../config/env';

export const generateTokens = (userId: Types.ObjectId, role: string) => {
    const accessToken = jwt.sign(
        { userId, role },
        config.jwtSecret,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        config.jwtRefreshSecret,
        { expiresIn: role === 'admin' ? '3650d' : '7d' }
    );

    return { accessToken, refreshToken };
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, role?: string) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        ...(cookiePolicy.domain ? { domain: cookiePolicy.domain } : {}),
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        ...(cookiePolicy.domain ? { domain: cookiePolicy.domain } : {}),
        maxAge: (role === 'admin' ? 3650 : 7) * 24 * 60 * 60 * 1000, // 10 years or 7 days
    });
};

export const clearAuthCookies = (res: Response) => {
    res.cookie('accessToken', '', {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        ...(cookiePolicy.domain ? { domain: cookiePolicy.domain } : {}),
        expires: new Date(0),
    });
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        ...(cookiePolicy.domain ? { domain: cookiePolicy.domain } : {}),
        expires: new Date(0),
    });
};
