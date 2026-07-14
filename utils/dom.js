// ============================================================
// Helpers genéricos de data, formatação e texto.
// ============================================================
export function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
export function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
export function pad(n){ return n.toString().padStart(2,'0'); }
export function parseD(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
export function fmtD(s){ if(!s) return '—'; const d=parseD(s); return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear(); }
export function addDays(s,n){ const d=parseD(s); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
export function startOfWeek(s){ const d=parseD(s); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
export function fmtMoney(v){ return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
export function initials(name){ return name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase(); }
export function escapeHtml(str){ return (str||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function escapeAttr(str){ return escapeHtml(str); }

export const DOWS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
export const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MONTH_NAMES=MONTHS;
