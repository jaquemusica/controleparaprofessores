// ============================================================
// View: Detalhe do aluno (pacotes / histórico / financeiro)
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { fmtD, fmtMoney, initials, escapeHtml } from '../utils/dom.js';
import { studentById, packagesForStudent, lessonsForStudent, lessonsDoneForPackage, pkgRemaining, pkgStatus, planLabel } from '../utils/domain.js';
import { viewAlunos } from './alunos.js';

export function viewStudentDetail(){
  const s = studentById(store.state.selectedStudentId);
  if(!s){ store.state.view='alunos'; return viewAlunos(); }
  const sPackages = packagesForStudent(s.id);
  const sLessons = lessonsForStudent(s.id);
  const state = store.state;

  let body='';
  if(state.studentTab==='pacotes'){
    body = sPackages.length===0 ? `<div class="empty">Nenhum pacote cadastrado ainda.</div>` :
      sPackages.map(p=>{
        const done = lessonsDoneForPackage(p.id);
        const remaining = pkgRemaining(p);
        const status = pkgStatus(p);
        const segs = Array.from({length:p.totalLessons},(_,i)=>{
          const filled = i<done;
          const isLast = !filled && i===done && remaining===1;
          return `<i class="${filled?'done':''} ${isLast?'last':''}"></i>`;
        }).join('');
        const statusLabel = status==='andamento'?'Em andamento':status==='cancelado'?'Cancelado':'Finalizado';
        const statusBadge = status==='andamento'?'badge-info':status==='cancelado'?'badge-danger':'badge-neutral';
        return `<div class="card" style="margin-bottom:14px;">
          <div class="card-title">
            <h3>${planLabel(p)} <span class="badge ${statusBadge}" style="margin-left:8px;">${statusLabel}</span></h3>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost btn-icon" title="Editar pacote" data-action="edit-package" data-id="${p.id}">${ICONS.edit}</button>
              ${status!=='cancelado'?`<button class="btn btn-ghost btn-icon" title="Cancelar matrícula (mantém histórico)" data-action="cancel-package" data-id="${p.id}">${ICONS.x}</button>`:''}
              <button class="btn btn-ghost btn-icon" title="Excluir pacote e todas as aulas" data-action="delete-package" data-id="${p.id}">${ICONS.trash}</button>
            </div>
          </div>
          <div class="eq" style="margin-bottom:10px;">${segs}</div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-soft);margin-bottom:12px;">
            <span>${done} realizada(s)</span><span>${remaining} restante(s)</span>
          </div>
          <table>
            <tr><td style="color:var(--text-soft);width:40%;">Comprado em</td><td>${fmtD(p.purchaseDate)}</td></tr>
            <tr><td style="color:var(--text-soft);">Valor</td><td>${fmtMoney(p.value)}</td></tr>
            <tr><td style="color:var(--text-soft);">Pagamento</td><td>${p.paymentMethod}${p.paid?` · pago em ${fmtD(p.paidDate)}`:` · <span class="badge badge-danger">pendente</span>`}</td></tr>
          </table>
          ${!p.paid?`<div style="margin-top:12px;"><button class="btn btn-primary btn-sm" data-action="mark-paid" data-id="${p.id}">Marcar como pago</button></div>`:''}
        </div>`;
      }).join('');
    body += `<button class="btn btn-outline" data-action="open-add-package" data-student="${s.id}"><span style="display:flex">${ICONS.plus}</span> Novo pacote</button>`;
  } else if(state.studentTab==='aulas'){
    body = sLessons.length===0?`<div class="empty">Nenhuma aula registrada ainda.</div>`:
      `<table><thead><tr><th>Data</th><th>Horário</th><th>Duração</th><th>Status</th><th>Observações</th></tr></thead><tbody>
      ${sLessons.map(l=>`<tr>
        <td>${fmtD(l.date)}</td><td>${l.time}</td><td>${l.duration} min</td>
        <td>${l.status==='realizada'?'<span class="badge badge-success">Realizada</span>':l.status==='falta'?'<span class="badge badge-danger">Falta</span>':'<span class="badge badge-info">Agendada</span>'}</td>
        <td>${l.notes?escapeHtml(l.notes):'—'}</td>
      </tr>`).join('')}
      </tbody></table>`;
  } else if(state.studentTab==='financeiro'){
    const total = sPackages.reduce((s2,p)=>s2+(p.paid?Number(p.value||0):0),0);
    const pend = sPackages.reduce((s2,p)=>s2+(!p.paid?Number(p.value||0):0),0);
    body = `
      <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px;">
        <div class="card stat-card"><div class="card-title"><h3>Total pago</h3></div><div class="value" style="font-size:24px;">${fmtMoney(total)}</div></div>
        <div class="card stat-card"><div class="card-title"><h3>Pendente</h3></div><div class="value" style="font-size:24px;">${fmtMoney(pend)}</div></div>
      </div>
      ${sPackages.length===0?`<div class="empty">Nenhum pagamento registrado.</div>`:
      `<table><thead><tr><th>Data compra</th><th>Pacote</th><th>Valor</th><th>Forma</th><th>Status</th></tr></thead><tbody>
      ${sPackages.map(p=>`<tr>
        <td>${fmtD(p.purchaseDate)}</td><td>${planLabel(p)}</td><td class="num">${fmtMoney(p.value)}</td><td>${p.paymentMethod}</td>
        <td>${p.paid?`<span class="badge badge-success">Pago</span>`:`<span class="badge badge-danger">Pendente</span>`}</td>
      </tr>`).join('')}
      </tbody></table>`}
    `;
  }

  return `
    <button class="back-link" data-action="back-students">${ICONS.chevL} Voltar para alunos</button>
    <div class="student-head">
      <div class="avatar">${initials(s.name)}</div>
      <div>
        <h1>${s.name}</h1>
        <p class="page-sub">${s.phone||'sem telefone'}${s.email?' · '+s.email:''}</p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button class="btn btn-ghost btn-icon" title="Editar aluno" data-action="edit-student" data-id="${s.id}">${ICONS.edit}</button>
        <button class="btn btn-ghost btn-icon" title="Excluir aluno" data-action="delete-student" data-id="${s.id}">${ICONS.trash}</button>
      </div>
    </div>
    ${s.notes?`<p class="page-sub" style="margin-bottom:18px;">${escapeHtml(s.notes)}</p>`:''}
    <div class="tabs">
      <div class="tab ${state.studentTab==='pacotes'?'active':''}" data-action="student-tab" data-tab="pacotes">Pacotes</div>
      <div class="tab ${state.studentTab==='aulas'?'active':''}" data-action="student-tab" data-tab="aulas">Histórico de aulas</div>
      <div class="tab ${state.studentTab==='financeiro'?'active':''}" data-action="student-tab" data-tab="financeiro">Financeiro</div>
    </div>
    ${body}
  `;
}
