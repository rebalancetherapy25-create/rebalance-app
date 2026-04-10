import { emailLayout, esc } from './layout';

export const bookingRescheduledEmail = (options: {
    recipientName: string;
    therapistName: string;
    previousDate: string;
    previousTime: string;
    nextDate: string;
    nextTime: string;
    meetingLink?: string;
}) => {
    const recipientName = esc(options.recipientName);
    const therapistName = esc(options.therapistName);
    const previousDate = esc(options.previousDate);
    const previousTime = esc(options.previousTime);
    const nextDate = esc(options.nextDate);
    const nextTime = esc(options.nextTime);
    const meetingLink = options.meetingLink ? esc(options.meetingLink) : '';

    const linkBlock = meetingLink
        ? `<p class="p"><a class="btn" href="${meetingLink}">Join Session</a></p>`
        : `<p class="p muted">Your meeting link will be shared shortly.</p>`;

    const body = `
      <h1 class="h1">Booking rescheduled</h1>
      <p class="p">Hi ${recipientName}, your session with ${therapistName} has been rescheduled.</p>
      <p class="p"><strong>Old:</strong> ${previousDate} at ${previousTime}<br/><strong>New:</strong> ${nextDate} at ${nextTime}</p>
      ${linkBlock}
    `;

    return {
        subject: 'Updated: Your session was rescheduled',
        html: emailLayout({ title: 'Booking rescheduled', preheader: `New time: ${nextDate} ${nextTime}`, body }),
    };
};

