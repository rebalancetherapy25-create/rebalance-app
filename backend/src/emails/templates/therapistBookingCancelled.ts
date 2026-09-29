import { emailLayout, esc } from './layout';

export const therapistBookingCancelledEmail = (options: {
    therapistName: string;
    clientName: string;
    date: string;
    time: string;
}) => {
    const therapistName = esc(options.therapistName);
    const clientName = esc(options.clientName);
    const date = esc(options.date);
    const time = esc(options.time);

    const body = `
      <h1 class="h1">Session Cancelled</h1>
      <p class="p">Hello ${therapistName},</p>
      <p class="p">Your session with <strong>${clientName}</strong> scheduled for <strong>${date} at ${time}</strong> has been cancelled.</p>
      <p class="p muted" style="margin-top: 16px;">The schedule for this time slot has been released.</p>
    `;

    return {
        subject: `Session Cancelled: ${options.clientName} (${date} at ${time})`,
        html: emailLayout({
            title: 'Session cancelled',
            preheader: `Cancelled session with ${options.clientName} on ${date} at ${time}`,
            body,
        }),
    };
};
