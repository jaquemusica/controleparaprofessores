// ============================================================
// Auth Hook do Supabase ("Send Email Hook"): substitui os e-mails
// padrão do Supabase Auth pelos nossos, enviados via Resend.
// Cobre os dois e-mails de autenticação pedidos:
//   - cadastro realizado (email_action_type = "signup")
//   - recuperação de senha (email_action_type = "recovery")
// Outros tipos (magic link, troca de e-mail) são ignorados aqui —
// não fazem parte do fluxo deste app.
//
// Configuração: Supabase Dashboard > Authentication > Hooks >
// "Send Email Hook" > aponte para esta função. O Supabase gera um
// segredo (whsec_...) nesse momento — copie para a variável de
// ambiente AUTH_HOOK_SECRET (ver SETUP.md).
// ============================================================
import { verifyAuthHook } from '../_shared/verifyAuthHook.ts';
import { sendEmail } from '../_shared/resend.ts';
import { confirmSignupEmailHtml, recoveryEmailHtml } from '../_shared/emailTemplates.ts';

const AUTH_HOOK_SECRET = Deno.env.get('AUTH_HOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

Deno.serve(async (req) => {
  const rawBody = await req.text();

  const valid = await verifyAuthHook(req, rawBody, AUTH_HOOK_SECRET);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'assinatura inválida' }), { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const user = payload.user ?? {};
    const emailData = payload.email_data ?? {};
    const actionType = emailData.email_action_type;
    const name = user.user_metadata?.name || user.email;

    const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${emailData.token_hash}&type=${actionType}&redirect_to=${encodeURIComponent(emailData.redirect_to ?? '')}`;

    if (actionType === 'signup') {
      await sendEmail(user.email, 'Confirme seu cadastro', confirmSignupEmailHtml(name, verifyUrl));
    } else if (actionType === 'recovery') {
      await sendEmail(user.email, 'Recuperação de senha', recoveryEmailHtml(name, verifyUrl));
    }
    // outros email_action_type: não enviamos (fora do escopo deste app).

    return new Response(JSON.stringify({}), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'erro ao processar hook' }), { status: 500 });
  }
});
