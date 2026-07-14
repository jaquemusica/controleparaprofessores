// ============================================================
// Orquestração de renderização: sidebar + roteamento de views.
// ============================================================
import { store } from '../utils/store.js';
import { ICONS } from '../utils/icons.js';
import { viewDashboard } from '../pages/dashboard.js';
import { viewAgenda } from '../pages/agenda.js';
import { viewAlunos } from '../pages/alunos.js';
import { viewStudentDetail } from '../pages/studentDetail.js';
import { viewFinanceiro } from '../pages/financeiro.js';
import { viewDisponibilidade } from '../pages/disponibilidade.js';
import { viewAssinatura } from '../pages/assinatura.js';

export function render(){
  renderSidebar();
  const banner = store.subscription?.status==='overdue'
    ? `<div style="background:var(--warning-bg);color:var(--warning);padding:10px 16px;font-size:13.5px;font-weight:600;text-align:center;">
        Seu pagamento está atrasado. <button data-action="nav" data-view="assinatura" style="background:none;border:none;color:inherit;text-decoration:underline;font-weight:700;cursor:pointer;padding:0;">Regularizar agora</button>
      </div>`
    : '';
  document.getElementById('main').innerHTML = banner + renderView();
}

function renderSidebar(){
  const items=[
    {v:'dashboard', label:'Início', icon:ICONS.home},
    {v:'agenda', label:'Agenda', icon:ICONS.calendar},
    {v:'alunos', label:'Alunos', icon:ICONS.users},
    {v:'disponibilidade', label:'Disponibilidade', icon:ICONS.clock},
    {v:'financeiro', label:'Financeiro', icon:ICONS.money},
    {v:'assinatura', label:'Assinatura', icon:ICONS.card},
  ];
  const active = store.state.view==='studentDetail' ? 'alunos' : store.state.view;
  const profileName = store.profile?.name || '';
  const sidebarEl = document.getElementById('sidebar');
  sidebarEl.style.display = '';
  sidebarEl.innerHTML = `
    <div class="brand"><div class="brand-mark">J</div><div class="brand-text"><div class="t1">Jaque Música</div><div class="t2">aulas de canto</div></div></div>
    <div class="nav">
      ${items.map(it=>`<button class="nav-item ${active===it.v?'active':''}" data-action="nav" data-view="${it.v}">${it.icon}<span>${it.label}</span></button>`).join('')}
    </div>
    <div class="sidebar-foot">
      ${profileName?`<div style="color:rgba(255,255,255,0.75);font-weight:600;margin-bottom:8px;">${profileName}</div>`:''}
      <button class="nav-item" data-action="logout" style="padding:8px 12px;">${ICONS.logout}<span>Sair</span></button>
    </div>
  `;
}

function renderView(){
  switch(store.state.view){
    case 'dashboard': return viewDashboard();
    case 'agenda': return viewAgenda();
    case 'alunos': return viewAlunos();
    case 'studentDetail': return viewStudentDetail();
    case 'financeiro': return viewFinanceiro();
    case 'disponibilidade': return viewDisponibilidade();
    case 'assinatura': return viewAssinatura();
    default: return '';
  }
}
