// ============================================================
// View: Disponibilidade — dias/horários em que o professor dá aula.
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { DOWS } from '../utils/dom.js';

export function bookingLink(){
  const slug = store.profile?.slug;
  if(!slug) return '';
  return new URL(`agendar.html?u=${encodeURIComponent(slug)}`, window.location.href).toString();
}

function viewBookingLinkCard(){
  const link = bookingLink();
  if(!link) return '';
  return `
    <div class="card" style="margin-bottom:18px;">
      <div class="card-title"><h3>${ICONS.link} Seu link de agendamento</h3></div>
      <p class="page-sub" style="margin:0 0 10px;">Compartilhe com seus alunos para que eles escolham um horário livre e solicitem uma aula.</p>
      <div class="search-box" style="margin-bottom:0;">
        <input readonly value="${link}" onclick="this.select()" style="font-size:13px;">
        <button class="btn btn-primary btn-sm" data-action="copy-booking-link" style="flex-shrink:0;">${ICONS.copy} Copiar</button>
      </div>
    </div>
  `;
}

export function viewDisponibilidade(){
  const rules = store.availability.slice().sort((a,b)=> a.weekday-b.weekday || a.startTime.localeCompare(b.startTime));
  return `
    <div class="page-head">
      <div><h1>Disponibilidade</h1><p class="page-sub">Defina os dias e horários em que você dá aula. A agenda só oferece esses horários.</p></div>
      <button class="btn btn-primary" data-action="open-add-availability"><span style="display:flex">${ICONS.plus}</span> Adicionar horário</button>
    </div>
    ${viewBookingLinkCard()}
    <div class="card">
      ${rules.length===0?`<div class="empty">Nenhum horário de disponibilidade cadastrado ainda. Adicione pelo menos um para poder agendar aulas.</div>`:
        rules.map(r=>`
          <div class="row-item">
            <div class="avatar">${ICONS.clock}</div>
            <div class="row-main">
              <div class="name">${DOWS[r.weekday]}</div>
              <div class="sub">${r.startTime} às ${r.endTime} · aulas de ${r.lessonDuration} min</div>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost btn-icon" title="Editar" data-action="edit-availability" data-id="${r.id}">${ICONS.edit}</button>
              <button class="btn btn-ghost btn-icon" title="Excluir" data-action="delete-availability" data-id="${r.id}">${ICONS.trash}</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
}
