import { emailLayout, esc } from './layout';

export const userPasswordResetEmail = (options: { resetUrl: string }) => {
    const safeUrl = esc(options.resetUrl);

    const body = `
      <h1 class="h1">Reset your password</h1>
      <p class="p">We received a request to reset your ReBalance password. Click the button below to set a new one.</p>
      <p class="p"><a class="btn" href="${safeUrl}">Create a new password</a></p>
      <p class="p muted">This secure link expires in 1 hour.</p>
      <p class="p muted">If the button doesn't work, copy this URL into your browser:</p>
      <p class="p"><a href="${safeUrl}">${safeUrl}</a></p>
      <p class="p muted" style="margin-top:16px">If you didn't request a password reset, you can safely ignore this email.</p>
    `;

    return {
        subject: 'Reset your Rebalance password',
        html: emailLayout({
            title: 'Reset your password',
            preheader: 'Use this secure link to set a new ReBalance password',
            body,
        }),
    };
};
