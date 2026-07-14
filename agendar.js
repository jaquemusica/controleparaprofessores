// ============================================================
// Página pública de agendamento — sem login. O aluno escolhe um
// horário livre do professor e solicita a aula.
// ============================================================
import { getPublicProfessor, getAvailableSlotsPublic, createBookingRequestPublic } from './services/bookingService.js';
import { showToast } from './utils/toast.js';
import { todayStr, fmtD, addDays, escapeHtml } from './utils/dom.js';

const headerEl = document.getElementById('booking-header');
const contentEl = document.getElementById('booking-content');

function getSlugFromUrl(){
  const m = window.location.pathname.match(/\/agendar\/([^/?#]+)/);
  if(m) return decodeURIComponent(m[1]);
  return new URLSearchParams(window.location.search).get('u');
}

function renderError(msg){
  headerEl.innerHTML = `<div class="brand-mark">!</div><h1>Link inválido</h1><p></p>`;
  contentEl.innerHTML = `<div class="card"><div class="empty">${escapeHtml(msg)}</div></div>`;
}

let selectedDate = null;
let selectedTime = null;

function renderBookingUI(professor){
  headerEl.innerHTML = `
    <div class="brand-mark">${professor.name.trim()[0]?.toUpperCase()||'?'}</div>
    <h1>${escapeHtml(professor.name)}</h1>
    <p>Escolha um horário disponível para solicitar sua aula.</p>
  `;
  const min = todayStr();
  const max = addDays(min, 60);
  contentEl.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="field" style="margin-bottom:0;">
        <label>Data</label>
        <input type="date" id="b_date" min="${min}" max="${max}" value="${min}">
      </div>
    </div>
    <div class="card" id="b_slots_card" style="margin-bottom:16px;">
      <div class="card-title"><h3>Horários livres</h3></div>
      <div id="b_slots"></div>
    </div>
    <div class="card booking-step" id="b_form_card">
      <div class="card-title"><h3>Solicitar aula</h3></div>
      <p class="page-sub" id="b_selected_info" style="margin:0 0 14px;"></p>
      <form id="b_form">
        <div class="field"><label>Seu nome *</label><input id="b_name" required></div>
        <div class="field"><label>WhatsApp *</label><input id="b_phone" required placeholder="(11) 99999-9999"></div>
        <div class="field"><label>Observação</label><textarea id="b_note" rows="2" placeholder="Algo que o professor deveria saber..."></textarea></div>
        <button type="submit" class="btn btn-primary auth-submit">Solicitar aula</button>
      </form>
    </div>
    <div class="card booking-step" id="b_success_card">
      <div class="empty" style="color:var(--success);">Solicitação enviada! O professor vai confirmar em breve pelo WhatsApp.</div>
    </div>
  `;

  document.getElementById('b_date').addEventListener('change', (e)=>{
    selectedDate = e.target.value;
    loadSlots(professor.slug, selectedDate);
  });
  document.getElementById('b_form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await submitRequest(professor.slug);
  });

  selectedDate = min;
  loadSlots(professor.slug, selectedDate);
}

async function loadSlots(slug, date){
  const box = document.getElementById('b_slots');
  box.innerHTML = `<div class="empty">Carregando horários...</div>`;
  document.getElementById('b_form_card').classList.remove('active');
  selectedTime = null;
  try{
    const slots = await getAvailableSlotsPublic(slug, date, date);
    if(slots.length===0){
      box.innerHTML = `<div class="empty">Nenhum horário livre neste dia. Tente outra data.</div>`;
      return;
    }
    box.innerHTML = `<div class="slots-grid">${slots.map(s=>`<button type="button" class="slot-btn" data-time="${s.time}">${s.time}</button>`).join('')}</div>`;
    box.querySelectorAll('.slot-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        box.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTime = btn.dataset.time;
        document.getElementById('b_selected_info').textContent = `${fmtD(date)} às ${selectedTime}`;
        document.getElementById('b_form_card').classList.add('active');
        document.getElementById('b_form_card').scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  }catch(err){
    console.error(err);
    box.innerHTML = `<div class="empty">Não foi possível carregar os horários.</div>`;
  }
}

async function submitRequest(slug){
  if(!selectedDate || !selectedTime){ showToast('Escolha um horário primeiro.'); return; }
  const name = document.getElementById('b_name').value.trim();
  const phone = document.getElementById('b_phone').value.trim();
  const note = document.getElementById('b_note').value.trim();
  if(!name || !phone) return;

  const btn = document.querySelector('#b_form button[type=submit]');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try{
    await createBookingRequestPublic(slug, selectedDate, selectedTime, name, phone, note);
    document.getElementById('b_form_card').classList.remove('active');
    document.getElementById('b_success_card').classList.add('active');
    document.getElementById('b_success_card').scrollIntoView({ behavior:'smooth', block:'start' });
  }catch(err){
    console.error(err);
    showToast(err.message || 'Não foi possível enviar a solicitação. Tente outro horário.');
    btn.disabled = false; btn.textContent = 'Solicitar aula';
    loadSlots(slug, selectedDate); // horário pode ter sido ocupado nesse meio tempo
  }
}

(async function init(){
  const slug = getSlugFromUrl();
  if(!slug){ renderError('Nenhum professor informado neste link.'); return; }
  try{
    const professor = await getPublicProfessor(slug);
    if(!professor){ renderError('Não encontramos esse professor. Confira o link e tente novamente.'); return; }
    renderBookingUI(professor);
  }catch(err){
    console.error(err);
    renderError('Não foi possível carregar esta página. Tente novamente em instantes.');
  }
})();
