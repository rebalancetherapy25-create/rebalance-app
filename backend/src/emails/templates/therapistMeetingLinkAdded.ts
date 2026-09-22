import { emailLayout, esc } from './layout';

export const therapistMeetingLinkAddedEmail = (options: {
    therapistName: string;
    clientName: string;
    date: string;
    time: string;
    meetingLink: string;
}) => {
    const therapistName = esc(options.therapistName);
    const clientName = esc(options.clientName);
    const date = esc(options.date);
    const time = esc(options.time);
    const meetingLink = esc(options.meetingLink);

    const body = `
      <h1 class="h1">Meeting Link Updated</h1>
      <p class="p">Hello ${therapistName},</p>
      <p class="p">The meeting link for your upcoming session with <strong>${clientName}</strong> on <strong>${date} at ${time}</strong> has been updated.</p>
      <p class="p" style="margin-top: 24px; margin-bottom: 24px;">
        <a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Start / Join Session</a>
      </p>
      <p class="p muted">Meeting Link URL:</p>
      <div class="code" style="word-break: break-all;">${meetingLink}</div>
    `;

    return {
        subject: `Meeting Link Ready: Session with ${options.clientName} (${date} at ${time})`,
        html: emailLayout({
            title: 'Meeting link updated',
            preheader: `Meeting link for your session with ${options.clientName}`,
            body,
        }),
    };
};
