// ============================================================
// Modelos dos e-mails transacionais. Texto simples e centralizado
// aqui para facilitar ajustes sem mexer na lógica de envio.
// ============================================================
function layout(title: string, bodyHtml: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2B1F24;">
      <h2 style="color:#6B2737;margin:0 0 16px;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:28px;font-size:12px;color:#8A7B80;">Jaque Música — Gestão de Aulas</p>
    </div>
  `;
}

export function confirmSignupEmailHtml(name: string, confirmUrl: string) {
  return layout('Confirme seu cadastro', `
    <p>Oi, ${name}!</p>
    <p>Clique no botão abaixo para confirmar seu e-mail e ativar sua conta:</p>
    <p style="margin:20px 0;"><a href="${confirmUrl}" style="background:#6B2737;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmar cadastro</a></p>
    <p style="font-size:12.5px;color:#8A7B80;">Se você não criou esta conta, pode ignorar este e-mail.</p>
  `);
}

export function recoveryEmailHtml(name: string, resetUrl: string) {
  return layout('Recuperação de senha', `
    <p>Oi, ${name}!</p>
    <p>Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para escolher uma nova senha:</p>
    <p style="margin:20px 0;"><a href="${resetUrl}" style="background:#6B2737;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></p>
    <p style="font-size:12.5px;color:#8A7B80;">Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
  `);
}

export function paymentApprovedEmailHtml(name: string) {
  return layout('Pagamento aprovado', `
    <p>Oi, ${name}!</p>
    <p>Seu pagamento do Plano PRO foi aprovado e seu acesso está liberado. Bom trabalho com seus alunos!</p>
  `);
}
