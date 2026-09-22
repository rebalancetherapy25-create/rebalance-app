import { EmailOutbox } from '../models';
import { sendEmail } from './emailService';
import config from '../config/env';

const MAX_RETRIES = 5;

export const queueEmail = async (to: string, subject: string, html: string) => {
    try {
        const outboxRecord = await EmailOutbox.create({
            to,
            subject,
            html,
            status: 'pending'
        });
        console.log(`[EmailOutbox] Queued email for ${to}`);

        // Immediate background send attempt so recipient does not have to wait for cron interval
        sendEmail({ to, subject, html }).then(async (success) => {
            if (success) {
                outboxRecord.status = 'sent';
                await outboxRecord.save();
                console.log(`[EmailOutbox] Dispatched immediately to ${to}`);
            }
        }).catch((err) => {
            console.warn(`[EmailOutbox] Immediate dispatch failed for ${to}, will retry via outbox worker:`, err);
        });
    } catch (error) {
        console.error('[EmailOutbox] Failed to queue email:', error);
        // Fallback to direct send if outbox table insert failed
        await sendEmail({ to, subject, html }).catch(() => {});
    }
};

export const processOutbox = async () => {
    try {
        // Find emails that are pending or failed (but haven't reached MAX_RETRIES)
        const emailsToProcess = await EmailOutbox.find({
            status: { $in: ['pending', 'failed'] },
            retries: { $lt: MAX_RETRIES }
        }).limit(10); // Process in batches of 10

        if (emailsToProcess.length === 0) {
            return;
        }

        console.log(`[EmailOutbox] Processing ${emailsToProcess.length} emails`);

        for (const email of emailsToProcess) {
            const success = await sendEmail({
                to: email.to,
                subject: email.subject,
                html: email.html
            });

            if (success) {
                email.status = 'sent';
                await email.save();
            } else {
                email.retries += 1;
                email.lastError = 'Failed to send via Resend API';
                
                if (email.retries >= MAX_RETRIES) {
                    email.status = 'failed';
                    console.error(`[EmailOutbox] CRITICAL: Email to ${email.to} failed permanently after ${MAX_RETRIES} retries.`);
                    
                    // Admin Notification (Best effort queue)
                    if (config.adminEmail && config.adminEmail !== email.to) {
                        try {
                            await EmailOutbox.create({
                                to: config.adminEmail,
                                subject: `[Action Required] Email failed to send to ${email.to}`,
                                html: `<p>An email with subject <strong>${email.subject}</strong> failed to send to <strong>${email.to}</strong> after ${MAX_RETRIES} retries.</p>`,
                                status: 'pending'
                            });
                        } catch (err) {
                            console.error('[EmailOutbox] Failed to queue admin alert:', err);
                        }
                    }
                } else {
                    email.status = 'failed'; // Will be picked up next time since retries < MAX_RETRIES
                }
                await email.save();
            }
        }
    } catch (error) {
        console.error('[EmailOutbox] Error processing outbox:', error);
    }
};
