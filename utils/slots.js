// ============================================================
// Geração dos horários disponíveis a partir das regras de
// Disponibilidade, descontando as aulas já marcadas naquele dia.
// Usado no agendamento interno (Etapa 3) e no link público (Etapa 4).
// ============================================================
import { parseD } from './dom.js';

function timeToMinutes(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function minutesToTime(m){ const h=Math.floor(m/60).toString().padStart(2,'0'); const mm=(m%60).toString().padStart(2,'0'); return `${h}:${mm}`; }

// weekday: 0=Segunda ... 6=Domingo (mesma convenção usada em DOWS)
export function weekdayOf(dateStr){
  const d = parseD(dateStr);
  return (d.getDay()+6)%7;
}

/**
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {Array} availability - regras do professor [{weekday, startTime, endTime, lessonDuration}]
 * @param {Array} lessons - todas as aulas do professor [{date, time, status}]
 * @param {string|null} ignoreLessonId - ao remarcar, ignora a própria aula
 * @returns {string[]} horários livres 'HH:MM' em ordem
 */
export function availableSlotsForDate(dateStr, availability, lessons, ignoreLessonId){
  const wd = weekdayOf(dateStr);
  const rules = availability.filter(a=>a.weekday===wd);
  if(rules.length===0) return [];

  const busy = new Set(
    lessons
      .filter(l=>l.date===dateStr && l.status!=='cancelada' && l.id!==ignoreLessonId)
      .map(l=>l.time)
  );

  const slots = [];
  for(const rule of rules){
    const start = timeToMinutes(rule.startTime);
    const end = timeToMinutes(rule.endTime);
    const step = rule.lessonDuration || 50;
    for(let t=start; t+step<=end; t+=step){
      const time = minutesToTime(t);
      if(!busy.has(time)) slots.push(time);
    }
  }
  return Array.from(new Set(slots)).sort();
}
