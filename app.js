// ============================================================
// Ponto de entrada da aplicação principal (index.html).
// Delegação de eventos + inicialização.
// ============================================================
import { store } from './utils/store.js';
import { render } from './ui/render.js';
import { loadAll } from './services/dataLoader.js';
import { todayStr, startOfWeek, addDays, escapeHtml } from './utils/dom.js';
import { getSession, getProfile, updateProfile, onAuthStateChange, signOut } from './services/authService.js';
import {
  openStudentModal, deleteStudent,
  openPackageModal, deletePackage, cancelPackage, markPaid,
  openLessonModal, deleteLesson, setLessonStatus,
  copyRenewMsg, copyPaymentMsg,
  closeModal, handleModalSubmit, handleModalChange,
} from './pages/modals.js';
import { openAvailabilityModal, deleteAvailability } from './pages/availabilityModals.js';
import { bookingLink } from './pages/disponibilidade.js';
import { acceptBookingRequest, declineBookingRequest } from './services/bookingService.js';
import { copyText, showToast } from './utils/toast.js';
import { fetchMySubscription, startSubscription, cancelSubscription } from './services/subscriptionService.js';
import { viewSubscriptionBlocked } from './pages/assinatura.js';

store.state.agendaWeekStart = startOfWeek(todayStr());

/* ============================ EVENT DELEGATION ============================ */
document.body.addEventListener('click', (e)=>{
  const t = e.target.closest('[data-action]');
  if(!t) return;
  const a = t.dataset.action;
  if(a==='close-modal') closeModal();
  else if(a==='nav'){ store.state.view=t.dataset.view; store.state.selectedStudentId=null; render(); }
  else if(a==='open-student'){ store.state.view='studentDetail'; store.state.selectedStudentId=t.dataset.id; store.state.studentTab='pacotes'; render(); }
  else if(a==='back-students'){ store.state.view='alunos'; render(); }
  else if(a==='student-tab'){ store.state.studentTab=t.dataset.tab; render(); }
  else if(a==='open-add-student') openStudentModal();
  else if(a==='edit-student') openStudentModal(t.dataset.id);
  else if(a==='delete-student') deleteStudent(t.dataset.id);
  else if(a==='open-add-package') openPackageModal(t.dataset.student||store.state.selectedStudentId);
  else if(a==='edit-package') openPackageModal(null, t.dataset.id);
  else if(a==='delete-package') deletePackage(t.dataset.id);
  else if(a==='cancel-package') cancelPackage(t.dataset.id);
  else if(a==='mark-paid') markPaid(t.dataset.id);
  else if(a==='open-add-lesson') openLessonModal(store.state.selectedStudentId);
  else if(a==='delete-lesson') deleteLesson(t.dataset.id);
  else if(a==='edit-lesson') openLessonModal(null, t.dataset.id);
  else if(a==='set-lesson-status') setLessonStatus(t.dataset.id, t.dataset.status);
  else if(a==='copy-renew-msg') copyRenewMsg(t.dataset.id);
  else if(a==='copy-payment-msg') copyPaymentMsg(t.dataset.id);
  else if(a==='agenda-prev'){ store.state.agendaWeekStart=addDays(store.state.agendaWeekStart,-7); render(); }
  else if(a==='agenda-next'){ store.state.agendaWeekStart=addDays(store.state.agendaWeekStart,7); render(); }
  else if(a==='agenda-today'){ store.state.agendaWeekStart=startOfWeek(todayStr()); render(); }
  else if(a==='agenda-view-week'){ store.state.agendaViewMode='semana'; render(); }
  else if(a==='agenda-view-month'){ store.state.agendaViewMode='mes'; render(); }
  else if(a==='agenda-month-prev'){ store.state.agendaMonth--; if(store.state.agendaMonth<0){store.state.agendaMonth=11; store.state.agendaYear--;} render(); }
  else if(a==='agenda-month-next'){ store.state.agendaMonth++; if(store.state.agendaMonth>11){store.state.agendaMonth=0; store.state.agendaYear++;} render(); }
  else if(a==='agenda-month-today'){ const d=new Date(); store.state.agendaMonth=d.getMonth(); store.state.agendaYear=d.getFullYear(); render(); }
  else if(a==='open-add-availability') openAvailabilityModal();
  else if(a==='edit-availability') openAvailabilityModal(t.dataset.id);
  else if(a==='delete-availability') deleteAvailability(t.dataset.id);
  else if(a==='copy-booking-link') copyText(bookingLink(), 'Link copiado!');
  else if(a==='accept-booking-request'){ acceptBookingRequest(store.bookingRequests.find(r=>r.id===t.dataset.id)).then(()=>{ render(); }); }
  else if(a==='decline-booking-request'){ declineBookingRequest(t.dataset.id).then(()=>{ render(); }); }
  else if(a==='start-subscription') handleStartSubscription(t);
  else if(a==='cancel-subscription') handleCancelSubscription(t);
  else if(a==='refresh-subscription-status') handleRefreshSubscription(t);
  else if(a==='logout'){ signOut().then(()=>{ window.location.href='login.html'; }); }
  else if(t.classList.contains('modal-overlay') || a==='close-modal-bg'){ if(e.target===t) closeModal(); }
});
document.body.addEventListener('submit', (e)=>{
  const form = e.target.closest('form[data-form="perfil"]');
  if(form){ e.preventDefault(); handlePerfilSubmit(); return; }
  handleModalSubmit(e);
});
document.body.addEventListener('change',(e)=>{
  const t=e.target.closest('[data-action]'); if(!t) return;
  const a=t.dataset.action;
  if(a==='lesson-status-select') setLessonStatus(t.dataset.id, t.value);
  else if(a==='finance-month-change'){ store.state.financeMonth=Number(t.value); render(); }
  else if(a==='finance-year-change'){ store.state.financeYear=Number(t.value); render(); }
  else handleModalChange(a);
});
document.body.addEventListener('input',(e)=>{
  const t=e.target.closest('[data-action]'); if(!t) return;
  if(t.dataset.action==='student-search'){ store.state.studentSearch=t.value; render();
    setTimeout(()=>{ const el=document.querySelector('[data-action="student-search"]'); if(el){ el.focus(); el.selectionStart=el.selectionEnd=el.value.length; } },0);
  }
});

