// ============================================================
// Página pública de agendamento — sem login. O aluno escolhe um
// horário livre do professor e solicita a aula.
// ============================================================
import { getPublicProfessor, getAvailableSlotsPublic, createBookingRequestPublic } from './services/bookingService.js';
import { showToast } from './utils/toast.js';
import { todayStr, fmtD, addDays, escapeHtml, DOWS, parseD } from './utils/dom.js';

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
  contentEl.innerHTML = `
    <div class="card" id="b_slots_card" style="margin-bottom:16px;">
      <div class="card-title"><h3>Horários disponíveis</h3></div>
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

  document.getElementById('b_form').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await submitRequest(professor.slug);
  });

  loadSlots(professor.slug);
}

async function loadSlots(slug){
  const box = document.getElementById('b_slots');
  box.innerHTML = `<div class="empty">Carregando horários...</div>`;
  document.getElementById('b_form_card').classList.remove('active');
  selectedDate = null;
  selectedTime = null;
  try{
    const from = todayStr();
    const to = addDays(from, 60);
    const slots = await getAvailableSlotsPublic(slug, from, to);
    if(slots.length===0){
      box.innerHTML = `<div class="empty">Nenhum horário livre nos próximos dias. Fale diretamente com o professor.</div>`;
      return;
    }
    const byDate = new Map();
    slots.forEach(s=>{
      if(!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date).push(s.time);
    });
    const groups = [...byDate.entries()].slice(0, 20);
    box.innerHTML = groups.map(([date, times])=>{
      const weekday = DOWS[(parseD(date).getDay()+6)%7];
      return `
        <div class="booking-day-group">
          <div class="booking-day-label">${weekday}, ${fmtD(date)}</div>
          <div class="slots-grid">
            ${times.map(t=>`<button type="button" class="slot-btn" data-date="${date}" data-time="${t}">${t}</button>`).join('')}
          </div>
        </div>
      `;
    }).join('');
    box.querySelectorAll('.slot-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        box.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDate = btn.dataset.date;
        selectedTime = btn.dataset.time;
        document.getElementById('b_selected_info').textContent = `${DOWS[(parseD(selectedDate).getDay()+6)%7]}, ${fmtD(selectedDate)} às ${selectedTime}`;
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
    loadSlots(slug); // horário pode ter sido ocupado nesse meio tempo
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
