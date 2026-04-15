import { emailLayout, esc } from './layout';

export const sessionReminderEmail = (options: {
    recipientName: string;
    therapistName: string;
    date: string;
    time: string;
    meetingLink?: string;
}) => {
    const recipientName = esc(options.recipientName);
    const therapistName = esc(options.therapistName);
    const date = esc(options.date);
    const time = esc(options.time);
    const meetingLink = options.meetingLink ? esc(options.meetingLink) : '';

    const linkBlock = meetingLink
        ? `<p class="p"><a class="btn" href="${meetingLink}">Join Session</a></p>
           <p class="p muted">Or copy this link:</p>
           <div class="code">${meetingLink}</div>`
        : `<p class="p muted">Your meeting link will be shared shortly.</p>`;

    const body = `
      <h1 class="h1">Your session is tomorrow</h1>
      <p class="p">Hi ${recipientName}, just a reminder that you have a session with ${therapistName} tomorrow.</p>
      <p class="p"><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      ${linkBlock}
      <p class="p muted" style="margin-top:16px">Need to reschedule? Please do so at least 24 hours in advance from your dashboard.</p>
    `;

    return {
        subject: `Reminder: Your session with ${options.therapistName} is tomorrow`,
        html: emailLayout({
            title: 'Session reminder',
            preheader: `Your session with ${options.therapistName} is on ${options.date} at ${options.time}`,
            body,
        }),
    };
};
