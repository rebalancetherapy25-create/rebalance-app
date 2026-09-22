import { emailLayout, esc } from './layout';

export const meetingLinkAddedEmail = (options: {
    recipientName: string;
    therapistName: string;
    date: string;
    time: string;
    meetingLink: string;
}) => {
    const recipientName = esc(options.recipientName);
    const therapistName = esc(options.therapistName);
    const date = esc(options.date);
    const time = esc(options.time);
    const meetingLink = esc(options.meetingLink);

    const body = `
      <h1 class="h1">Meeting link ready</h1>
      <p class="p">Hi ${recipientName}, the meeting link for your upcoming session with ${therapistName} is now available.</p>
      <p class="p"><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      <p class="p" style="margin-top: 24px; margin-bottom: 24px;">
        <a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Session</a>
      </p>
      <p class="p muted">Or copy and paste this link into your browser:</p>
      <div class="code" style="word-break: break-all;">${meetingLink}</div>
      <p class="p muted" style="margin-top: 20px; font-size: 13px;">Please join 2–3 minutes before the scheduled time.</p>
    `;

    return {
        subject: `Meeting Link: Your session with ${options.therapistName}`,
        html: emailLayout({
            title: 'Meeting link available',
            preheader: `Join link for your session on ${date} at ${time}`,
            body,
        }),
    };
};
