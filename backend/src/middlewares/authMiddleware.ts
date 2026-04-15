import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { User } from '../models';
import { sendError } from '../lib/http';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token = req.cookies.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as { userId: string, role: string };
            const user = await User.findById(decoded.userId).select('_id role');
            if (!user) {
                return sendError(res, 401, 'Not authorized', { code: 'AUTH_UNAUTHORIZED' });
            }
            req.user = decoded;
            return next();
        } catch (error) {
            return sendError(res, 401, 'Not authorized', { code: 'AUTH_UNAUTHORIZED' });
        }
    }

    return sendError(res, 401, 'Not authorized', { code: 'AUTH_UNAUTHORIZED' });
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        sendError(res, 403, 'Not authorized as admin', { code: 'AUTH_ADMIN_REQUIRED' });
    }
};
