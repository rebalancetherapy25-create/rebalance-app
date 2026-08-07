import cron from 'node-cron';
import { sendSessionReminders } from './sessionReminderService';
import { processOutbox } from './emailOutboxService';

/**
 * Starts all background cron jobs.
 * Call once after the database connection is established.
 */
export const startScheduler = (): void => {
    // Run every hour at minute 0 — checks for sessions in the 24–25h window
    cron.schedule('0 * * * *', async () => {
        console.log('[scheduler] Running session reminder job');
        try {
            await sendSessionReminders();
        } catch (err) {
            console.error('[scheduler] Session reminder job failed:', err);
        }
    });

    // Run every 5 minutes — process email outbox
    cron.schedule('*/5 * * * *', async () => {
        try {
            await processOutbox();
        } catch (err) {
            console.error('[scheduler] Email outbox job failed:', err);
        }
    });

    console.log('[scheduler] Cron jobs started');
};
