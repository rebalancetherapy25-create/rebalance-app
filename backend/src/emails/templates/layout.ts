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
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${title}</title>
  <style>
    /* ── Reset ──────────────────────────────────────────── */
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    img{border:0;outline:0;text-decoration:none}

    /* ── Light theme (default) ──────────────────────────── */
    :root { color-scheme: light dark; }

    body {
      margin:0;padding:0;
      background-color:#FAF6F8;
      color:#2F1E26;
      font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
    }
    .email-bg  { background-color:#FAF6F8!important; }
    .wrap      { max-width:640px;margin:0 auto;padding:24px; }
    .card      {
      background:#ffffff;
      border:1px solid rgba(107,44,71,0.14);
      border-radius:16px;
      box-shadow:0 4px 24px rgba(107,44,71,0.10);
      overflow:hidden;
    }
    .head      {
      padding:20px 28px;
      background:linear-gradient(135deg,rgba(216,138,163,0.20),rgba(107,44,71,0.10));
      border-bottom:1px solid rgba(107,44,71,0.10);
    }
    .brand        { font-weight:800;font-size:18px;letter-spacing:-0.02em;color:#2F1E26; }
    .brand-accent { color:#6B2C47; }
    .brand-dot    { display:inline-block;width:6px;height:6px;border-radius:50%;background:#D88AA3;margin-left:3px;vertical-align:middle; }
    .content   { padding:28px; }
    .h1        { font-family:Poppins,Inter,system-ui,sans-serif;font-size:24px;font-weight:700;line-height:1.25;margin:0 0 14px 0;color:#2F1E26; }
    .p         { font-size:15px;line-height:1.75;margin:0 0 14px 0;color:#2F1E26; }
    .muted     { color:#8B6F79!important; }
    .btn       {
      display:inline-block;
      background:#6B2C47;
      color:#ffffff!important;
      text-decoration:none;
      padding:13px 22px;
      border-radius:12px;
      font-weight:700;
      font-size:15px;
      letter-spacing:0.01em;
    }
    .code      {
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:15px;
      background:rgba(107,44,71,0.06);
      border:1px solid rgba(107,44,71,0.18);
      padding:12px 16px;
      border-radius:12px;
      color:#2F1E26;
      word-break:break-all;
    }
    .divider   { height:1px;background:rgba(107,44,71,0.10);margin:0 0 0 0; }
    .foot      {
      padding:18px 28px;
      font-size:12px;
      color:#8B6F79;
      border-top:1px solid rgba(107,44,71,0.10);
      background:#FAF6F8;
    }
    .foot a    { color:#8B6F79;text-decoration:underline; }
    .preheader { display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden; }

    /* ── Dark theme ─────────────────────────────────────── */
    @media (prefers-color-scheme: dark) {
      body,
      .email-bg    { background-color:#160C11!important; color:#EDE0E6!important; }
      .card        { background:#22101A!important; border-color:rgba(216,138,163,0.16)!important; box-shadow:0 4px 32px rgba(0,0,0,0.55)!important; }
      .head        { background:linear-gradient(135deg,rgba(216,138,163,0.10),rgba(107,44,71,0.22))!important; border-bottom-color:rgba(216,138,163,0.10)!important; }
      .brand       { color:#EDE0E6!important; }
      .brand-accent{ color:#D88AA3!important; }
      .h1          { color:#EDE0E6!important; }
      .p           { color:#D2C0C9!important; }
      .muted       { color:#9A7A87!important; }
      .btn         { background:#9E3D65!important; color:#fff!important; }
      .code        { background:rgba(216,138,163,0.08)!important; border-color:rgba(216,138,163,0.22)!important; color:#EDE0E6!important; }
      .divider     { background:rgba(216,138,163,0.12)!important; }
      .foot        { background:#160C11!important; border-top-color:rgba(216,138,163,0.10)!important; color:#9A7A87!important; }
      .foot a      { color:#9A7A87!important; }
      a            { color:#D88AA3!important; }
    }

    /* ── Outlook / Windows Mail dark-mode overrides ─────── */
    [data-ogsc] body,
    [data-ogsb] body     { background-color:#160C11!important; color:#EDE0E6!important; }
    [data-ogsc] .card,
    [data-ogsb] .card    { background:#22101A!important; }
    [data-ogsc] .h1,
    [data-ogsb] .h1      { color:#EDE0E6!important; }
    [data-ogsc] .p,
    [data-ogsb] .p       { color:#D2C0C9!important; }
    [data-ogsc] .btn,
    [data-ogsb] .btn     { background:#9E3D65!important; }
    [data-ogsc] .code,
    [data-ogsb] .code    { background:rgba(216,138,163,0.08)!important; color:#EDE0E6!important; }
    [data-ogsc] .foot,
    [data-ogsb] .foot    { background:#160C11!important; color:#9A7A87!important; }
  </style>
</head>
<body class="email-bg">
  <div class="preheader">${preheader}</div>
  <div class="wrap">
    <div class="card">

      <!-- Header -->
      <div class="head">
        <div class="brand">
          Re<span class="brand-accent">Balance</span>&nbsp;Therapy<span class="brand-dot"></span>
        </div>
      </div>

      <!-- Body -->
      <div class="content">
        ${options.body}
      </div>

      <!-- Footer -->
      <div class="foot">
        If you didn't request this email, you can safely ignore it.&nbsp;&nbsp;·&nbsp;&nbsp;
        <a href="mailto:support@rebalancetherapy.co.in">support@rebalancetherapy.co.in</a>
      </div>

    </div>
  </div>
</body>
</html>`;
};

export const esc = escapeHtml;
