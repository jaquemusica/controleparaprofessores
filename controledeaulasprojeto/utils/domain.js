// ============================================================
// Regras de negócio / consultas derivadas sobre os dados
// carregados em memória (store.students/packages/lessons).
// ============================================================
import { store } from './store.js';
import { parseD } from './dom.js';

export function studentById(id){ return store.students.find(s=>s.id===id); }
export function packageById(id){ return store.packages.find(p=>p.id===id); }
export function lessonById(id){ return store.lessons.find(l=>l.id===id); }
export function lessonsDoneForPackage(pkgId){ return store.lessons.filter(l=>l.packageId===pkgId && l.status==='realizada').length; }
export function pkgRemaining(p){ return Math.max(0, p.totalLessons - lessonsDoneForPackage(p.id)); }
export function planLabel(p){
  if(p.planType==='avulsa') return 'Aula avulsa';
  if(p.planType==='mensalidade') return `Mensalidade (${p.totalLessons} aulas/mês)`;
  return `Pacote de ${p.totalLessons} aulas`;
}
export function pkgStatus(p){ return pkgRemaining(p)<=0 ? 'finalizado' : 'andamento'; }
export function activePackagesForStudent(id){ return store.packages.filter(p=>p.studentId===id && pkgStatus(p)==='andamento').sort((a,b)=>parseD(b.purchaseDate)-parseD(a.purchaseDate)); }
export function packagesForStudent(id){ return store.packages.filter(p=>p.studentId===id).sort((a,b)=>parseD(b.purchaseDate)-parseD(a.purchaseDate)); }
export function lessonsForStudent(id){ return store.lessons.filter(l=>l.studentId===id).sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time)); }
export function lessonsEndingPackages(){
  const out=[];
  for(const p of store.packages){ if(pkgStatus(p)==='andamento' && pkgRemaining(p)===1){ out.push(p); } }
  return out;
}
export function pendingPayments(){ return store.packages.filter(p=>!p.paid); }
