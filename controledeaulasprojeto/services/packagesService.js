// ============================================================
// Acesso a dados de Pacotes (tabela `packages`).
// ============================================================
import { db } from '../config/supabase.js';
import { store } from '../utils/store.js';
import { showToast } from '../utils/toast.js';

function packageToRow(p){
  return { id:p.id, user_id:store.session?.user?.id, student_id:p.studentId, total_lessons:p.totalLessons, purchase_date:p.purchaseDate, value:p.value,
    payment_method:p.paymentMethod, paid:p.paid, paid_date:p.paidDate||null, plan_type:p.planType||'pacote',
    weekday:(p.weekday===undefined||p.weekday===null)?null:p.weekday, time:p.time||null, start_date:p.startDate||null };
}
function rowToPackage(r){
  return { id:r.id, studentId:r.student_id, totalLessons:r.total_lessons, purchaseDate:r.purchase_date, value:Number(r.value),
    paymentMethod:r.payment_method, paid:r.paid, paidDate:r.paid_date, planType:r.plan_type||'pacote',
    weekday:(r.weekday===null||r.weekday===undefined)?null:Number(r.weekday), time:r.time, startDate:r.start_date };
}

function handleDbError(error){
  console.error(error);
  showToast('Erro ao salvar no banco: ' + (error.message||'tente novamente.'));
}

export async function fetchPackages(){
  const { data, error } = await db.from('packages').select('*');
  if(error) throw error;
  return (data||[]).map(rowToPackage);
}
export async function dbInsertPackage(p){ const {error}=await db.from('packages').insert(packageToRow(p)); if(error) handleDbError(error); }
export async function dbUpdatePackage(p){ const {error}=await db.from('packages').update(packageToRow(p)).eq('id',p.id); if(error) handleDbError(error); }
export async function dbDeletePackage(id){ const {error}=await db.from('packages').delete().eq('id',id); if(error) handleDbError(error); }
