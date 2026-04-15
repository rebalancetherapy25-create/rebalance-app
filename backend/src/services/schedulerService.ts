import cron from 'node-cron';
import { sendSessionReminders } from './sessionReminderService';

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

    console.log('[scheduler] Cron jobs started');
};
