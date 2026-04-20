import crypto from 'crypto';
import type { RequestHandler } from 'express';

import { cookiePolicy } from '../config/env';
import { sendData, sendError } from './http';

export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const CSRF_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const createCsrfToken = () => crypto.randomBytes(24).toString('hex');

const setCsrfCookie = (res: Parameters<RequestHandler>[1], token: string) => {
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: cookiePolicy.secure,
        sameSite: cookiePolicy.sameSite,
        ...(cookiePolicy.domain ? { domain: cookiePolicy.domain } : {}),
        maxAge: CSRF_COOKIE_MAX_AGE_MS,
    });
};

export const ensureCsrfCookie: RequestHandler = (req, res, next) => {
    const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
    if (existingToken) {
        res.locals.csrfToken = existingToken;
        return next();
    }

    const token = createCsrfToken();
    setCsrfCookie(res, token);
    res.locals.csrfToken = token;
    next();
};

export const csrfProtection: RequestHandler = (req, res, next) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
        return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return sendError(res, 403, 'Invalid CSRF token', { code: 'CSRF_TOKEN_INVALID' });
    }

    next();
};

export const getCsrfToken: RequestHandler = (_req, res) => {
    return sendData(res, { csrfToken: res.locals.csrfToken });
};