/* ============================ PERFIL ============================ */
async function handlePerfilSubmit(){
  const name = document.getElementById('pf_name').value.trim();
  const tagline = document.getElementById('pf_tagline').value.trim();
  const cpfCnpj = document.getElementById('pf_cpf_cnpj').value.replace(/\D/g,'');
  if(!name || !tagline || !cpfCnpj) return;
  try{
    await updateProfile(store.session.user.id, { name, tagline, cpfCnpj });
    store.profile = { ...store.profile, name, tagline, cpfCnpj };
    render();
    showToast('Perfil atualizado.');
  }catch(e){
    console.error(e);
    showToast('Não foi possível salvar: ' + (e.message||'tente novamente.'));
  }
}

/* ============================ ASSINATURA ============================ */
function renderBlocked(){
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  sidebar.style.display = 'none';
  document.getElementById('main').innerHTML = viewSubscriptionBlocked();
}
async function handleStartSubscription(btn){
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Preparando pagamento...';
  try{
    const { checkoutUrl } = await startSubscription();
    if(checkoutUrl) window.open(checkoutUrl, '_blank');
    else showToast('Assinatura criada. Assim que o Asaas gerar a cobrança, atualize o status.');
  }catch(e){
    console.error(e);
    showToast('Não foi possível iniciar a assinatura: ' + (e.message||'tente novamente.'));
  }finally{
    btn.disabled = false; btn.textContent = original;
  }
}
async function handleCancelSubscription(btn){
  if(!confirm('Cancelar sua assinatura? Você perderá o acesso ao sistema até assinar novamente.')) return;
  btn.disabled = true;
  try{
    await cancelSubscription();
    store.subscription = await fetchMySubscription(store.session.user.id);
    if(store.subscription.status!=='active'){ renderBlocked(); return; }
    render();
    showToast('Assinatura cancelada.');
  }catch(e){
    console.error(e);
    showToast('Não foi possível cancelar: ' + (e.message||'tente novamente.'));
  }finally{
    btn.disabled = false;
  }
}
async function handleRefreshSubscription(btn){
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Verificando...';
  try{
    store.subscription = await fetchMySubscription(store.session.user.id);
    if(store.subscription.status==='active' || store.subscription.status==='overdue'){
      await bootApp();
    } else {
      showToast('Ainda não identificamos o pagamento. Tente novamente em instantes.');
    }
  }catch(e){
    console.error(e);
    showToast('Não foi possível verificar o status agora.');
  }finally{
    btn.disabled = false; btn.textContent = original;
  }
}

/* ============================ INIT ============================ */
async function bootApp(){
  render();
  document.getElementById('main').innerHTML = `<div style="padding:80px 20px;text-align:center;color:var(--text-soft);">Carregando seus dados...</div>`;
  await loadAll();
  if(store.state.dbError){
    document.getElementById('main').innerHTML = `
      <div style="max-width:480px;margin:60px auto;text-align:center;">
        <h2 style="margin-bottom:8px;">Não foi possível conectar</h2>
        <p class="page-sub" style="margin-bottom:16px;">${escapeHtml(store.state.dbError)}</p>
        <p class="page-sub">Verifique a URL e a chave do Supabase no código, e se as tabelas foram criadas.</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">Tentar novamente</button>
      </div>`;
    return;
  }
  render();
}

(async function init(){
  // Rota protegida: sem sessão ativa, volta para o login.
  const session = await getSession();
  if(!session){ window.location.href = 'login.html'; return; }
  store.session = session;

  onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT') window.location.href = 'login.html';
  });

  try{ store.profile = await getProfile(session.user.id); }
  catch(e){ console.error('Não foi possível carregar o perfil:', e); }

  try{ store.subscription = await fetchMySubscription(session.user.id); }
  catch(e){ console.error('Não foi possível carregar a assinatura:', e); store.subscription = { status:'pending' }; }

  // Acesso ao sistema só é liberado com assinatura ativa (ou em atraso,
  // que mantém acesso com aviso). Cancelada ou nunca assinada -> bloqueado.
  if(store.subscription.status!=='active' && store.subscription.status!=='overdue'){
    renderBlocked();
    return;
  }

  await bootApp();
})();
