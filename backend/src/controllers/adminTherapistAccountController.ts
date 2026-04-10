import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Therapist, TherapistAccount } from '../models';
import { createTherapistAccountAndInvite } from '../services/therapistInviteService';
import config from '../config/env';
import { sendEmail } from '../services/emailService';
import { therapistPasswordResetEmail } from '../emails/templates/therapistPasswordReset';

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

export const listTherapistAccounts = async (_req: Request, res: Response) => {
    try {
        const accounts = await TherapistAccount.find()
            .populate('therapistId', 'name')
            .sort({ createdAt: -1 });
        return res.status(200).json(accounts);
    } catch (error) {
        console.error('List therapist accounts error:', error);
        return res.status(500).json({ error: 'Server error fetching therapist accounts' });
    }
};

export const createTherapistAccount = async (req: Request, res: Response) => {
    try {
        const { therapistId, email, password, status } = req.body;
        if (!therapistId || !email) {
            return res.status(400).json({ error: 'therapistId and email are required' });
        }
        const therapist = await Therapist.findById(therapistId).select('_id');
        if (!therapist) return res.status(404).json({ error: 'Therapist not found' });

        const normalized = normalizeEmail(email);
        const exists = await TherapistAccount.findOne({ email: normalized }).select('_id');
        if (exists) return res.status(400).json({ error: 'Email is already in use' });

        // Create and invite (default active). If admin wants suspended, apply after creation.
        const created = await createTherapistAccountAndInvite({
            therapistId,
            email: normalized,
            ...(password ? { password: String(password) } : {}),
        });
        if (!created.ok) return res.status(400).json({ error: created.error });

        if (status === 'suspended') {
            await TherapistAccount.updateOne({ _id: created.account._id }, { $set: { status: 'suspended' } });
            (created.account as any).status = 'suspended';
        }

        return res.status(201).json(created.account);
    } catch (error) {
        console.error('Create therapist account error:', error);
        return res.status(500).json({ error: 'Server error creating therapist account' });
    }
};

export const updateTherapistAccount = async (req: Request, res: Response) => {
    try {
        const { email, password, status } = req.body;
        const account = await TherapistAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (email !== undefined) {
            const normalized = normalizeEmail(email);
            if (normalized && normalized !== account.email) {
                const exists = await TherapistAccount.findOne({ email: normalized }).select('_id');
                if (exists) return res.status(400).json({ error: 'Email is already in use' });
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

        return res.status(200).json(account);
    } catch (error) {
        console.error('Update therapist account error:', error);
        return res.status(500).json({ error: 'Server error updating therapist account' });
    }
};
