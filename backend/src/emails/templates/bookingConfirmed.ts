import { emailLayout, esc } from './layout';

export const bookingConfirmedEmail = (options: { recipientName: string; therapistName: string; date: string; time: string; meetingLink?: string }) => {
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
      <h1 class="h1">Booking confirmed</h1>
      <p class="p">Hi ${recipientName}, your session with ${therapistName} is confirmed.</p>
      <p class="p"><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      ${linkBlock}
    `;

    return {
        subject: 'Confirmed: Your session at ReBalance',
        html: emailLayout({ title: 'Booking confirmed', preheader: `Session confirmed for ${date} ${time}`, body }),
    };
};

