// ============================================================
// Modais (formulários) de Aluno, Pacote e Aula + ações que os
// acompanham (excluir, marcar pago, mudar status, mensagens).
// ============================================================
import { store } from '../utils/store.js';
import { render } from '../ui/render.js';
import { showToast, copyText } from '../utils/toast.js';
import { uid, todayStr, addDays, parseD, pad, escapeAttr, escapeHtml, fmtMoney, DOWS } from '../utils/dom.js';
import { studentById, packageById, activePackagesForStudent, pkgRemaining } from '../utils/domain.js';
import { availableSlotsForDate } from '../utils/slots.js';
import { dbInsertStudent, dbUpdateStudent, dbDeleteStudent } from '../services/studentsService.js';
import { dbInsertPackage, dbUpdatePackage, dbDeletePackage } from '../services/packagesService.js';
import { dbInsertLesson, dbUpdateLesson, dbDeleteLesson } from '../services/lessonsService.js';
import { handleAvailabilitySubmit } from './availabilityModals.js';

function openModalHtml(html){
  document.getElementById('modal-root').innerHTML = `<div class="modal-overlay" data-action="close-modal-bg">${html}</div>`;
}
export function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

/* ---------------------------- ALUNO ---------------------------- */
export function openStudentModal(id){
  const editing = id ? studentById(id) : null;
  openModalHtml(`
    <div class="modal" id="studentModal">
      <h2>${editing?'Editar aluno':'Novo aluno'}</h2>
      <form data-form="student" data-id="${editing?id:''}">
        <div class="field"><label>Nome *</label><input id="f_name" required value="${editing?escapeAttr(editing.name):''}" placeholder="Nome completo"></div>
        <div class="field"><label>Telefone</label><input id="f_phone" value="${editing?escapeAttr(editing.phone||''):''}" placeholder="(11) 99999-9999"></div>
        <div class="field"><label>E-mail (opcional)</label><input id="f_email" type="email" value="${editing?escapeAttr(editing.email||''):''}" placeholder="email@exemplo.com"></div>
        <div class="field"><label>Observações</label><textarea id="f_notes" rows="3" placeholder="Tom de voz, objetivos, preferências...">${editing?escapeHtml(editing.notes||''):''}</textarea></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing?'Salvar':'Cadastrar'}</button>
        </div>
      </form>
    </div>
  `);
  setTimeout(()=>document.getElementById('f_name')?.focus(),50);
}
async function handleStudentSubmit(id){
  const name=document.getElementById('f_name').value.trim();
  if(!name) return;
  const data={ name, phone:document.getElementById('f_phone').value.trim(),
    email:document.getElementById('f_email').value.trim(), notes:document.getElementById('f_notes').value.trim() };
  if(id){
    const s=studentById(id); Object.assign(s,data);
    await dbUpdateStudent(s);
  } else {
    const newStudent={ id:uid(), createdAt:todayStr(), ...data };
    store.students.push(newStudent);
    await dbInsertStudent(newStudent);
  }
  closeModal(); render();
  showToast(id?'Aluno atualizado.':'Aluno cadastrado.');
}
export function deleteStudent(id){
  if(!confirm('Excluir este aluno? Isso também removerá seus pacotes e aulas registradas.')) return;
  store.students = store.students.filter(s=>s.id!==id);
  store.packages = store.packages.filter(p=>p.studentId!==id);
  store.lessons = store.lessons.filter(l=>l.studentId!==id);
  dbDeleteStudent(id).then(()=>{
    store.state.view='alunos'; render(); showToast('Aluno excluído.');
  });
}

