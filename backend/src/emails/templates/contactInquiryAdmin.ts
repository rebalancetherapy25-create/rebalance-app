import { emailLayout, esc } from './layout';

export const contactInquiryAdminEmail = (options: {
    name: string;
    email: string;
    message: string;
    submittedAt?: string;
}) => {
    const name = esc(options.name);
    const email = esc(options.email);
    const message = esc(options.message).replace(/\n/g, '<br/>');
    const submittedAt = esc(options.submittedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

    const body = `
      <h1 class="h1">New Contact Form Submission</h1>
      <p class="p">You have received a new inquiry from the ReBalance Therapy contact form.</p>
      
      <div style="background: rgba(107,44,71,0.05); border: 1px solid rgba(107,44,71,0.15); border-radius: 12px; padding: 18px 22px; margin: 20px 0;">
        <p class="p" style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
        <p class="p" style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #6B2C47; font-weight: 600;">${email}</a></p>
        <p class="p" style="margin: 0 0 10px 0;"><strong>Received:</strong> ${submittedAt} IST</p>
        <p class="p" style="margin: 12px 0 6px 0;"><strong>Message:</strong></p>
        <div style="background: #ffffff; border-left: 3px solid #6B2C47; padding: 12px 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #2F1E26;">
          ${message}
        </div>
      </div>

      <p class="p">
        <a class="btn" href="mailto:${email}?subject=Re: Your inquiry on ReBalance Therapy">Reply directly to ${name}</a>
      </p>
    `;

    return {
        subject: `New Inquiry from ${options.name} – ReBalance Therapy`,
        html: emailLayout({
            title: 'New Contact Inquiry',
            preheader: `Inquiry from ${options.name} (${options.email})`,
            body,
        }),
    };
};
