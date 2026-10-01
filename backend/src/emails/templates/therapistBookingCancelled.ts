import { emailLayout, esc } from './layout';
import { maskEmail, maskClientIdentifier } from '../../utils/mask';

export const therapistBookingCancelledEmail = (options: {
    therapistName: string;
    clientName: string;
    clientEmail?: string | undefined;
    date: string;
    time: string;
}) => {
    const therapistName = esc(options.therapistName);
    const clientName = esc(maskClientIdentifier(options.clientName));
    const clientEmail = options.clientEmail ? esc(maskEmail(options.clientEmail)) : '';
    const date = esc(options.date);
    const time = esc(options.time);

    const clientInfo = clientEmail ? `${clientName} (${clientEmail})` : clientName;

    const body = `
      <h1 class="h1">Session Cancelled</h1>
      <p class="p">Hello ${therapistName},</p>
      <p class="p">Your session with <strong>${clientInfo}</strong> scheduled for <strong>${date} at ${time}</strong> has been cancelled.</p>
      <p class="p muted" style="margin-top: 16px;">The schedule for this time slot has been released.</p>
    `;

    return {
        subject: `Session Cancelled: ${clientName} (${date} at ${time})`,
        html: emailLayout({
            title: 'Session cancelled',
            preheader: `Cancelled session with ${clientName} on ${date} at ${time}`,
            body,
        }),
    };
};
