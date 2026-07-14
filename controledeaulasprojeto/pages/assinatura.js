// ============================================================
// Views de Assinatura: tela de bloqueio (sem sessão de app,
// quando não há assinatura ativa) e a página normal dentro do
// app (status atual + cancelar).
// ============================================================
import { store } from '../utils/store.js';
import { fmtMoney } from '../utils/dom.js';

const STATUS_LABEL = {
  pending: { text:'Nenhuma assinatura ativa', badge:'badge-neutral' },
  active: { text:'Assinatura ativa', badge:'badge-success' },
  overdue: { text:'Pagamento atrasado', badge:'badge-warning' },
  canceled: { text:'Assinatura cancelada', badge:'badge-danger' },
};

// Tela cheia (sem sidebar) — usada quando o acesso está bloqueado.
export function viewSubscriptionBlocked(){
  const status = store.subscription?.status || 'pending';
  const title = status==='canceled' ? 'Sua assinatura foi cancelada' : 'Assine o Plano PRO para continuar';
  const desc = status==='canceled'
    ? 'Para voltar a acessar seus alunos, aulas e agenda, reative sua assinatura.'
    : 'Você criou sua conta, mas ainda não tem uma assinatura ativa. Assine o Plano PRO para liberar o acesso ao sistema.';
  return `
    <div style="max-width:440px;margin:80px auto;text-align:center;">
      <div class="brand-mark" style="width:48px;height:48px;border-radius:12px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;margin:0 auto 18px;">J</div>
      <h1 style="margin:0 0 8px;">${title}</h1>
      <p class="page-sub" style="margin-bottom:22px;">${desc}</p>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
        <button class="btn btn-primary" data-action="start-subscription">Assinar Plano PRO</button>
        <button class="btn btn-outline btn-sm" data-action="refresh-subscription-status">Já paguei, atualizar status</button>
        <button class="btn btn-ghost btn-sm" data-action="logout" style="margin-top:8px;">Sair</button>
      </div>
    </div>
  `;
}

// Página normal (dentro do app, item "Assinatura" na sidebar).
export function viewAssinatura(){
  const sub = store.subscription || { status:'pending' };
  const info = STATUS_LABEL[sub.status] || STATUS_LABEL.pending;
  return `
    <div class="page-head">
      <div><h1>Assinatura</h1><p class="page-sub">Plano PRO — gerencie seu pagamento.</p></div>
    </div>
    <div class="card" style="max-width:480px;">
      <div class="card-title"><h3>Status</h3><span class="badge ${info.badge}">${info.text}</span></div>
      ${sub.planValue?`<p class="page-sub">Valor: ${fmtMoney(sub.planValue)} / mês</p>`:''}
      ${sub.status==='overdue'?`<p class="page-sub" style="color:var(--danger);">Seu último pagamento não foi identificado. Regularize para não perder o acesso.</p>`:''}
      <div style="display:flex;gap:10px;margin-top:14px;">
        ${sub.status!=='active'?`<button class="btn btn-primary" data-action="start-subscription">${sub.status==='overdue'?'Regularizar pagamento':'Assinar Plano PRO'}</button>`:''}
        ${sub.status==='active'||sub.status==='overdue'?`<button class="btn btn-outline" data-action="cancel-subscription">Cancelar assinatura</button>`:''}
      </div>
    </div>
  `;
}
