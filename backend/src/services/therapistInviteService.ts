import crypto from 'crypto';
import bcrypt from 'bcrypt';
import config from '../config/env';
import { Therapist, TherapistAccount } from '../models';
import { sendEmail } from './emailService';
import { therapistInviteEmail } from '../emails/templates/therapistInvite';

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const generateTempPassword = () => {
    const bytes = crypto.randomBytes(9); // 12 chars base64url-ish
    return bytes.toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'TempPass123!';
};

export const createTherapistAccountAndInvite = async (options: { therapistId: string; email: string; password?: string }) => {
    const email = normalizeEmail(options.email);
    if (!email) return { ok: false as const, error: 'Email is required' };

    const therapist = await Therapist.findById(options.therapistId).select('name');
    if (!therapist) return { ok: false as const, error: 'Therapist not found' };

    const password = options.password || generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);

    try {
        const account = await TherapistAccount.create({
            therapistId: options.therapistId,
            email,
            passwordHash,
            status: 'active',
        });

        const portalUrl = `${String(config.therapistUrl || '').replace(/\/$/, '')}/login`;
        const tpl = therapistInviteEmail({
            therapistName: (therapist as any).name,
            portalUrl,
            email,
            temporaryPassword: password,
        });
        await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

        return { ok: true as const, account, temporaryPassword: password };
    } catch (error: any) {
        if (error?.code === 11000) {
            return { ok: false as const, error: 'Therapist account already exists for this email/therapist' };
        }
        throw error;
    }
};
