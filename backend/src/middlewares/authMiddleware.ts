import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

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
            req.user = decoded;
            return next();
        } catch (error) {
            console.error('Auth check failed: access token verification failed', (error as Error).message);
            return res.status(401).json({ error: 'Not authorized' });
        }
    }

    console.warn('Auth check failed: access token missing. Origin:', req.headers.origin);
    return res.status(401).json({ error: 'Not authorized' });
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as admin' });
    }
};
