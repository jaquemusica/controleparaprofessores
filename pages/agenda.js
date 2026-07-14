// ============================================================
// View: Agenda (semana / mês)
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { todayStr, fmtD, addDays, DOWS, MONTH_NAMES, escapeHtml, escapeAttr, pad } from '../utils/dom.js';
import { studentById, packageById, pkgStatus, pkgRemaining } from '../utils/domain.js';

function viewPendingRequests(){
  const pending = store.bookingRequests.filter(r=>r.status==='pendente');
  if(pending.length===0) return '';
  return `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-title"><h3>${ICONS.link} Solicitações de agendamento</h3><span class="badge badge-warning">${pending.length}</span></div>
      ${pending.map(r=>`
        <div class="row-item">
          <div class="avatar">${r.studentName.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()}</div>
          <div class="row-main">
            <div class="name">${escapeHtml(r.studentName)}</div>
            <div class="sub">${fmtD(r.date)} · ${r.time} · ${r.studentPhone}${r.note?(' · '+escapeHtml(r.note)):''}</div>
          </div>
          <div class="row-actions">
            <button class="btn btn-ghost btn-icon" title="Recusar" data-action="decline-booking-request" data-id="${r.id}">${ICONS.x}</button>
            <button class="btn btn-primary btn-icon" title="Aceitar" data-action="accept-booking-request" data-id="${r.id}">${ICONS.check}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function agendaToggle(){
  const state = store.state;
  return `<div class="agenda-nav" style="margin-bottom:0;">
    <button class="btn ${state.agendaViewMode==='semana'?'btn-primary':'btn-ghost'} btn-sm" data-action="agenda-view-week">Semana</button>
    <button class="btn ${state.agendaViewMode==='mes'?'btn-primary':'btn-ghost'} btn-sm" data-action="agenda-view-month">Mês</button>
  </div>`;
}

export function viewAgenda(){
  const state = store.state;
  return `
    <div class="page-head">
      <div><h1>Agenda</h1><p class="page-sub">Suas aulas marcadas.</p></div>
      <button class="btn btn-primary" data-action="open-add-lesson"><span style="display:flex">${ICONS.plus}</span> Nova aula</button>
    </div>
    ${viewPendingRequests()}
    ${agendaToggle()}
    ${state.agendaViewMode==='mes'?viewAgendaMonth():viewAgendaWeek()}
  `;
}

function viewAgendaWeek(){
  const { lessons } = store;
  const start = store.state.agendaWeekStart;
  const days = Array.from({length:7},(_,i)=>addDays(start,i));
  const today = todayStr();

  const dayBlocks = days.map((d,i)=>{
    const dayLessons = lessons.filter(l=>l.date===d).sort((a,b)=>a.time.localeCompare(b.time));
    return `<div class="day-block">
      <div class="day-head">
        <span class="dow ${d===today?'dtoday':''}">${DOWS[i]}</span>
        <span class="dnum ${d===today?'dtoday':''}">${fmtD(d)}${d===today?' · hoje':''}</span>
      </div>
      ${dayLessons.length===0?`<div class="empty" style="text-align:left;padding:6px 4px;">Sem aulas.</div>`:
        dayLessons.map(l=>{
          const st=studentById(l.studentId); if(!st) return '';
          const pkg=packageById(l.packageId);
          const isLast = pkg && pkgStatus(pkg)==='andamento' && pkgRemaining(pkg)===1 && l.status!=='realizada';
          return `<div class="lesson-card st-${l.status}">
            <div class="lesson-time">${l.time}</div>
            <div class="lesson-main">
              <div class="lname">${st.name} ${isLast?`<span class="badge badge-warning" style="margin-left:6px;">última do pacote</span>`:''}</div>
              <div class="lsub">${l.duration} min${l.notes?(' · '+escapeHtml(l.notes)):''}</div>
            </div>
            <div class="lesson-actions">
              <select class="status-select" data-action="lesson-status-select" data-id="${l.id}">
                <option value="agendada" ${l.status==='agendada'?'selected':''}>Agendada</option>
                <option value="realizada" ${l.status==='realizada'?'selected':''}>Realizada</option>
                <option value="falta" ${l.status==='falta'?'selected':''}>Falta</option>
              </select>
              <button class="btn btn-ghost btn-icon" title="Remarcar aula" data-action="edit-lesson" data-id="${l.id}">${ICONS.edit}</button>
              <button class="btn btn-ghost btn-icon" title="Excluir aula" data-action="delete-lesson" data-id="${l.id}">${ICONS.trash}</button>
            </div>
          </div>`;
        }).join('')}
    </div>`;
  }).join('');

  return `
    <div class="agenda-nav">
      <button class="btn btn-ghost btn-icon" data-action="agenda-prev">${ICONS.chevL}</button>
      <button class="btn btn-ghost btn-icon" data-action="agenda-next">${ICONS.chevR}</button>
      <button class="btn btn-outline btn-sm" data-action="agenda-today">Hoje</button>
      <span class="agenda-range">${fmtD(days[0])} – ${fmtD(days[6])}</span>
    </div>
    ${dayBlocks}
  `;
}

function viewAgendaMonth(){
  const { lessons } = store;
  const state = store.state;
  const y=state.agendaYear, m=state.agendaMonth;
  const firstOfMonth = new Date(y,m,1);
  const firstDow = (firstOfMonth.getDay()+6)%7; // 0=Monday
  const daysInMonth = new Date(y,m+1,0).getDate();
  const gridStart = new Date(y,m,1-firstDow);
  const today = todayStr();

  const cells=[];
  for(let i=0;i<42;i++){
    const d=new Date(gridStart); d.setDate(gridStart.getDate()+i);
    const dStr = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const inMonth = d.getMonth()===m;
    const dayLessons = lessons.filter(l=>l.date===dStr).sort((a,b)=>a.time.localeCompare(b.time));
    const visible = dayLessons.slice(0,3);
    const extra = dayLessons.length-visible.length;
    cells.push(`<div class="month-cell${inMonth?'':' out'}${dStr===today?' today':''}">
      <div class="month-cell-num">${d.getDate()}</div>
      ${visible.map(l=>{ const st=studentById(l.studentId); return `<div class="month-chip st-${l.status}" style="cursor:pointer;" data-action="edit-lesson" data-id="${l.id}" title="${st?escapeAttr(st.name):''} · ${l.time} · clique para remarcar">${l.time} ${st?escapeHtml(st.name.split(' ')[0]):''}</div>`; }).join('')}
      ${extra>0?`<div class="month-more">+${extra} mais</div>`:''}
    </div>`);
  }
  const totalCells = Math.ceil((firstDow+daysInMonth)/7)*7;
  const trimmed = cells.slice(0,totalCells);

  return `
    <div class="agenda-nav">
      <button class="btn btn-ghost btn-icon" data-action="agenda-month-prev">${ICONS.chevL}</button>
      <button class="btn btn-ghost btn-icon" data-action="agenda-month-next">${ICONS.chevR}</button>
      <button class="btn btn-outline btn-sm" data-action="agenda-month-today">Hoje</button>
      <span class="agenda-range">${MONTH_NAMES[m]} de ${y}</span>
    </div>
    <div class="month-grid month-head-row">
      ${DOWS.map(d=>`<div class="month-dow">${d.slice(0,3)}</div>`).join('')}
    </div>
    <div class="month-grid">
      ${trimmed.join('')}
    </div>
  `;
}
