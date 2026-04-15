import { emailLayout, esc } from './layout';

export const paymentFailedEmail = (options: {
    recipientName: string;
    therapistName: string;
    date: string;
    time: string;
    retryUrl?: string;
}) => {
    const recipientName = esc(options.recipientName);
    const therapistName = esc(options.therapistName);
    const date = esc(options.date);
    const time = esc(options.time);
    const retryUrl = options.retryUrl ? esc(options.retryUrl) : '';

    const retryBlock = retryUrl
        ? `<p class="p"><a class="btn" href="${retryUrl}">Try again</a></p>`
        : '';

    const body = `
      <h1 class="h1">Payment unsuccessful</h1>
      <p class="p">Hi ${recipientName}, unfortunately we were unable to process your payment for the following session.</p>
      <p class="p"><strong>Therapist:</strong> ${therapistName}<br/><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${time}</p>
      <p class="p muted">Your slot has been released. Please try booking again — another slot may still be available.</p>
      ${retryBlock}
      <p class="p muted" style="margin-top:16px">If you believe this is an error or were charged, please contact our support team immediately.</p>
    `;

    return {
        subject: 'Payment failed – ReBalance booking',
        html: emailLayout({
            title: 'Payment unsuccessful',
            preheader: `Your payment for the session on ${options.date} at ${options.time} could not be processed`,
            body,
        }),
    };
};
