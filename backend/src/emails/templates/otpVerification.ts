import { emailLayout, esc } from './layout';

export const otpVerificationEmail = (options: { otpCode: string }) => {
    const safeCode = esc(options.otpCode);

    const body = `
      <h1 class="h1">Confirm your email</h1>
      <p class="p">Use the 6-digit code below to finish setting up your ReBalance account.</p>
      <div class="code" style="font-size:28px;letter-spacing:0.35em;text-align:center">${safeCode}</div>
      <p class="p muted" style="margin-top:12px">This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
    `;

    return {
        subject: 'Verify your Rebalance account',
        html: emailLayout({
            title: 'Verify your email',
            preheader: `Your ReBalance verification code is ${options.otpCode}`,
            body,
        }),
    };
};
