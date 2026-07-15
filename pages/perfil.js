// ============================================================
// View: Perfil — nome do professor e assunto das aulas (aparece
// no canto superior esquerdo da barra lateral).
// ============================================================
import { store } from '../utils/store.js';
import { escapeAttr } from '../utils/dom.js';

export function viewPerfil(){
  const p = store.profile || {};
  return `
    <div class="page-head">
      <div><h1>Perfil</h1><p class="page-sub">Como seu nome e suas aulas aparecem no sistema.</p></div>
    </div>
    <div class="card" style="max-width:480px;">
      <form data-form="perfil">
        <div class="field"><label>Seu nome *</label><input id="pf_name" required value="${escapeAttr(p.name||'')}"></div>
        <div class="field"><label>Assunto das aulas *</label><input id="pf_tagline" required value="${escapeAttr(p.tagline||'')}" placeholder="ex: aulas de canto, aulas de violão, personal trainer..."></div>
        <div class="hint" style="margin:-6px 0 14px;">Esse texto aparece embaixo do seu nome, no canto superior esquerdo do sistema.</div>
        <div class="field"><label>CPF ou CNPJ *</label><input id="pf_cpf_cnpj" required value="${escapeAttr(p.cpfCnpj||'')}" placeholder="Só números"></div>
        <div class="hint" style="margin:-6px 0 14px;">Necessário para gerar a cobrança da sua assinatura (Pix/boleto/cartão) — exigência do Asaas.</div>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </form>
    </div>
  `;
}
