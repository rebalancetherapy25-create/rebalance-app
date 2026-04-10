import { emailLayout, esc } from './layout';

export const therapistPasswordResetEmail = (options: { therapistName?: string; portalUrl: string; email: string; temporaryPassword: string }) => {
    const name = options.therapistName ? esc(options.therapistName) : 'there';
    const portalUrl = esc(options.portalUrl);
    const email = esc(options.email);
    const temporaryPassword = esc(options.temporaryPassword);

    const body = `
      <h1 class="h1">Your Therapist Portal password was reset</h1>
      <p class="p">Hi ${name}, an admin reset your therapist portal password. Use the details below to sign in.</p>
      <p class="p"><a class="btn" href="${portalUrl}">Open Therapist Portal</a></p>
      <p class="p muted">Login email</p>
      <div class="code">${email}</div>
      <p class="p muted" style="margin-top:12px">Temporary password</p>
      <div class="code">${temporaryPassword}</div>
      <p class="p muted" style="margin-top:12px">After signing in, please change your password.</p>
    `;

    return {
        subject: 'ReBalance Therapist Portal password reset',
        html: emailLayout({
            title: 'Password reset',
            preheader: 'Your therapist portal password was reset',
            body,
        }),
    };
};

