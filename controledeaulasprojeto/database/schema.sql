-- ============================================================
-- ETAPA 2 — Autenticação + multi-tenant (RLS)
-- Rode este arquivo inteiro no SQL Editor do Supabase, na ordem.
-- É seguro rodar mais de uma vez (usa IF NOT EXISTS / OR REPLACE).
-- ============================================================


-- ----------------------------------------------------------------
-- PARTE 1 — coluna user_id nas tabelas existentes
-- ----------------------------------------------------------------
alter table public.students add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.packages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.lessons  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists packages_user_id_idx on public.packages(user_id);
create index if not exists lessons_user_id_idx  on public.lessons(user_id);


-- ----------------------------------------------------------------
-- PARTE 2 — tabela profiles (1 linha por professor) + criação
-- automática no cadastro
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  slug text unique not null,          -- usado no link de agendamento (Etapa 4)
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'professor'; end if;

  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  insert into public.profiles (id, name, email, slug)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email, final_slug);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------
-- PARTE 3 — migração dos dados que já existem (sistema hoje é de
-- um único professor). Rode isto UMA VEZ, DEPOIS de criar a sua
-- conta pela tela de cadastro, substituindo <SEU_USER_ID> pelo seu
-- id em Authentication > Users no painel do Supabase.
-- Se o banco já está vazio (instalação nova), pule esta parte.
-- ----------------------------------------------------------------
-- update public.students set user_id = '<SEU_USER_ID>' where user_id is null;
-- update public.packages set user_id = '<SEU_USER_ID>' where user_id is null;
-- update public.lessons  set user_id = '<SEU_USER_ID>' where user_id is null;


-- ----------------------------------------------------------------
-- PARTE 4 — depois da migração acima (ou em instalação nova),
-- torna user_id obrigatório.
-- ATENÇÃO: só rode depois de garantir que nenhuma linha ficou com
-- user_id nulo (a Parte 3 acima).
-- ----------------------------------------------------------------
alter table public.students alter column user_id set not null;
alter table public.packages alter column user_id set not null;
alter table public.lessons  alter column user_id set not null;


-- ----------------------------------------------------------------
-- PARTE 5 — Row Level Security: cada professor só vê/edita as
-- próprias linhas. Nunca confiar apenas no frontend.
-- ----------------------------------------------------------------
alter table public.students enable row level security;
alter table public.packages enable row level security;
alter table public.lessons  enable row level security;
alter table public.profiles enable row level security;

drop policy if exists students_select_own on public.students;
drop policy if exists students_insert_own on public.students;
drop policy if exists students_update_own on public.students;
drop policy if exists students_delete_own on public.students;
create policy students_select_own on public.students for select using (auth.uid() = user_id);
create policy students_insert_own on public.students for insert with check (auth.uid() = user_id);
create policy students_update_own on public.students for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy students_delete_own on public.students for delete using (auth.uid() = user_id);

drop policy if exists packages_select_own on public.packages;
drop policy if exists packages_insert_own on public.packages;
drop policy if exists packages_update_own on public.packages;
drop policy if exists packages_delete_own on public.packages;
create policy packages_select_own on public.packages for select using (auth.uid() = user_id);
create policy packages_insert_own on public.packages for insert with check (auth.uid() = user_id);
create policy packages_update_own on public.packages for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy packages_delete_own on public.packages for delete using (auth.uid() = user_id);

drop policy if exists lessons_select_own on public.lessons;
drop policy if exists lessons_insert_own on public.lessons;
drop policy if exists lessons_update_own on public.lessons;
drop policy if exists lessons_delete_own on public.lessons;
create policy lessons_select_own on public.lessons for select using (auth.uid() = user_id);
create policy lessons_insert_own on public.lessons for insert with check (auth.uid() = user_id);
create policy lessons_update_own on public.lessons for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy lessons_delete_own on public.lessons for delete using (auth.uid() = user_id);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- não existe policy de insert em profiles: a linha é criada apenas pelo
-- trigger handle_new_user (security definer), nunca pelo cliente.

