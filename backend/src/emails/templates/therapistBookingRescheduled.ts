import { emailLayout, esc } from './layout';

export const therapistBookingRescheduledEmail = (options: {
    therapistName: string;
    clientName: string;
    previousDate: string;
    previousTime: string;
    nextDate: string;
    nextTime: string;
    meetingLink?: string | undefined;
}) => {
    const therapistName = esc(options.therapistName);
    const clientName = esc(options.clientName);
    const previousDate = esc(options.previousDate);
    const previousTime = esc(options.previousTime);
    const nextDate = esc(options.nextDate);
    const nextTime = esc(options.nextTime);
    const meetingLink = options.meetingLink ? esc(options.meetingLink) : '';

    const linkBlock = meetingLink
        ? `<p class="p" style="margin-top: 20px;"><a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Session</a></p>
           <p class="p muted" style="margin-top: 12px;">Meeting Link:</p>
           <div class="code" style="word-break: break-all;">${meetingLink}</div>`
        : `<p class="p muted" style="margin-top: 16px;">Meeting link will be shared before the session.</p>`;

    const body = `
      <h1 class="h1">Session Rescheduled</h1>
      <p class="p">Hello ${therapistName},</p>
      <p class="p">Your session with <strong>${clientName}</strong> has been rescheduled.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p class="p" style="margin: 0 0 8px 0; color: #64748b;"><strong>Previous Time:</strong> <del>${previousDate} at ${previousTime}</del></p>
        <p class="p" style="margin: 0 0 8px 0; color: #0f172a;"><strong>New Time:</strong> <strong>${nextDate} at ${nextTime}</strong></p>
        <p class="p" style="margin: 0;"><strong>Client:</strong> ${clientName}</p>
      </div>
      ${linkBlock}
    `;

    return {
        subject: `Session Rescheduled: ${options.clientName} (${nextDate} at ${nextTime})`,
        html: emailLayout({
            title: 'Session rescheduled',
            preheader: `Rescheduled appointment with ${options.clientName} on ${nextDate} at ${nextTime}`,
            body,
        }),
    };
};
