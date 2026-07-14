// ============================================================
// Acesso a dados de Alunos (tabela `students`).
// Mapeia camelCase (app) <-> snake_case (banco).
// ============================================================
import { db } from '../config/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../utils/toast.js';

function studentToRow(s){
  return { id:s.id, user_id:store.session?.user?.id, name:s.name, phone:s.phone||null, email:s.email||null, notes:s.notes||null, created_at:s.createdAt||null };
}
function rowToStudent(r){
  return { id:r.id, name:r.name, phone:r.phone, email:r.email, notes:r.notes, createdAt:r.created_at };
}

function handleDbError(error){
  console.error(error);
  showToast('Erro ao salvar no banco: ' + (error.message||'tente novamente.'));
}

export async function fetchStudents(){
  const { data, error } = await db.from('students').select('*');
  if(error) throw error;
  return (data||[]).map(rowToStudent);
}
export async function dbInsertStudent(s){ const {error}=await db.from('students').insert(studentToRow(s)); if(error) handleDbError(error); }
export async function dbUpdateStudent(s){ const {error}=await db.from('students').update(studentToRow(s)).eq('id',s.id); if(error) handleDbError(error); }
export async function dbDeleteStudent(id){ const {error}=await db.from('students').delete().eq('id',id); if(error) handleDbError(error); }