-- RLS por si só não dá acesso: o role "authenticated" também precisa
-- do GRANT base na tabela (senão o PostgREST responde 403 antes mesmo
-- de avaliar as policies). Alguns projetos Supabase não aplicam esse
-- grant automaticamente em tabelas criadas via SQL Editor.
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.packages to authenticated;
grant select, insert, update, delete on public.lessons  to authenticated;
grant select, update on public.profiles to authenticated;


-- ============================================================
-- ETAPA 3 — Disponibilidade
-- Um bloco de horário = um dia da semana + janela de horário +
-- duração da aula. O professor pode ter vários blocos (ex.: dois
-- blocos na Segunda: manhã e noite).
-- weekday segue a mesma convenção do app: 0=Segunda ... 6=Domingo.
-- ============================================================
create table if not exists public.availability (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  lesson_duration smallint not null default 50,
  created_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time)
);
create index if not exists availability_user_id_idx on public.availability(user_id);

alter table public.availability enable row level security;

drop policy if exists availability_select_own on public.availability;
drop policy if exists availability_insert_own on public.availability;
drop policy if exists availability_update_own on public.availability;
drop policy if exists availability_delete_own on public.availability;
create policy availability_select_own on public.availability for select using (auth.uid() = user_id);
create policy availability_insert_own on public.availability for insert with check (auth.uid() = user_id);
create policy availability_update_own on public.availability for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy availability_delete_own on public.availability for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.availability to authenticated;


-- ============================================================
-- ETAPA 4 — Link público de agendamento
-- A página pública (agendar.html) NUNCA acessa as tabelas
-- students/packages/lessons/availability diretamente (não tem
-- sessão de professor). Em vez disso, chama 3 funções abaixo
-- (security definer), que expõem só o estritamente necessário:
-- nome do professor, horários livres, e criação de solicitação.
-- ============================================================
create table if not exists public.booking_requests (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  student_phone text not null,
  note text,
  date date not null,
  time time not null,
  duration smallint not null,
  status text not null default 'pendente' check (status in ('pendente','aceita','recusada')),
  created_at timestamptz not null default now()
);
create index if not exists booking_requests_user_id_idx on public.booking_requests(user_id);

alter table public.booking_requests enable row level security;

drop policy if exists booking_requests_select_own on public.booking_requests;
drop policy if exists booking_requests_update_own on public.booking_requests;
create policy booking_requests_select_own on public.booking_requests for select using (auth.uid() = user_id);
create policy booking_requests_update_own on public.booking_requests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, update on public.booking_requests to authenticated;
-- sem policy de insert/delete para authenticated/anon: a única forma de
-- criar uma solicitação é pela função create_booking_request abaixo.

-- nome público do professor a partir do slug (usado no cabeçalho da página)
create or replace function public.get_public_professor(p_slug text)
returns table(name text, slug text)
language sql security definer set search_path = public
as $$
  select name, slug from public.profiles where slug = p_slug;
$$;
grant execute on function public.get_public_professor(text) to anon, authenticated;

-- horários livres do professor num intervalo de datas
create or replace function public.get_available_slots(p_slug text, p_from date, p_to date)
returns table(slot_date date, slot_time time)
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.profiles where slug = p_slug;
  if v_user_id is null then
    return;
  end if;

  return query
  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  ),
  rules as (
    select * from public.availability where user_id = v_user_id
  ),
  candidate as (
    select d as slot_date, (rules.start_time + (offset_min || ' minutes')::interval)::time as slot_time
    from days
    join rules on rules.weekday = ((extract(dow from d)::int + 6) % 7)
    cross join lateral generate_series(
      0,
      (extract(epoch from (rules.end_time - rules.start_time)) / 60)::int - rules.lesson_duration,
      rules.lesson_duration
    ) as offset_min
  )
  select c.slot_date, c.slot_time
  from candidate c
  where not exists (
    select 1 from public.lessons l
    where l.user_id = v_user_id and l.date = c.slot_date and l.time = c.slot_time and l.status <> 'cancelada'
  )
  and not exists (
    select 1 from public.booking_requests b
    where b.user_id = v_user_id and b.date = c.slot_date and b.time = c.slot_time and b.status in ('pendente','aceita')
  )
  order by c.slot_date, c.slot_time;
