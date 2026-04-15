import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { THERAPIST_ACCESS_COOKIE } from '../utils/therapistJwt';
import { TherapistAccount } from '../models';
import { sendError } from '../lib/http';

export interface TherapistAuthRequest extends Request {
    therapist?: {
        therapistAccountId: string;
        therapistId: string;
    };
}

export const protectTherapist = async (req: TherapistAuthRequest, res: Response, next: NextFunction) => {
    let token = req.cookies?.[THERAPIST_ACCESS_COOKIE];

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return sendError(res, 401, 'Not authorized', { code: 'THERAPIST_UNAUTHORIZED' });
    }

    try {
        const decoded = jwt.verify(token, config.therapistJwtSecret) as { therapistAccountId: string; therapistId: string };

        // Enforce account existence and active status for every therapist request.
        // This prevents suspended/deleted accounts from continuing to call portal APIs with an old token.
        const account = await TherapistAccount.findById(decoded.therapistAccountId).select('therapistId status');
        if (!account) {
            return sendError(res, 401, 'Not authorized', { code: 'THERAPIST_UNAUTHORIZED' });
        }
        if (account.status !== 'active') {
            return sendError(res, 403, 'Account is suspended', { code: 'THERAPIST_ACCOUNT_SUSPENDED' });
        }

        req.therapist = {
            therapistAccountId: String(account._id),
            therapistId: String(account.therapistId),
        };
        return next();
    } catch (error) {
        return sendError(res, 401, 'Not authorized', { code: 'THERAPIST_UNAUTHORIZED' });
    }
};
