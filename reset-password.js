// ============================================================
// Lógica da tela "Definir nova senha" (chegada via link do e-mail
// de recuperação enviado pelo Supabase Auth).
// ============================================================
import { updatePassword } from './services/authService.js';

const msgEl = document.getElementById('reset-msg');
function showMsg(text, type){ msgEl.textContent = text; msgEl.className = `auth-msg show ${type}`; }

document.body.addEventListener('click', (e)=>{
  if(e.target.closest('[data-action="go-login"]')) window.location.href = 'login.html';
});

document.getElementById('form-reset').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const pass = document.getElementById('reset-password').value;
  const confirm = document.getElementById('reset-password-confirm').value;
  if(pass !== confirm){ showMsg('As senhas não coincidem.', 'error'); return; }
  const { error } = await updatePassword(pass);
  if(error){ showMsg(error.message || 'Não foi possível atualizar a senha. O link pode ter expirado.', 'error'); return; }
  showMsg('Senha atualizada! Redirecionando para o login...', 'success');
  setTimeout(()=>{ window.location.href = 'login.html'; }, 1800);
});