end;
$$;
grant execute on function public.get_available_slots(text, date, date) to anon, authenticated;

-- cria a solicitação de agendamento (fica "pendente" até o professor
-- aceitar ou recusar). Revalida o horário no servidor para nunca
-- permitir conflito, mesmo se dois alunos tentarem ao mesmo tempo.
create or replace function public.create_booking_request(
  p_slug text, p_date date, p_time time, p_name text, p_phone text, p_note text
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_duration smallint;
  v_id text;
  v_free boolean;
begin
  select id into v_user_id from public.profiles where slug = p_slug;
  if v_user_id is null then
    raise exception 'Professor não encontrado.';
  end if;

  select lesson_duration into v_duration
  from public.availability
  where user_id = v_user_id
    and weekday = ((extract(dow from p_date)::int + 6) % 7)
    and start_time <= p_time and p_time < end_time
  limit 1;

  if v_duration is null then
    raise exception 'Horário fora da disponibilidade do professor.';
  end if;

  select
    not exists (select 1 from public.lessons where user_id = v_user_id and date = p_date and time = p_time and status <> 'cancelada')
    and not exists (select 1 from public.booking_requests where user_id = v_user_id and date = p_date and time = p_time and status in ('pendente','aceita'))
  into v_free;

  if not v_free then
    raise exception 'Este horário acabou de ficar indisponível. Escolha outro.';
  end if;

  v_id := gen_random_uuid()::text;

  insert into public.booking_requests (id, user_id, student_name, student_phone, note, date, time, duration, status)
  values (v_id, v_user_id, p_name, p_phone, nullif(p_note,''), p_date, p_time, v_duration, 'pendente');

  return v_id;
end;
$$;
grant execute on function public.create_booking_request(text, date, time, text, text, text) to anon, authenticated;


-- ============================================================
-- ETAPA 5 — Assinatura (Asaas)
-- 1 linha por professor. O cliente autenticado só LÊ o próprio
-- status; toda escrita acontece pelas Edge Functions (com a
-- service role key, fora do alcance do RLS) — nunca pelo
-- navegador do professor. Isso impede que alguém edite o próprio
-- status de assinatura pelo DevTools.
-- ============================================================
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  asaas_customer_id text,
  asaas_subscription_id text,
  status text not null default 'pending' check (status in ('pending','active','overdue','canceled')),
  plan_value numeric,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select using (auth.uid() = user_id);
-- sem policy de insert/update/delete: só a service role (Edge Functions) escreve aqui.
grant select on public.subscriptions to authenticated;

-- Estende o trigger de cadastro (Etapa 2) para também criar a
-- linha de assinatura (status 'pending' = ainda não assinou).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    '[^a-zA-Z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'professor'; end if;

  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  insert into public.profiles (id, name, email, slug)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email, final_slug);

  insert into public.subscriptions (user_id, status)
  values (new.id, 'pending');

  return new;
end;
$$;
-- (o trigger on_auth_user_created da Etapa 2 continua valendo, só
-- trocamos a função que ele chama)


-- ============================================================
-- ETAPA 7 — Perfil editável (nome + assunto das aulas)
-- Mostrado no canto superior esquerdo do sistema, no lugar do
-- texto fixo "Jaque Música / aulas de canto".
-- ============================================================
alter table public.profiles add column if not exists tagline text not null default 'Gestão de aulas';

