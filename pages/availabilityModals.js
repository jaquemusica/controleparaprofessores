// ============================================================
// Modal de Disponibilidade (adicionar/editar bloco de horário).
// ============================================================
import { store } from '../utils/store.js';
import { render } from '../ui/render.js';
import { showToast } from '../utils/toast.js';
import { uid, DOWS } from '../utils/dom.js';
import { dbInsertAvailability, dbUpdateAvailability, dbDeleteAvailability } from '../services/availabilityService.js';

function openModalHtml(html){
  document.getElementById('modal-root').innerHTML = `<div class="modal-overlay" data-action="close-modal-bg">${html}</div>`;
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

export function openAvailabilityModal(editId){
  const editing = editId ? store.availability.find(a=>a.id===editId) : null;
  const dowOpts = DOWS.map((d,i)=>`<option value="${i}" ${editing&&editing.weekday===i?'selected':''}>${d}</option>`).join('');
  openModalHtml(`
    <div class="modal">
      <h2>${editing?'Editar horário':'Novo horário de disponibilidade'}</h2>
      <form data-form="availability" data-id="${editing?editId:''}">
        <div class="field"><label>Dia da semana *</label><select id="a_weekday" required>${dowOpts}</select></div>
        <div class="field-row">
          <div class="field"><label>Horário inicial *</label><input id="a_start" type="time" value="${editing?editing.startTime:'08:00'}" required></div>
          <div class="field"><label>Horário final *</label><input id="a_end" type="time" value="${editing?editing.endTime:'18:00'}" required></div>
        </div>
        <div class="field"><label>Duração da aula (min) *</label><input id="a_duration" type="number" min="10" step="5" value="${editing?editing.lessonDuration:50}" required></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing?'Salvar':'Adicionar'}</button>
        </div>
      </form>
    </div>
  `);
}

export function deleteAvailability(id){
  if(!confirm('Excluir este horário de disponibilidade?')) return;
  store.availability = store.availability.filter(a=>a.id!==id);
  dbDeleteAvailability(id).then(()=>{ render(); showToast('Horário excluído.'); });
}

export async function handleAvailabilitySubmit(editId){
  const weekday = Number(document.getElementById('a_weekday').value);
  const startTime = document.getElementById('a_start').value;
  const endTime = document.getElementById('a_end').value;
  const lessonDuration = Number(document.getElementById('a_duration').value)||50;

  if(endTime <= startTime){ showToast('O horário final precisa ser depois do horário inicial.'); return; }

  if(editId){
    const rule = store.availability.find(a=>a.id===editId); if(!rule) return;
    Object.assign(rule, { weekday, startTime, endTime, lessonDuration });
    const error = await dbUpdateAvailability(rule);
    if(error) return;
    closeModal(); render();
    showToast('Horário atualizado.');
    return;
  }
  const rule = { id:uid(), weekday, startTime, endTime, lessonDuration };
  const error = await dbInsertAvailability(rule);
  if(error) return;
  store.availability.push(rule);
  closeModal(); render();
  showToast('Horário adicionado.');
}