/* ---------------------------- PACOTE ---------------------------- */
export function openPackageModal(studentId, editId){
  const editing = editId ? packageById(editId) : null;
  const opts = store.students.map(s=>`<option value="${s.id}" ${s.id===(editing?editing.studentId:studentId)?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
  if(store.students.length===0){ showToast('Cadastre um aluno primeiro.'); return; }
  const dowOpts = DOWS.map((d,i)=>`<option value="${i}">${d}</option>`).join('');
  openModalHtml(`
    <div class="modal">
      <h2>${editing?'Editar pacote':'Novo pacote'}</h2>
      <form data-form="package" data-id="${editing?editId:''}">
        <div class="field"><label>Aluno *</label><select id="p_student" required ${editing?'disabled':''}>${opts}</select></div>
        <div class="field"><label>Tipo de contratação *</label>
          <select id="p_plantype" data-action="package-plantype-change">
            <option value="avulsa" ${editing?.planType==='avulsa'?'selected':''}>Aula avulsa</option>
            <option value="pacote" ${!editing||editing.planType==='pacote'?'selected':''}>Pacote de aulas</option>
            <option value="mensalidade" ${editing?.planType==='mensalidade'?'selected':''}>Mensalidade</option>
          </select>
        </div>
        <div class="field-row" id="p_row_total">
          <div class="field"><label>Qtd. de aulas *</label><input id="p_total" type="number" min="1" value="${editing?editing.totalLessons:4}" required></div>
          <div class="field"><label>Aulas / semana</label><input id="p_perweek" type="number" min="1" max="7" value="1" data-action="package-plantype-change"></div>
        </div>
        <div class="field-row">
          <div class="field"><label id="p_value_label">Valor (R$) *</label><input id="p_value" type="number" min="0" step="0.01" placeholder="0,00" value="${editing?editing.value:''}" required></div>
          <div class="field"><label>Forma de pagamento</label>
            <select id="p_method"><option ${editing?.paymentMethod==='Pix'||!editing?'selected':''}>Pix</option><option ${editing?.paymentMethod==='Cartão'?'selected':''}>Cartão</option></select>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Data da compra *</label><input id="p_date" type="date" value="${editing?editing.purchaseDate:todayStr()}" required></div>
          <div class="field"><label>Data de início das aulas *</label><input id="p_start" type="date" value="${editing?(editing.startDate||editing.purchaseDate):todayStr()}" required></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Dia da semana *</label><select id="p_weekday">${dowOpts}</select></div>
          <div class="field"><label>Horário *</label><input id="p_time" type="time" value="${editing?(editing.time||'10:00'):'10:00'}" required></div>
        </div>
        <div class="checkrow"><input type="checkbox" id="p_paid" ${editing?(editing.paid?'checked':''):'checked'}> <label for="p_paid" style="margin:0;">Já foi pago</label></div>
        ${editing?`<div class="hint" style="margin:-6px 0 14px;">Alterar dia/horário aqui não move as aulas já agendadas. Para remarcar uma aula específica, edite-a na Agenda.</div>`:
          `<div class="checkrow"><input type="checkbox" id="p_autodist" checked> <label for="p_autodist" style="margin:0;">Distribuir as aulas automaticamente na agenda</label></div>`}
        <div class="hint" id="p_hint" style="margin:-6px 0 14px;"></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing?'Salvar':'Criar pacote'}</button>
        </div>
      </form>
    </div>
  `);
  setTimeout(()=>{
    document.getElementById('p_weekday').value = editing?(editing.weekday??0):(new Date().getDay()===0?6:new Date().getDay()-1);
    refreshPackagePlanFields();
  },30);
}
function refreshPackagePlanFields(){
  const type=document.getElementById('p_plantype')?.value; if(!type) return;
  const rowTotal=document.getElementById('p_row_total');
  const totalInput=document.getElementById('p_total');
  const perweekInput=document.getElementById('p_perweek');
  const valueLabel=document.getElementById('p_value_label');
  const hint=document.getElementById('p_hint');
  if(type==='avulsa'){
    rowTotal.style.display='none'; totalInput.value=1; totalInput.required=false;
    valueLabel.textContent='Valor da aula (R$) *';
    hint.textContent='Será agendada 1 aula, na data de início escolhida.';
  } else if(type==='pacote'){
    rowTotal.style.display='flex'; totalInput.required=true;
    valueLabel.textContent='Valor do pacote (R$) *';
    hint.textContent='As aulas serão distribuídas semanalmente, no dia e horário escolhidos, a partir da data de início.';
  } else if(type==='mensalidade'){
    rowTotal.style.display='flex'; totalInput.required=false;
    valueLabel.textContent='Valor da mensalidade (R$) *';
    const perweek=Number(perweekInput.value)||1;
    totalInput.value=perweek*4;
    hint.textContent='Serão geradas as aulas de 4 semanas (renove o pacote no mês seguinte).';
  }
}
function weeklyDatesFrom(startDate, weekday, count, perWeek){
  perWeek = perWeek||1;
  const dates=[];
  let d=parseD(startDate);
  const curDow=(d.getDay()+6)%7;
  let diff=weekday-curDow; if(diff<0) diff+=7;
  d.setDate(d.getDate()+diff);
  let cur = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const stepDays = perWeek>1 ? Math.max(1,Math.floor(7/perWeek)) : 7;
  for(let i=0;i<count;i++){
    dates.push(cur);
    cur = addDays(cur, stepDays);
  }
  return dates;
}
async function handlePackageSubmit(editId){
  const paid=document.getElementById('p_paid').checked;
  const purchaseDate=document.getElementById('p_date').value;
  const planType=document.getElementById('p_plantype').value;
  const weekday=Number(document.getElementById('p_weekday').value);
  const time=document.getElementById('p_time').value;
  const startDate=document.getElementById('p_start').value;
  const perWeek=Number(document.getElementById('p_perweek').value)||1;
  let totalLessons = planType==='avulsa' ? 1 : (Number(document.getElementById('p_total').value)||1);

  if(editId){
    const pkg=packageById(editId); if(!pkg) return;
    Object.assign(pkg, {
      totalLessons, value:Number(document.getElementById('p_value').value)||0,
      paymentMethod:document.getElementById('p_method').value,
      purchaseDate,
      paid, paidDate: paid?purchaseDate:null,
      planType, weekday, time, startDate,
    });
    await dbUpdatePackage(pkg);
    closeModal(); render();
    showToast('Pacote atualizado.');
    return;
  }

  const autoDist=document.getElementById('p_autodist').checked;
  const pkg={
    id:uid(), studentId:document.getElementById('p_student').value,
    totalLessons,
    purchaseDate,
    value:Number(document.getElementById('p_value').value)||0,
    paymentMethod:document.getElementById('p_method').value,
    paid, paidDate: paid?purchaseDate:null,
    planType, weekday, time, startDate,
  };
  store.packages.push(pkg);
  await dbInsertPackage(pkg);
  let created=0;
  if(autoDist){
    const dates = weeklyDatesFrom(startDate, weekday, totalLessons, planType==='mensalidade'?perWeek:1);
    for(const date of dates){
      const lesson={ id:uid(), studentId:pkg.studentId, packageId:pkg.id, date, time, duration:50, status:'agendada', notes:'' };
      store.lessons.push(lesson);
      await dbInsertLesson(lesson);
      created++;
    }
  }
  closeModal(); render();
  showToast(created>0?`Pacote criado e ${created} aula(s) distribuída(s) na agenda.`:'Pacote criado.');
}
export function deletePackage(id){
  if(!confirm('Excluir este pacote? As aulas vinculadas a ele permanecerão registradas, mas perderão o vínculo.')) return;
  store.packages = store.packages.filter(p=>p.id!==id);
  store.lessons.forEach(l=>{ if(l.packageId===id) l.packageId=null; });
  dbDeletePackage(id).then(()=>{ render(); showToast('Pacote excluído.'); });
}
export function markPaid(id){
  const p=packageById(id); if(!p) return;
  p.paid=true; p.paidDate=todayStr();
  dbUpdatePackage(p).then(()=>{ render(); showToast('Pagamento confirmado.'); });
}

/* ---------------------------- AULA ---------------------------- */
export function openLessonModal(studentId, editId){
  if(store.students.length===0){ showToast('Cadastre um aluno primeiro.'); return; }
  const editing = editId ? store.lessons.find(l=>l.id===editId) : null;
  const opts = store.students.map(s=>`<option value="${s.id}" ${s.id===(editing?editing.studentId:studentId)?'selected':''}>${escapeHtml(s.name)}</option>`).join('');
  openModalHtml(`
    <div class="modal">
      <h2>${editing?'Remarcar aula':'Nova aula'}</h2>
      <form data-form="lesson" data-id="${editing?editId:''}">
        <div class="field"><label>Aluno *</label><select id="l_student" required data-action="lesson-student-change" ${editing?'disabled':''}>${opts}</select></div>
        <div id="l_pkg_info"></div>
        <div class="field-row">
          <div class="field"><label>Data *</label><input id="l_date" type="date" value="${editing?editing.date:todayStr()}" data-action="lesson-date-change" required></div>
          <div class="field"><label>Horário *</label>
            ${(!editing && store.availability.length>0)
              ? `<select id="l_time" required></select>`
              : `<input id="l_time" type="time" value="${editing?editing.time:'10:00'}" required>`}
          </div>
        </div>
        <div id="l_time_hint"></div>
        <div class="field"><label>Duração (min)</label><input id="l_duration" type="number" min="10" step="5" value="${editing?editing.duration:50}"></div>
        <div class="field"><label>Observações</label><textarea id="l_notes" rows="2" placeholder="Repertório, exercícios...">${editing?escapeHtml(editing.notes||''):''}</textarea></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing?'Salvar':'Agendar aula'}</button>
        </div>
      </form>
    </div>
  `);
  setTimeout(()=>{ refreshLessonPackageInfo(); refreshLessonTimeOptions(editId); },30);
}
function refreshLessonTimeOptions(editId){
  const timeSelect = document.getElementById('l_time');
  if(!timeSelect || timeSelect.tagName!=='SELECT') return; // modo edição usa input livre
  const date = document.getElementById('l_date').value;
  const slots = availableSlotsForDate(date, store.availability, store.lessons, editId||null);
  const hint = document.getElementById('l_time_hint');
  if(slots.length===0){
    timeSelect.innerHTML = `<option value="">Nenhum horário livre</option>`;
    hint.innerHTML = `<div class="hint" style="margin:-6px 0 14px;color:var(--danger);">Não há horários livres nessa data. Verifique sua Disponibilidade ou escolha outro dia.</div>`;
  } else {
    timeSelect.innerHTML = slots.map(t=>`<option value="${t}">${t}</option>`).join('');
    hint.innerHTML = '';
  }
}
function refreshLessonPackageInfo(){
  const sel=document.getElementById('l_student'); if(!sel) return;
  const sid=sel.value;
  const active=activePackagesForStudent(sid)[0];
  const box=document.getElementById('l_pkg_info');
  if(active){
    box.innerHTML = `<div class="hint" style="margin:-6px 0 14px;">Pacote ativo: ${pkgRemaining(active)} de ${active.totalLessons} aula(s) restantes. A aula será descontada dele quando marcada como realizada.</div>`;
  } else {
    box.innerHTML = `<div class="hint" style="margin:-6px 0 14px;color:var(--danger);">Este aluno não tem pacote ativo. Você pode agendar a aula, mas crie um pacote para controlar o saldo.</div>`;
  }
}
async function handleLessonSubmit(editId){
  const date=document.getElementById('l_date').value, time=document.getElementById('l_time').value;
  const duration=Number(document.getElementById('l_duration').value)||50;
  const notes=document.getElementById('l_notes').value.trim();
  if(editId){
    const l=store.lessons.find(x=>x.id===editId); if(!l) return;
    Object.assign(l, { date, time, duration, notes });
    await dbUpdateLesson(l);
    closeModal(); render();
    showToast('Aula remarcada.');
    return;
  }
  const studentId=document.getElementById('l_student').value;
  const active=activePackagesForStudent(studentId)[0];
  const lesson={
    id:uid(), studentId, packageId: active?active.id:null,
    date, time, duration, status:'agendada', notes,
  };
  store.lessons.push(lesson);
  await dbInsertLesson(lesson);
  closeModal(); render();
  showToast('Aula agendada.');
}
export function deleteLesson(id){
  if(!confirm('Excluir esta aula?')) return;
  store.lessons = store.lessons.filter(l=>l.id!==id);
  dbDeleteLesson(id).then(()=>{ render(); showToast('Aula excluída.'); });
}
export function setLessonStatus(id,status){
  const l=store.lessons.find(x=>x.id===id); if(!l) return;
  l.status=status;
  dbUpdateLesson(l).then(()=>{ render(); showToast(status==='realizada'?'Aula marcada como realizada.':'Aula marcada como falta.'); });
}

/* ---------------------------- MENSAGENS ---------------------------- */
export function copyRenewMsg(studentId){
  const s=studentById(studentId); if(!s) return;
  const msg = `Oi ${s.name.split(' ')[0]}! Passando para avisar que seu pacote de aulas está chegando ao fim. Vamos renovar para não perder o ritmo dos seus estudos?`;
  copyText(msg, 'Mensagem copiada!');
}
export function copyPaymentMsg(packageId){
  const p=packageById(packageId); if(!p) return;
  const s=studentById(p.studentId); if(!s) return;
  const msg = `Oi ${s.name.split(' ')[0]}! Passando para lembrar do pagamento referente ao seu pacote de aulas (${fmtMoney(p.value)}). Qualquer dúvida, me chama.`;
  copyText(msg, 'Mensagem copiada!');
}

/* ---------------------------- SUBMIT DELEGATION ---------------------------- */
export function handleModalSubmit(e){
  const form = e.target.closest('form[data-form]');
  if(!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  const id = form.dataset.id || null;
  if(kind==='student') handleStudentSubmit(id);
  else if(kind==='package') handlePackageSubmit(id);
  else if(kind==='lesson') handleLessonSubmit(id);
  else if(kind==='availability') handleAvailabilitySubmit(id);
}
export function handleModalChange(action){
  if(action==='package-plantype-change') refreshPackagePlanFields();
  else if(action==='lesson-student-change') refreshLessonPackageInfo();
  else if(action==='lesson-date-change'){
    const editId = document.querySelector('form[data-form="lesson"]')?.dataset.id || null;
    refreshLessonTimeOptions(editId);
  }
}
