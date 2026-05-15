// Supabase Auth Hook — send_email
// Intercepts all Supabase auth emails and routes them through Resend.
// Deploy: supabase functions deploy send-email
// Register in Dashboard → Auth → Hooks → Send Email → point to this function.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = 'G&R Consulting <noreply@grmentoria.pt>';
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://grmentoria.pt';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = body.user as { email?: string } | undefined;
  const emailData = body.email_data as {
    email_action_type?: string;
    token_hash?: string;
    redirect_to?: string;
    site_url?: string;
  } | undefined;

  if (!user?.email || !emailData) {
    return new Response(JSON.stringify({ error: 'Missing user or email_data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email_action_type, token_hash, redirect_to, site_url } = emailData;
  const supabaseUrl = site_url ?? Deno.env.get('SUPABASE_URL') ?? '';

  // Build the Supabase verification/recovery URL that the email link points to.
  const actionUrl =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${token_hash}` +
    `&type=${email_action_type}` +
    `&redirect_to=${encodeURIComponent(redirect_to ?? `${APP_URL}/auth/callback`)}`;

  let subject: string;
  let html: string;

  if (email_action_type === 'signup' || email_action_type === 'email_change') {
    subject = 'Verifica o teu email — G&R Consulting';
    html = buildVerificationHtml(user.email, actionUrl);
  } else if (email_action_type === 'recovery') {
    subject = 'Recupera a tua senha — G&R Consulting';
    html = buildResetHtml(user.email, actionUrl);
  } else {
    // Magic links or other types — pass through a generic template.
    subject = 'O teu link de acesso — G&R Consulting';
    html = buildGenericHtml(user.email, actionUrl, email_action_type ?? 'login');
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: user.email, subject, html }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    console.error('[send-email hook] Resend error', err);
    return new Response(JSON.stringify({ error: 'Failed to send email', detail: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Email sent' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// ---------------------------------------------------------------------------
// Inline HTML builders — avoids a React/JSX compilation step in Deno.
// ---------------------------------------------------------------------------

function baseHtml(actionButton: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#FBF9F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:8px;padding:40px;">
        <tr>
          <td style="text-align:center;padding-bottom:24px;border-bottom:1px solid #e5e5e5;">
            <h1 style="margin:0 0 4px;font-size:24px;color:#1a1a1a;">G&R Consulting</h1>
            <p style="margin:0;font-size:14px;color:#666;">Mentoria para o CNA</p>
          </td>
        </tr>
        <tr><td style="padding:32px 0;">
          ${bodyContent}
        </td></tr>
        <tr>
          <td style="text-align:center;padding-top:24px;border-top:1px solid #e5e5e5;
                     font-size:12px;color:#999;">
            <p style="margin:0 0 4px;">© 2026 G&R Consulting. Todos os direitos reservados.</p>
            <p style="margin:0;">
              <a href="https://grmentoria.pt" style="color:#F2511B;text-decoration:none;">
                Visita o nosso site
              </a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function actionButton(href: string, label: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${href}"
       style="background:#F2511B;color:#fff;padding:12px 32px;border-radius:6px;
              font-weight:bold;text-decoration:none;display:inline-block;">
      ${label}
    </a>
  </div>
  <p style="color:#666;font-size:14px;">
    Se o botão acima não funcionar, copia e cola este link no teu navegador:
  </p>
  <p style="background:#f5f5f5;padding:12px;border-radius:4px;word-break:break-all;font-size:13px;">
    <a href="${href}" style="color:#F2511B;text-decoration:none;">${href}</a>
  </p>`;
}

function buildVerificationHtml(email: string, link: string): string {
  const body = `
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;margin-top:0;">Olá,</p>
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;">
      Obrigado por te registares na G&R Consulting! Para ativar a tua conta,
      confirma o teu email clicando no botão abaixo.
    </p>
    ${actionButton(link, 'Confirmar Email')}
    <p style="color:#999;font-size:12px;">Este link expira em 24 horas.</p>
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;">
      Perguntas? Entra em contacto connosco em
      <a href="mailto:support@grmentoria.pt" style="color:#F2511B;">support@grmentoria.pt</a>.
    </p>`;
  return baseHtml(actionButton(link, 'Confirmar Email'), body);
}

function buildResetHtml(email: string, link: string): string {
  const body = `
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;margin-top:0;">Olá,</p>
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;">
      Recebemos um pedido para recuperar a senha da tua conta.
      Clica no botão abaixo para definir uma nova senha.
    </p>
    ${actionButton(link, 'Recuperar Senha')}
    <p style="color:#999;font-size:12px;">
      Este link expira em 1 hora. Se não pediste a recuperação de senha, ignora este email.
    </p>
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;">
      Perguntas? Entra em contacto connosco em
      <a href="mailto:support@grmentoria.pt" style="color:#F2511B;">support@grmentoria.pt</a>.
    </p>`;
  return baseHtml(actionButton(link, 'Recuperar Senha'), body);
}

function buildGenericHtml(email: string, link: string, type: string): string {
  const body = `
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;margin-top:0;">Olá,</p>
    <p style="color:#1a1a1a;font-size:16px;line-height:1.5;">
      O teu link de acesso está pronto. Clica no botão abaixo para continuar.
    </p>
    ${actionButton(link, 'Continuar')}
    <p style="color:#999;font-size:12px;">Este link expira em breve.</p>`;
  return baseHtml(actionButton(link, 'Continuar'), body);
}
