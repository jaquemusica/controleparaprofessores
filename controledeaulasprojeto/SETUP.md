# Configuração e deploy

Guia de configuração das partes que precisam de ação sua fora do código
(painel do Supabase, Asaas, Resend). Vá completando conforme as etapas
forem sendo implementadas.

## Etapa 2 — Autenticação + RLS

1. Abra o **SQL Editor** do seu projeto no Supabase.
2. Rode o arquivo `database/schema.sql` inteiro, na ordem em que está.
   - A **Parte 3** (migração dos dados que já existem hoje) vem comentada.
     Se você já tem alunos/pacotes/aulas cadastrados no sistema atual:
     1. Crie sua conta pela tela de cadastro (`login.html`) primeiro.
     2. Vá em **Authentication > Users** no painel do Supabase e copie o
        seu `user_id` (UUID).
     3. Descomente as 3 linhas da Parte 3, substitua `<SEU_USER_ID>` pelo
        UUID copiado, e rode só essas 3 linhas.
     4. Só então rode a Parte 4 em diante (torna `user_id` obrigatório).
   - Se o banco está vazio (instalação nova), pule a Parte 3 e rode o
     resto normalmente.
3. Em **Authentication > URL Configuration**, configure:
   - **Site URL**: a URL onde o app está publicado (ex.: `https://seudominio.com`).
   - **Redirect URLs**: adicione `https://seudominio.com/reset-password.html`
     (e o equivalente em `http://localhost:...` se for testar localmente).
   Isso é necessário para o link de "esqueci minha senha" funcionar.
4. Por padrão o Supabase exige confirmação de e-mail no cadastro. Isso já
   funciona sem nenhuma configuração extra (o Supabase envia o e-mail de
   confirmação automaticamente). Na Etapa 6 vamos trocar esse e-mail pelo
   Resend.

Pronto — a partir daqui, cada professor que se cadastrar só vai enxergar
os próprios alunos, pacotes e aulas.

## Etapa 3 — Disponibilidade

Nenhuma configuração extra. Rode novamente o `database/schema.sql`
completo no SQL Editor (a nova seção "ETAPA 3" cria a tabela
`availability` com RLS; o resto do arquivo é seguro de re-executar).

Cada professor cadastra seus dias/horários na aba **Disponibilidade**.
Enquanto nenhum horário estiver cadastrado, o agendamento de aulas
continua funcionando normalmente com o campo de horário livre (não
trava o uso do sistema).

## Etapa 4 — Link público de agendamento

1. Rode novamente o `database/schema.sql` completo (a seção "ETAPA 4"
   cria a tabela `booking_requests` e 3 funções no banco que a página
   pública usa para ler/gravar dados com segurança, sem precisar de
   login nem policies abertas nas outras tabelas).
2. O link mostrado para o professor (aba Disponibilidade) usa o
   formato `agendar.html?u=slug`, que já funciona em qualquer
   hospedagem estática sem configuração extra.
3. **Opcional** — se você quiser a URL bonita `/agendar/slug` (em vez
   de `?u=slug`), configure uma reescrita na sua hospedagem apontando
   `/agendar/*` para `/agendar.html`. `agendar.js` já lê o slug tanto
   do caminho (`/agendar/slug`) quanto da query string (`?u=slug`), o
   que muda primeiro. Exemplos:
   - **Netlify** (`_redirects`): `/agendar/*  /agendar.html  200`
   - **Vercel** (`vercel.json`): `{ "rewrites": [{ "source": "/agendar/:slug", "destination": "/agendar.html" }] }`
4. As solicitações pendentes aparecem no topo da **Agenda**, com
   botões para aceitar (cria a aula e, se for a primeira vez desse
   aluno, cadastra automaticamente pelo nome/WhatsApp informado) ou
   recusar.

## Etapa 5 — Assinatura (Asaas)

Como a chave da API do Asaas é secreta, ela nunca fica no código do
site (que roda no navegador do aluno/professor). Ela mora nas
**Edge Functions** do Supabase, que rodam no servidor.

1. Rode novamente o `database/schema.sql` completo (a seção "ETAPA 5"
   cria a tabela `subscriptions`). A partir de agora, todo professor
   novo já nasce com uma linha `status = 'pending'` — ou seja, sem
   assinatura ativa, ele não acessa o sistema (só a tela de assinar).
2. Instale a Supabase CLI (se ainda não tiver): `npm i -g supabase`
3. Na raiz do projeto, faça login e linke o projeto:
   ```
   supabase login
   supabase link --project-ref <seu-project-ref>
   ```
