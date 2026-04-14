import config from '../config/env';

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
    try {
        if (!config.resendApiKey) {
            console.warn('[Email] RESEND_API_KEY not configured; skipping email send:', { to, subject });
            return false;
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: config.emailFrom,
                to,
                subject,
                html,
            }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('[Email] Resend send failed:', res.status, { from: config.emailFrom, to, subject, response: text });
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
