-- =============================================================
-- Schema do Almoxarifado para Supabase
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard -> SQL Editor -> New query -> colar -> Run)
-- =============================================================

-- Extensão para gerar UUID automaticamente
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. Perfis de usuário (role: admin/user), ligados ao auth.users
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- Cria automaticamente um profile "user" toda vez que alguém se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------------
-- 2. Itens do almoxarifado
-- -------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('EPI', 'Equipamento', 'Material de Consumo', 'Medicamento')),
  unit text not null,
  quantity numeric not null default 0,
  minimum_stock numeric not null default 0,
  safety_stock numeric not null default 0,
  location text,
  expiry_date date,
  ca_number text,
  description text,
  supplier text,
  last_unit_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 3. Funcionários
-- -------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  registration text not null,
  name text not null,
  role text,
  sector text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 4. Movimentações de estoque (entrada/saída)
-- -------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items (id) on delete set null,
  item_code text not null,
  item_name text not null,
  movement_type text not null check (movement_type in ('entrada', 'saida')),
  quantity numeric not null,
  date timestamptz not null default now(),
  destination text,
  responsible text,
  invoice_number text,
  purchase_order text,
  supplier text,
  unit_price numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 5. Solicitações de compra
-- -------------------------------------------------------------
create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items (id) on delete set null,
  item_code text not null,
  item_name text not null,
  item_type text,
  unit text,
  current_quantity numeric,
  minimum_stock numeric,
  requested_quantity numeric not null,
  last_unit_price numeric,
  supplier text,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'comprado', 'cancelado')),
  notes text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 6. Permissões de acesso por usuário
-- -------------------------------------------------------------
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text,
  access_level text not null default 'somente_visualizacao'
    check (access_level in ('somente_visualizacao', 'visualizacao_edicao', 'aba_especifica')),
  allowed_pages text[] default '{}',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================
-- Row Level Security: exige estar autenticado para ler/gravar.
-- Ajuste as políticas se quiser regras mais finas (ex: só admin
-- edita funcionários, etc.) — isso aqui é o mínimo seguro para
-- não deixar as tabelas abertas para qualquer visitante anônimo.
-- =============================================================
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.employees enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.user_permissions enable row level security;

-- profiles: cada usuário só vê/edita o próprio perfil
create policy "profiles: usuário vê o próprio perfil" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: usuário edita o próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- demais tabelas: qualquer usuário autenticado pode ler e escrever
-- (o controle fino de quem pode editar o quê já é feito no front-end
-- pela tabela user_permissions / hook usePermissions)
create policy "items: autenticado lê" on public.items for select using (auth.role() = 'authenticated');
create policy "items: autenticado grava" on public.items for insert with check (auth.role() = 'authenticated');
create policy "items: autenticado atualiza" on public.items for update using (auth.role() = 'authenticated');
create policy "items: autenticado apaga" on public.items for delete using (auth.role() = 'authenticated');

create policy "employees: autenticado lê" on public.employees for select using (auth.role() = 'authenticated');
create policy "employees: autenticado grava" on public.employees for insert with check (auth.role() = 'authenticated');
create policy "employees: autenticado atualiza" on public.employees for update using (auth.role() = 'authenticated');
create policy "employees: autenticado apaga" on public.employees for delete using (auth.role() = 'authenticated');

create policy "stock_movements: autenticado lê" on public.stock_movements for select using (auth.role() = 'authenticated');
create policy "stock_movements: autenticado grava" on public.stock_movements for insert with check (auth.role() = 'authenticated');
create policy "stock_movements: autenticado atualiza" on public.stock_movements for update using (auth.role() = 'authenticated');
create policy "stock_movements: autenticado apaga" on public.stock_movements for delete using (auth.role() = 'authenticated');

create policy "purchase_requests: autenticado lê" on public.purchase_requests for select using (auth.role() = 'authenticated');
create policy "purchase_requests: autenticado grava" on public.purchase_requests for insert with check (auth.role() = 'authenticated');
create policy "purchase_requests: autenticado atualiza" on public.purchase_requests for update using (auth.role() = 'authenticated');
create policy "purchase_requests: autenticado apaga" on public.purchase_requests for delete using (auth.role() = 'authenticated');

create policy "user_permissions: autenticado lê" on public.user_permissions for select using (auth.role() = 'authenticated');
create policy "user_permissions: autenticado grava" on public.user_permissions for insert with check (auth.role() = 'authenticated');
create policy "user_permissions: autenticado atualiza" on public.user_permissions for update using (auth.role() = 'authenticated');
create policy "user_permissions: autenticado apaga" on public.user_permissions for delete using (auth.role() = 'authenticated');

-- =============================================================
-- Depois de rodar este script, transforme seu usuário em admin:
-- 1. Cadastre-se uma vez pela tela de login do app.
-- 2. Rode o comando abaixo trocando o e-mail:
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'seu@email.com');
-- =============================================================
