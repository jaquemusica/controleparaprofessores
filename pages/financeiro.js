// ============================================================
// View: Financeiro
// ============================================================
import { store } from '../utils/store.js';
import { fmtD, fmtMoney, parseD, MONTHS } from '../utils/dom.js';
import { studentById } from '../utils/domain.js';

export function viewFinanceiro(){
  const { packages } = store;
  const state = store.state;
  const monthsOptions = MONTHS.map((m,i)=>`<option value="${i}" ${i===state.financeMonth?'selected':''}>${m}</option>`).join('');
  const years = Array.from(new Set([new Date().getFullYear(), ...packages.map(p=>parseD(p.purchaseDate).getFullYear())]));
  if(!years.includes(state.financeYear)) years.push(state.financeYear);
  years.sort();
  const yearsOptions = years.map(y=>`<option value="${y}" ${y===state.financeYear?'selected':''}>${y}</option>`).join('');

  const paidInYear = packages.filter(p=>p.paid && p.paidDate && parseD(p.paidDate).getFullYear()===state.financeYear);
  const recebidoMes = paidInYear.filter(p=>parseD(p.paidDate).getMonth()===state.financeMonth)
    .reduce((s,p)=>s+Number(p.value||0),0);
  const recebidoAno = paidInYear.reduce((s,p)=>s+Number(p.value||0),0);
  const aReceber = packages.filter(p=>!p.paid).reduce((s,p)=>s+Number(p.value||0),0);

  const porMes = MONTHS.map((m,i)=>{
    const total = paidInYear.filter(p=>parseD(p.paidDate).getMonth()===i).reduce((s,p)=>s+Number(p.value||0),0);
    return {m, i, total};
  });
  const maxMes = Math.max(1, ...porMes.map(x=>x.total));

  const allRows = packages.slice().sort((a,b)=>parseD(b.purchaseDate)-parseD(a.purchaseDate));

  return `
    <div class="page-head">
      <div><h1>Financeiro</h1><p class="page-sub">Visão geral dos seus recebimentos.</p></div>
    </div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;">
      <div class="card stat-card">
        <div class="card-title"><h3>Recebido no mês</h3></div>
        <div class="value">${fmtMoney(recebidoMes)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <select class="stat-select" data-action="finance-month-change">${monthsOptions}</select>
          <select class="stat-select" data-action="finance-year-change">${yearsOptions}</select>
        </div>
      </div>
      <div class="card stat-card">
        <div class="card-title"><h3>Recebido no ano</h3></div>
        <div class="value">${fmtMoney(recebidoAno)}</div>
        <div class="label">total pago em ${state.financeYear}</div>
      </div>
      <div class="card stat-card">
        <div class="card-title"><h3>A receber</h3></div>
        <div class="value">${fmtMoney(aReceber)}</div>
        <div class="label">total em pacotes pendentes</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title"><h3>Recebido por mês em ${state.financeYear}</h3></div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${porMes.map(x=>`
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;flex-shrink:0;font-size:12px;color:var(--text-soft);">${x.m.slice(0,3)}</div>
            <div style="flex:1;background:var(--surface-alt);border-radius:6px;overflow:hidden;height:16px;">
              <div style="width:${(x.total/maxMes*100).toFixed(1)}%;background:${x.i===state.financeMonth?'var(--accent)':'var(--primary)'};height:100%;border-radius:6px;"></div>
            </div>
            <div style="width:90px;text-align:right;font-size:12.5px;font-variant-numeric:tabular-nums;">${fmtMoney(x.total)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title"><h3>Histórico de pagamentos</h3></div>
      ${allRows.length===0?`<div class="empty">Nenhum pagamento registrado ainda.</div>`:
      `<table><thead><tr><th>Aluno</th><th>Data compra</th><th>Valor</th><th>Forma</th><th>Status</th><th></th></tr></thead><tbody>
      ${allRows.map(p=>{
        const st=studentById(p.studentId);
        return `<tr>
          <td>${st?st.name:'—'}</td><td>${fmtD(p.purchaseDate)}</td><td class="num">${fmtMoney(p.value)}</td><td>${p.paymentMethod}</td>
          <td>${p.paid?`<span class="badge badge-success">Pago</span>`:`<span class="badge badge-danger">Pendente</span>`}</td>
          <td>${!p.paid?`<button class="btn btn-primary btn-sm" data-action="mark-paid" data-id="${p.id}">Marcar pago</button>`:''}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`}
    </div>
  `;
}
