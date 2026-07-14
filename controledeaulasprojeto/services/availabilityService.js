// ============================================================
// Acesso a dados de Disponibilidade (tabela `availability`).
// Cada linha é um bloco de horário num dia da semana
// (ex.: Segunda, 08:00–18:00, aulas de 50 min).
// ============================================================
import { db } from '../config/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../utils/toast.js';

function availabilityToRow(a){
  return { id:a.id, user_id:store.session?.user?.id, weekday:a.weekday, start_time:a.startTime, end_time:a.endTime, lesson_duration:a.lessonDuration };
}
function rowToAvailability(r){
  return { id:r.id, weekday:Number(r.weekday), startTime:(r.start_time||'').slice(0,5), endTime:(r.end_time||'').slice(0,5), lessonDuration:Number(r.lesson_duration) };
}

function handleDbError(error){
  console.error(error);
  showToast('Erro ao salvar no banco: ' + (error.message||'tente novamente.'));
}

export async function fetchAvailability(){
  const { data, error } = await db.from('availability').select('*');
  if(error) throw error;
  return (data||[]).map(rowToAvailability);
}
export async function dbInsertAvailability(a){ const {error}=await db.from('availability').insert(availabilityToRow(a)); if(error) handleDbError(error); return error; }
export async function dbUpdateAvailability(a){ const {error}=await db.from('availability').update(availabilityToRow(a)).eq('id',a.id); if(error) handleDbError(error); return error; }
export async function dbDeleteAvailability(id){ const {error}=await db.from('availability').delete().eq('id',id); if(error) handleDbError(error); }
