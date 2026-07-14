// ============================================================
// Lógica da tela de login / cadastro / esqueci a senha.
// ============================================================
import { signIn, signUp, requestPasswordReset, getSession } from './services/authService.js';

const msgEl = document.getElementById('auth-msg');
const tabs = document.querySelectorAll('.auth-tab');
const panels = document.querySelectorAll('.auth-panel');
const foot = document.getElementById('auth-foot-login');

function setTab(name){
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  panels.forEach(p=>p.classList.toggle('active', p.dataset.panel===name));
  hideMsg();
  foot.innerHTML = name==='login'
    ? 'Ainda não tem conta? <a data-tab-link="signup">Criar conta</a>'
    : 'Já tem conta? <a data-tab-link="login">Entrar</a>';
}
function showMsg(text, type){
  msgEl.textContent = text;
  msgEl.className = `auth-msg show ${type}`;
}
function hideMsg(){ msgEl.className = 'auth-msg'; }

tabs.forEach(t=>t.addEventListener('click', ()=>setTab(t.dataset.tab)));
document.body.addEventListener('click', (e)=>{
  const link = e.target.closest('[data-tab-link]');
  if(link) setTab(link.dataset.tabLink);
});

document.getElementById('form-login').addEventListener('submit', async (e)=>{
  e.preventDefault();
  hideMsg();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await signIn({ email, password });
  if(error){ showMsg(translateError(error), 'error'); return; }
  window.location.href = 'index.html';
});

document.getElementById('form-signup').addEventListener('submit', async (e)=>{
  e.preventDefault();
  hideMsg();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const { error } = await signUp({ name, email, password });
  if(error){ showMsg(translateError(error), 'error'); return; }
  showMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.', 'success');
  document.getElementById('form-signup').reset();
});

document.getElementById('form-forgot').addEventListener('submit', async (e)=>{
  e.preventDefault();
  hideMsg();
  const email = document.getElementById('forgot-email').value.trim();
  const { error } = await requestPasswordReset(email);
  if(error){ showMsg(translateError(error), 'error'); return; }
  showMsg('Se este e-mail estiver cadastrado, enviamos um link de recuperação.', 'success');
  document.getElementById('form-forgot').reset();
});

function translateError(error){
  const m = error.message || '';
  if(m.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if(m.includes('User already registered')) return 'Já existe uma conta com este e-mail.';
  if(m.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return m || 'Algo deu errado. Tente novamente.';
}

// já logado? pula direto para o app.
(async function checkExistingSession(){
  const session = await getSession();
  if(session) window.location.href = 'index.html';
})();
