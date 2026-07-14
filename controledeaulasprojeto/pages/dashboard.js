// ============================================================
// View: Dashboard (Início)
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { todayStr, fmtD, fmtMoney, initials, addDays, startOfWeek, parseD, MONTHS } from '../utils/dom.js';
import { studentById, lessonsEndingPackages, pendingPayments } from '../utils/domain.js';
import { viewBookingLinkCard } from './disponibilidade.js';

export function viewDashboard(){
  const { lessons, packages } = store;
  const state = store.state;
  const today = todayStr();
  const todays = lessons.filter(l=>l.date===today).sort((a,b)=>a.time.localeCompare(b.time));
  const ending = lessonsEndingPackages();
  const pending = pendingPayments();
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart,6);
  const weekLessons = lessons.filter(l=>l.date>=weekStart && l.date<=weekEnd);

  const monthsOptions = MONTHS.map((m,i)=>`<option value="${i}" ${i===state.financeMonth?'selected':''}>${m}</option>`).join('');
  const years = Array.from(new Set([new Date().getFullYear(), ...packages.map(p=>parseD(p.purchaseDate).getFullYear())]));
  if(!years.includes(state.financeYear)) years.push(state.financeYear);
  years.sort();
  const yearsOptions = years.map(y=>`<option value="${y}" ${y===state.financeYear?'selected':''}>${y}</option>`).join('');
  const recebidoMes = packages.filter(p=>p.paid && p.paidDate && parseD(p.paidDate).getMonth()===state.financeMonth && parseD(p.paidDate).getFullYear()===state.financeYear)
    .reduce((s,p)=>s+Number(p.value||0),0);

  const nome = store.profile?.name ? store.profile.name.split(' ')[0] : 'professor(a)';

  return `
    <div class="page-head">
      <div><h1>Boa, ${nome}</h1><p class="page-sub">${fmtD(today)} · aqui está o resumo do seu estúdio</p></div>
      <button class="btn btn-primary" data-action="open-add-lesson"><span style="display:flex">${ICONS.plus}</span> Nova aula</button>
    </div>
    ${viewBookingLinkCard()}
    <div class="grid grid-dash">

      <div class="card" style="grid-column:span 7;">
        <div class="card-title"><h3>${ICONS.calendar} Aulas de hoje</h3><span class="badge badge-neutral">${todays.length}</span></div>
        ${todays.length===0?`<div class="empty">Nenhuma aula agendada para hoje.</div>`:
          todays.map(l=>{
            const st=studentById(l.studentId); if(!st) return '';
            return `<div class="row-item">
              <div class="avatar">${initials(st.name)}</div>
              <div class="row-main"><div class="name">${st.name}</div><div class="sub">${l.time} · ${l.duration} min</div></div>
              ${l.status==='realizada'?`<span class="badge badge-success">Realizada</span>`:
                l.status==='falta'?`<span class="badge badge-danger">Falta</span>`:
                `<div class="row-actions">
                  <button class="btn btn-ghost btn-icon" title="Marcar falta" data-action="set-lesson-status" data-id="${l.id}" data-status="falta">${ICONS.x}</button>
                  <button class="btn btn-primary btn-icon" title="Marcar realizada" data-action="set-lesson-status" data-id="${l.id}" data-status="realizada">${ICONS.check}</button>
                </div>`}
            </div>`;
          }).join('')}
      </div>

      <div class="card" style="grid-column:span 5;">
        <div class="card-title"><h3>${ICONS.alert} Pacotes acabando</h3><span class="badge badge-warning">${ending.length}</span></div>
        ${ending.length===0?`<div class="empty">Nenhum pacote na última aula.</div>`:
          ending.map(p=>{
            const st=studentById(p.studentId); if(!st) return '';
            return `<div class="row-item">
              <div class="avatar">${initials(st.name)}</div>
              <div class="row-main"><div class="name">${st.name}</div><div class="sub">resta 1 aula</div></div>
              <div class="row-actions">
                <button class="btn btn-ghost btn-icon" title="Copiar mensagem" data-action="copy-renew-msg" data-id="${st.id}">${ICONS.copy}</button>
                <button class="btn btn-outline btn-sm" data-action="open-add-package" data-student="${st.id}">+ Pacote</button>
              </div>
            </div>`;
          }).join('')}
      </div>

      <div class="card" style="grid-column:span 5;">
        <div class="card-title"><h3>${ICONS.money} Pagamentos pendentes</h3><span class="badge badge-danger">${pending.length}</span></div>
        ${pending.length===0?`<div class="empty">Tudo certo por aqui.</div>`:
          pending.map(p=>{
            const st=studentById(p.studentId); if(!st) return '';
            return `<div class="row-item">
              <div class="avatar">${initials(st.name)}</div>
              <div class="row-main"><div class="name">${st.name}</div><div class="sub">${fmtMoney(p.value)}</div></div>
              <div class="row-actions">
                <button class="btn btn-ghost btn-icon" title="Copiar lembrete" data-action="copy-payment-msg" data-id="${p.id}">${ICONS.copy}</button>
                <button class="btn btn-primary btn-sm" data-action="mark-paid" data-id="${p.id}">Marcar pago</button>
              </div>
            </div>`;
          }).join('')}
      </div>

      <div class="card stat-card" style="grid-column:span 4;">
        <div class="card-title"><h3>${ICONS.money} Recebido no mês</h3></div>
        <div class="value">${fmtMoney(recebidoMes)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <select class="stat-select" data-action="finance-month-change">${monthsOptions}</select>
          <select class="stat-select" data-action="finance-year-change">${yearsOptions}</select>
        </div>
      </div>

      <div class="card stat-card" style="grid-column:span 3;">
        <div class="card-title"><h3>${ICONS.calendar} Aulas na semana</h3></div>
        <div class="value">${weekLessons.length}</div>
        <div class="label">${fmtD(weekStart)} – ${fmtD(weekEnd)}</div>
      </div>

    </div>
  `;
}
