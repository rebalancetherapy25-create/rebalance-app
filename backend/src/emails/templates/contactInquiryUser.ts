import { emailLayout, esc } from './layout';

export const contactInquiryUserEmail = (options: {
    name: string;
}) => {
    const name = esc(options.name);

    const body = `
      <h1 class="h1">Thank you for reaching out!</h1>
      <p class="p">Hi ${name},</p>
      <p class="p">We have received your message and wanted to let you know that our team has received it safely.</p>
      <p class="p">One of our specialists will review your inquiry and get back to you within 24 hours.</p>
      <div style="background: rgba(107,44,71,0.05); border: 1px solid rgba(107,44,71,0.15); border-radius: 12px; padding: 18px 22px; margin: 20px 0;">
        <p class="p" style="margin: 0 0 6px 0;"><strong>Need immediate assistance?</strong></p>
        <p class="p" style="margin: 0; font-size: 14px;">You can call us directly at <strong>+91 94839 00043</strong> or write to <a href="mailto:rebalancetherapy25@gmail.com" style="color: #6B2C47;">rebalancetherapy25@gmail.com</a>.</p>
      </div>
      <p class="p muted">Warm regards,<br/>The ReBalance Therapy Team</p>
    `;

    return {
        subject: `We've received your message – ReBalance Therapy`,
        html: emailLayout({
            title: 'Message Received',
            preheader: 'Thank you for reaching out to ReBalance Therapy. We will get back to you shortly.',
            body,
        }),
    };
};
