import { emailLayout, esc } from './layout';

export const bookingCancelledEmail = (options: { recipientName: string; therapistName: string; date: string; time: string }) => {
    const recipientName = esc(options.recipientName);
    const therapistName = esc(options.therapistName);
    const date = esc(options.date);
    const time = esc(options.time);

    const body = `
      <h1 class="h1">Booking cancelled</h1>
      <p class="p">Hi ${recipientName}, your session with ${therapistName} on ${date} at ${time} was cancelled.</p>
      <p class="p muted">If this was unexpected, please contact support or rebook from the platform.</p>
    `;

    return {
        subject: 'Cancelled: Your session at ReBalance',
        html: emailLayout({ title: 'Booking cancelled', preheader: `Session cancelled for ${date} ${time}`, body }),
    };
};

