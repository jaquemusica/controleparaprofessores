// ============================================================
// Acesso a dados de Aulas (tabela `lessons`).
// ============================================================
import { db } from '../config/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../utils/toast.js';

function lessonToRow(l){
  return { id:l.id, user_id:store.session?.user?.id, student_id:l.studentId, package_id:l.packageId||null, date:l.date, time:l.time, duration:l.duration, status:l.status, notes:l.notes||null };
}
function rowToLesson(r){
  return { id:r.id, studentId:r.student_id, packageId:r.package_id, date:r.date, time:r.time, duration:r.duration, status:r.status, notes:r.notes };
}

function handleDbError(error){
  console.error(error);
  showToast('Erro ao salvar no banco: ' + (error.message||'tente novamente.'));
}

export async function fetchLessons(){
  const { data, error } = await db.from('lessons').select('*');
  if(error) throw error;
  return (data||[]).map(rowToLesson);
}
export async function dbInsertLesson(l){ const {error}=await db.from('lessons').insert(lessonToRow(l)); if(error) handleDbError(error); }
export async function dbUpdateLesson(l){ const {error}=await db.from('lessons').update(lessonToRow(l)).eq('id',l.id); if(error) handleDbError(error); }
export async function dbDeleteLesson(id){ const {error}=await db.from('lessons').delete().eq('id',id); if(error) handleDbError(error); }
