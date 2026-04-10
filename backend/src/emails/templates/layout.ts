const escapeHtml = (value: string) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const emailLayout = (options: { title: string; preheader?: string; body: string }) => {
    const title = escapeHtml(options.title);
    const preheader = escapeHtml(options.preheader || '');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;padding:0;background:#FAF6F8;color:#2F1E26;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .wrap{max-width:640px;margin:0 auto;padding:24px}
    .card{background:#ffffff;border:1px solid rgba(107,44,71,0.12);border-radius:14px;box-shadow:0 4px 20px rgba(107,44,71,0.08);overflow:hidden}
    .head{padding:18px 22px;background:linear-gradient(135deg, rgba(216,138,163,0.16), rgba(107,44,71,0.08))}
    .brand{font-weight:800;letter-spacing:-0.02em}
    .brand span{color:#6B2C47}
    .content{padding:22px}
    .h1{font-family:Poppins,Inter,system-ui,sans-serif;font-size:22px;line-height:1.2;margin:0 0 12px 0}
    .p{font-size:14px;line-height:1.7;margin:0 0 12px 0;color:#2F1E26}
    .muted{color:#8B6F79}
    .btn{display:inline-block;background:#6B2C47;color:#fff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:700}
    .code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:rgba(107,44,71,0.06);border:1px solid rgba(107,44,71,0.16);padding:10px 12px;border-radius:12px}
    .foot{padding:18px 22px;font-size:12px;color:#8B6F79;border-top:1px solid rgba(107,44,71,0.10)}
    .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden}
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="brand">ReBalance <span>Therapy</span></div>
      </div>
      <div class="content">
        ${options.body}
      </div>
      <div class="foot">
        If you didn’t request this email, you can ignore it.
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const esc = escapeHtml;

