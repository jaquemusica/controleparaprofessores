// ============================================================
// Acesso a dados de Solicitações de agendamento (tabela
// `booking_requests`). Metade pública (link do aluno, sem login,
// via funções RPC) e metade autenticada (professor aceita/recusa).
// ============================================================
import { db } from '../config/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../utils/toast.js';
import { uid } from '../utils/dom.js';
import { dbInsertStudent } from './studentsService.js';
import { dbInsertLesson } from './lessonsService.js';

function rowToRequest(r){
  return { id:r.id, studentName:r.student_name, studentPhone:r.student_phone, note:r.note,
    date:r.date, time:(r.time||'').slice(0,5), duration:r.duration, status:r.status, createdAt:r.created_at };
}
function normalizePhone(p){ return (p||'').replace(/\D/g,''); }

/* ---------------------------- PÚBLICO (sem login) ---------------------------- */
export async function getPublicProfessor(slug){
  const { data, error } = await db.rpc('get_public_professor', { p_slug: slug });
  if(error) throw error;
  return (data && data[0]) || null;
}
export async function getAvailableSlotsPublic(slug, fromDate, toDate){
  const { data, error } = await db.rpc('get_available_slots', { p_slug: slug, p_from: fromDate, p_to: toDate });
  if(error) throw error;
  return (data||[]).map(r=>({ date: r.slot_date, time: (r.slot_time||'').slice(0,5) }));
}
export async function createBookingRequestPublic(slug, date, time, name, phone, note){
  const { data, error } = await db.rpc('create_booking_request', {
    p_slug: slug, p_date: date, p_time: time, p_name: name, p_phone: phone, p_note: note||'',
  });
  if(error) throw error;
  return data;
}

/* ---------------------------- PROFESSOR (autenticado) ---------------------------- */
export async function fetchBookingRequests(){
  const { data, error } = await db.from('booking_requests').select('*').order('created_at', { ascending: false });
  if(error) throw error;
  return (data||[]).map(rowToRequest);
}

export async function acceptBookingRequest(request){
  let student = store.students.find(s=>normalizePhone(s.phone)===normalizePhone(request.studentPhone) && normalizePhone(s.phone)!=='');
  if(!student){
    student = { id:uid(), name:request.studentName, phone:request.studentPhone, email:'', notes:'Cadastrado automaticamente pelo link de agendamento.', createdAt:request.date };
    store.students.push(student);
    await dbInsertStudent(student);
  }
  const lesson = { id:uid(), studentId:student.id, packageId:null, date:request.date, time:request.time, duration:request.duration, status:'agendada', notes:request.note||'' };
  store.lessons.push(lesson);
  await dbInsertLesson(lesson);

  const { error } = await db.from('booking_requests').update({ status:'aceita' }).eq('id', request.id);
  if(error){ console.error(error); showToast('Aula criada, mas não foi possível atualizar o status da solicitação.'); }
  request.status = 'aceita';
}

export async function declineBookingRequest(id){
  const { error } = await db.from('booking_requests').update({ status:'recusada' }).eq('id', id);
  if(error){ console.error(error); showToast('Erro ao recusar solicitação.'); return; }
  const req = store.bookingRequests.find(r=>r.id===id);
  if(req) req.status = 'recusada';
}