4. Configure os segredos das funções (troque pelos valores reais da
   sua conta Asaas — pegue a API key em Configurações > Integrações >
   API no painel do Asaas):
   ```
   supabase secrets set ASAAS_API_KEY=sua_chave_aqui
   supabase secrets set ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
   supabase secrets set ASAAS_PLAN_VALUE=19.90
   supabase secrets set ASAAS_WEBHOOK_TOKEN=escolha-um-token-secreto-qualquer
   ```
   - Use `ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3` para testar
     no ambiente sandbox (gratuito, sem cobrança real). Quando for
     para produção, troque para `https://api.asaas.com/v3` e use a
     API key de produção.
   - `ASAAS_PLAN_VALUE` é o valor mensal do Plano PRO — mude aqui
     quando quiser reajustar o preço, sem precisar mexer no código.
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas
     automaticamente pelo Supabase em toda Edge Function — não
     precisa configurar essas duas.
5. Faça o deploy das 3 funções:
   ```
   supabase functions deploy asaas-create-subscription
   supabase functions deploy asaas-cancel-subscription
   supabase functions deploy asaas-webhook --no-verify-jwt
   ```
   (o `--no-verify-jwt` no webhook é necessário porque quem chama essa
   função é o servidor do Asaas, não um usuário logado — a segurança
   dela vem do `ASAAS_WEBHOOK_TOKEN`, checado dentro do código.)
6. No painel do Asaas, vá em **Integrações > Webhooks** e cadastre:
   - URL: `https://<seu-project-ref>.supabase.co/functions/v1/asaas-webhook`
   - Token de autenticação: o mesmo valor que você colocou em
     `ASAAS_WEBHOOK_TOKEN`
   - Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`,
     `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`,
     `SUBSCRIPTION_DELETED`

Pronto: assinatura **ativa** libera o acesso, **atrasada** mostra um
aviso mas mantém o acesso, e **cancelada** bloqueia o sistema até o
professor assinar de novo (tela de assinatura em `Assinatura` no menu,
ou automaticamente ao fazer login sem assinatura ativa).

## Etapa 6 — E-mails (Resend)

Assim como o Asaas, a chave do Resend é secreta e só existe dentro
das Edge Functions. Só 3 e-mails são enviados: cadastro realizado
(link de confirmação), recuperação de senha, e pagamento aprovado.

1. Crie uma conta em resend.com, verifique um domínio de envio (ou
   use o domínio de testes deles enquanto não configura o seu) e
   gere uma API key.
2. Configure os segredos:
   ```
   supabase secrets set RESEND_API_KEY=sua_chave_aqui
   supabase secrets set RESEND_FROM_EMAIL="Jaque Música <naoresponda@seudominio.com>"
   ```
3. Deploy da função que envia o e-mail de "pagamento aprovado" (ela já
   existia da Etapa 5; redeploy só para pegar a nova integração com o
   Resend):
   ```
   supabase functions deploy asaas-webhook --no-verify-jwt
   ```
4. Deploy da função que substitui os e-mails de autenticação do
   Supabase (cadastro e recuperação de senha):
   ```
   supabase functions deploy auth-email-hook --no-verify-jwt
   ```
5. No painel do Supabase, vá em **Authentication > Hooks** e ative o
   **"Send Email Hook"**, apontando para:
   `https://<seu-project-ref>.supabase.co/functions/v1/auth-email-hook`
   Ao salvar, o Supabase gera um segredo (`whsec_...`) — copie-o e
   rode:
   ```
   supabase secrets set AUTH_HOOK_SECRET="v1,whsec_o_valor_gerado"
   ```
   Depois disso, o Supabase para de mandar e-mail próprio de
   confirmação/recuperação — quem manda é o Resend, com o layout
   definido em `supabase/functions/_shared/emailTemplates.ts`.
6. Teste: crie uma conta nova (deve chegar o e-mail de confirmação),
   peça "esqueci minha senha" (deve chegar o e-mail de recuperação),
   e complete um pagamento no Asaas sandbox (deve chegar o e-mail de
   pagamento aprovado, disparado pelo `asaas-webhook`).

Toda a configuração de e-mail fica centralizada em
`supabase/functions/_shared/resend.ts` (remetente e chamada da API) e
`supabase/functions/_shared/emailTemplates.ts` (textos) — para mudar o
texto de um e-mail ou o remetente, é só nesses dois arquivos.
