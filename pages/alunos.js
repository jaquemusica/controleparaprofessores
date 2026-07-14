// ============================================================
// View: Lista de alunos
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { initials, escapeAttr } from '../utils/dom.js';
import { activePackagesForStudent, packagesForStudent, pkgRemaining } from '../utils/domain.js';

export function viewAlunos(){
  const { students } = store;
  const q = store.state.studentSearch.toLowerCase();
  const list = students.filter(s=>s.name.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  return `
    <div class="page-head">
      <div><h1>Alunos</h1><p class="page-sub">${students.length} aluno(s) cadastrado(s)</p></div>
      <button class="btn btn-primary" data-action="open-add-student"><span style="display:flex">${ICONS.plus}</span> Novo aluno</button>
    </div>
    <div class="search-box">${ICONS.users}<input placeholder="Buscar aluno..." value="${escapeAttr(store.state.studentSearch)}" data-action="student-search" /></div>
    <div class="card">
      ${list.length===0?`<div class="empty">Nenhum aluno encontrado.</div>`:
        list.map(s=>{
          const active = activePackagesForStudent(s.id)[0];
          const pend = packagesForStudent(s.id).some(p=>!p.paid);
          let subtxt = active ? `${pkgRemaining(active)} aula(s) restante(s)` : 'Sem pacote ativo';
          return `<div class="row-item" style="cursor:pointer;" data-action="open-student" data-id="${s.id}">
            <div class="avatar">${initials(s.name)}</div>
            <div class="row-main"><div class="name">${s.name}</div><div class="sub">${subtxt}</div></div>
            <div class="row-actions">
              ${active && pkgRemaining(active)===1?`<span class="badge badge-warning">acabando</span>`:''}
              ${pend?`<span class="badge badge-danger">pendente</span>`:''}
            </div>
          </div>`;
        }).join('')}
    </div>
  `;
}
