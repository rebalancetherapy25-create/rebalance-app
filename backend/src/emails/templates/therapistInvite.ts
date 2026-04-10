import { emailLayout, esc } from './layout';

export const therapistInviteEmail = (options: { therapistName?: string; portalUrl: string; email: string; temporaryPassword: string }) => {
    const name = options.therapistName ? esc(options.therapistName) : 'there';
    const portalUrl = esc(options.portalUrl);
    const email = esc(options.email);
    const temporaryPassword = esc(options.temporaryPassword);

    const body = `
      <h1 class="h1">Your Therapist Portal access</h1>
      <p class="p">Hi ${name}, your therapist account has been created. Use the details below to sign in.</p>
      <p class="p"><a class="btn" href="${portalUrl}">Open Therapist Portal</a></p>
      <p class="p muted">Login email</p>
      <div class="code">${email}</div>
      <p class="p muted" style="margin-top:12px">Temporary password</p>
      <div class="code">${temporaryPassword}</div>
      <p class="p muted" style="margin-top:12px">Please sign in and change your password as soon as possible.</p>
    `;

    return {
        subject: 'ReBalance Therapist Portal access',
        html: emailLayout({
            title: 'Therapist Portal access',
            preheader: 'Your login details for the ReBalance Therapist Portal',
            body,
        }),
    };
};

