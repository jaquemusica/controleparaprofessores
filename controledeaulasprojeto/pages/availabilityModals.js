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

const DURATION_OPTIONS = [15, 20, 25, 30, 40, 45, 50, 55, 60, 75, 90, 120];

function timeOptions(selected){
  const opts=[];
  for(let m=0; m<24*60; m+=15){
    const hh=String(Math.floor(m/60)).padStart(2,'0');
    const mm=String(m%60).padStart(2,'0');
    const t=`${hh}:${mm}`;
    opts.push(`<option value="${t}" ${t===selected?'selected':''}>${t}</option>`);
  }
  return opts.join('');
}
function durationOptions(selected){
  const opts = DURATION_OPTIONS.includes(Number(selected)) ? DURATION_OPTIONS : [...DURATION_OPTIONS, Number(selected)].sort((a,b)=>a-b);
  return opts.map(d=>`<option value="${d}" ${d===Number(selected)?'selected':''}>${d} min</option>`).join('');
}

export function openAvailabilityModal(editId){
  const editing = editId ? store.availability.find(a=>a.id===editId) : null;
  const dowOpts = DOWS.map((d,i)=>`<option value="${i}" ${editing&&editing.weekday===i?'selected':''}>${d}</option>`).join('');
  openModalHtml(`
    <div class="modal">
      <h2>${editing?'Editar horário':'Novo horário de disponibilidade'}</h2>
      <form data-form="availability" data-id="${editing?editId:''}">
        <div class="field"><label>Dia da semana *</label><select id="a_weekday" required>${dowOpts}</select></div>
        <div class="field-row">
          <div class="field"><label>Horário inicial *</label><select id="a_start" required>${timeOptions(editing?editing.startTime:'08:00')}</select></div>
          <div class="field"><label>Horário final *</label><select id="a_end" required>${timeOptions(editing?editing.endTime:'18:00')}</select></div>
        </div>
        <div class="field"><label>Duração da aula *</label><select id="a_duration" required>${durationOptions(editing?editing.lessonDuration:50)}</select></div>
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
