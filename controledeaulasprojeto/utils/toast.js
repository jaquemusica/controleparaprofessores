// ============================================================
// Notificações rápidas (toast) e utilitário de copiar texto.
// ============================================================
export function showToast(msg){
  const root=document.getElementById('toast-root');
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  root.appendChild(t);
  setTimeout(()=>t.remove(),2400);
}
export function copyText(text, okMsg){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>showToast(okMsg)).catch(()=>fallbackCopy(text,okMsg));
  } else fallbackCopy(text,okMsg);
}
function fallbackCopy(text,okMsg){
  const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta);
  ta.select(); try{document.execCommand('copy'); showToast(okMsg);}catch(e){showToast('Não foi possível copiar');}
  ta.remove();
}
