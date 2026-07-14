// ============================================================
// CONFIGURAÇÃO CENTRAL DE E-MAIL (Resend)
// Único lugar do projeto que conhece a chave da API do Resend e
// o remetente. Toda função que precisa mandar e-mail importa
// `sendEmail` daqui — nunca chama a API do Resend diretamente.
// ============================================================
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Jaque Música <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY não configurada nas variáveis de ambiente da função.');
}

export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Falha ao enviar e-mail via Resend:', res.status, body);
  }
  return res.ok;
}
