import { Request, Response } from 'express';
import { ContactInquiry } from '../models';
import { queueEmail } from '../services/emailOutboxService';
import { contactInquiryAdminEmail } from '../emails/templates/contactInquiryAdmin';
import { contactInquiryUserEmail } from '../emails/templates/contactInquiryUser';
import { sendData, sendError } from '../lib/http';

export const submitContactInquiry = async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        const inquiry = new ContactInquiry({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            ...(req.ip ? { ipAddress: req.ip } : {}),
        });
        await inquiry.save();

        // 1. Notify Admin (rebalancetherapy25@gmail.com)
        const adminEmailAddress = process.env.ADMIN_INQUIRY_EMAIL || 'rebalancetherapy25@gmail.com';
        const adminTpl = contactInquiryAdminEmail({
            name: inquiry.name,
            email: inquiry.email,
            message: inquiry.message,
            submittedAt: inquiry.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        });

        await queueEmail(adminEmailAddress, adminTpl.subject, adminTpl.html);

        // 2. Send acknowledgment to user
        const userTpl = contactInquiryUserEmail({
            name: inquiry.name,
        });

        await queueEmail(inquiry.email, userTpl.subject, userTpl.html);

        return sendData(res, {
            id: inquiry._id,
            message: 'Your message has been sent successfully. We will get back to you shortly.',
        });
    } catch (error) {
        console.error('[ContactController] Error submitting contact inquiry:', error);
        return sendError(res, 500, 'Unable to send message at this time. Please try again or email us directly.', {
            code: 'CONTACT_SUBMISSION_FAILED',
        });
    }
};
