import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Therapist, TherapistAccount } from '../models';
import { createTherapistAccountAndInvite } from '../services/therapistInviteService';
import config from '../config/env';
import { sendEmail } from '../services/emailService';
import { therapistPasswordResetEmail } from '../emails/templates/therapistPasswordReset';
import { sendData, sendError } from '../lib/http';

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

export const listTherapistAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await TherapistAccount.find()
            .populate('therapistId', 'name')
            .sort({ createdAt: -1 });
        return sendData(res, accounts);
    } catch (error) {
        console.error('List therapist accounts error:', error);
        return sendError(res, 500, 'Server error fetching therapist accounts', { code: 'THERAPIST_ACCOUNT_LIST_FAILED' });
    }
};

export const createTherapistAccount = async (req: Request, res: Response) => {
    try {
        const { therapistId, email, password, status } = req.body;
        if (!therapistId || !email) {
            return sendError(res, 400, 'therapistId and email are required', { code: 'THERAPIST_ACCOUNT_FIELDS_REQUIRED' });
        }
        const therapist = await Therapist.findById(therapistId).select('_id');
        if (!therapist) return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });

        const normalized = normalizeEmail(email);
        const exists = await TherapistAccount.findOne({ email: normalized }).select('_id');
        if (exists) return sendError(res, 400, 'Email is already in use', { code: 'THERAPIST_ACCOUNT_EMAIL_IN_USE' });

        // Create and invite (default active). If admin wants suspended, apply after creation.
        const created = await createTherapistAccountAndInvite({
            therapistId,
            email: normalized,
            ...(password ? { password: String(password) } : {}),
        });
        if (!created.ok) return sendError(res, 400, created.error, { code: 'THERAPIST_ACCOUNT_CREATE_FAILED' });

        if (status === 'suspended') {
            await TherapistAccount.updateOne({ _id: created.account._id }, { $set: { status: 'suspended' } });
            (created.account as any).status = 'suspended';
        }

        return sendData(res, created.account, 201);
    } catch (error) {
        console.error('Create therapist account error:', error);
        return sendError(res, 500, 'Server error creating therapist account', { code: 'THERAPIST_ACCOUNT_CREATE_FAILED' });
    }
};

export const updateTherapistAccount = async (req: Request, res: Response) => {
    try {
        const { email, password, status } = req.body;
        const account = await TherapistAccount.findById(req.params.id);
        if (!account) return sendError(res, 404, 'Account not found', { code: 'THERAPIST_ACCOUNT_NOT_FOUND' });

        if (email !== undefined) {
            const normalized = normalizeEmail(email);
            if (normalized && normalized !== account.email) {
                const exists = await TherapistAccount.findOne({ email: normalized }).select('_id');
                if (exists) return sendError(res, 400, 'Email is already in use', { code: 'THERAPIST_ACCOUNT_EMAIL_IN_USE' });
                account.email = normalized;
            }
        }

        if (status !== undefined) {
            account.status = status === 'suspended' ? 'suspended' : 'active';
        }

        if (password !== undefined) {
            const salt = await bcrypt.genSalt(10);
            account.passwordHash = await bcrypt.hash(String(password), salt);
            account.refreshToken = undefined;
        }

        await account.save();

        if (password !== undefined) {
            const therapist = await Therapist.findById(account.therapistId).select('name');
            const tpl = therapistPasswordResetEmail({
                therapistName: (therapist as any)?.name,
                portalUrl: `${String(config.therapistUrl || '').replace(/\/$/, '')}/login`,
                email: account.email,
                temporaryPassword: String(password),
            });
            await sendEmail({ to: account.email, subject: tpl.subject, html: tpl.html });
        }

        return sendData(res, account);
    } catch (error) {
        console.error('Update therapist account error:', error);
        return sendError(res, 500, 'Server error updating therapist account', { code: 'THERAPIST_ACCOUNT_UPDATE_FAILED' });
    }
};
