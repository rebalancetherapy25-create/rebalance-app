import { emailLayout, esc } from './layout';

export const therapistBookingConfirmedEmail = (options: {
    therapistName: string;
    clientName: string;
    clientEmail?: string | undefined;
    date: string;
    time: string;
    sessionType: string;
    bookingReason?: string | undefined;
    meetingLink?: string | undefined;
}) => {
    const therapistName = esc(options.therapistName);
    const clientName = esc(options.clientName);
    const clientEmail = options.clientEmail ? esc(options.clientEmail) : '';
    const date = esc(options.date);
    const time = esc(options.time);
    const sessionType = esc(options.sessionType);
    const bookingReason = options.bookingReason ? esc(options.bookingReason) : '';
    const meetingLink = options.meetingLink ? esc(options.meetingLink) : '';

    const linkBlock = meetingLink
        ? `<p class="p" style="margin-top: 20px;"><a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Session</a></p>
           <p class="p muted" style="margin-top: 12px;">Meeting Link:</p>
           <div class="code" style="word-break: break-all;">${meetingLink}</div>`
        : `<p class="p muted" style="margin-top: 16px;">Meeting link will be shared before the session.</p>`;

    const reasonBlock = bookingReason
        ? `<p class="p"><strong>Reason for booking:</strong> ${bookingReason}</p>`
        : '';

    const clientEmailBlock = clientEmail
        ? `<br/><strong>Client Email:</strong> <a href="mailto:${clientEmail}">${clientEmail}</a>`
        : '';

    const body = `
      <h1 class="h1">New Session Booked</h1>
      <p class="p">Hello ${therapistName},</p>
      <p class="p">A new appointment has been scheduled and confirmed with <strong>${clientName}</strong>.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p class="p" style="margin: 0 0 8px 0;"><strong>Date:</strong> ${date}</p>
        <p class="p" style="margin: 0 0 8px 0;"><strong>Time:</strong> ${time}</p>
        <p class="p" style="margin: 0 0 8px 0; text-transform: capitalize;"><strong>Type:</strong> ${sessionType}</p>
        <p class="p" style="margin: 0;"><strong>Client:</strong> ${clientName}${clientEmailBlock}</p>
      </div>
      ${reasonBlock}
      ${linkBlock}
    `;

    return {
        subject: `New Booking Confirmed: ${options.clientName} (${date} at ${time})`,
        html: emailLayout({
            title: 'New session booked',
            preheader: `New appointment with ${options.clientName} on ${date} at ${time}`,
            body,
        }),
    };
};
