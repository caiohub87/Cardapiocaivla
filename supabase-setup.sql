-- ============================================================
--  SISTEMA DE CARDÁPIO MULTI-HAMBURGUERIA
--  Schema completo + RLS (Row Level Security)
--  Rode este arquivo no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. HAMBURGUERIAS (tabela master)
-- ------------------------------------------------------------
create table if not exists hamburguerias (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,          -- usado na URL: /burger-king
  descricao     text,
  owner_email   text not null,                 -- quem criou/controla
  ativa         boolean not null default true,
  criada_em     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TEMAS (customização visual por hamburgueria)
-- ------------------------------------------------------------
create table if not exists temas (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  cor_primaria      text not null default '#D4AF37',   -- ouro
  cor_secundaria    text not null default '#000000',   -- preto
  cor_background    text not null default '#1a1a1a',
  cor_texto         text not null default '#ffffff',
  logo_url          text,
  fonte_principal   text not null default 'Inter, sans-serif',
  horario_abertura  text default '18:00',
  horario_fechamento text default '23:00',
  metodos_pagamento jsonb not null default '["pix","cartao","dinheiro"]',
  atualizado_em     timestamptz not null default now(),
  unique (hamburgueria_id)
);

-- ------------------------------------------------------------
-- 3. CATEGORIAS
-- ------------------------------------------------------------
create table if not exists categorias (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  nome              text not null,
  icone             text,                       -- emoji ou url
  ordem             int not null default 0,
  ativa             boolean not null default true
);

-- ------------------------------------------------------------
-- 4. PRODUTOS
-- ------------------------------------------------------------
create table if not exists produtos (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  categoria_id      uuid references categorias(id) on delete set null,
  nome              text not null,
  descricao         text,
  preco             numeric(10,2) not null default 0,
  imagem_url        text,
  disponivel        boolean not null default true,
  ordem             int not null default 0,
  criado_em         timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. VARIANTES (ex: tamanho, ponto da carne)
-- ------------------------------------------------------------
create table if not exists variantes (
  id                uuid primary key default gen_random_uuid(),
  produto_id        uuid not null references produtos(id) on delete cascade,
  nome              text not null,              -- ex: "Tamanho"
  tipo              text not null default 'single', -- single | multiple
  opcoes            jsonb not null default '[]' -- [{"nome":"G","preco":5.00}]
);

-- ------------------------------------------------------------
-- 6. ADITIVOS (adicionais: bacon, queijo extra...)
-- ------------------------------------------------------------
create table if not exists aditivos (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  nome              text not null,
  preco_adicional   numeric(10,2) not null default 0,
  disponivel        boolean not null default true
);

-- ------------------------------------------------------------
-- 7. PEDIDOS
-- ------------------------------------------------------------
create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  cliente_nome      text,
  cliente_email     text,
  cliente_telefone  text,
  origem            text not null default 'site', -- site | garcom
  mesa              text,                          -- quando origem = garcom
  status            text not null default 'novo',  -- novo|confirmado|preparando|pronto|entregue|cancelado
  total_valor       numeric(10,2) not null default 0,
  metodo_pagamento  text,
  observacoes       text,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. ITENS DO PEDIDO
-- ------------------------------------------------------------
create table if not exists itens_pedido (
  id                uuid primary key default gen_random_uuid(),
  pedido_id         uuid not null references pedidos(id) on delete cascade,
  produto_id        uuid references produtos(id) on delete set null,
  produto_nome      text not null,              -- snapshot (histórico)
  quantidade        int not null default 1,
  preco_unitario    numeric(10,2) not null default 0,
  variantes_json    jsonb default '{}',
  aditivos_json     jsonb default '[]'
);

-- ------------------------------------------------------------
-- 9. USUÁRIOS DA HAMBURGUERIA (owner / admin / garçom)
-- ------------------------------------------------------------
create table if not exists usuarios_hamburgueria (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  email             text not null,
  tipo              text not null default 'admin', -- owner | admin | garcom
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  unique (hamburgueria_id, email)
);

-- ------------------------------------------------------------
-- 10. SESSÕES DO GARÇOM (acesso via código, sem login)
-- ------------------------------------------------------------
create table if not exists sessoes_garcom (
  id                uuid primary key default gen_random_uuid(),
  hamburgueria_id   uuid not null references hamburguerias(id) on delete cascade,
  codigo_acesso     text not null,              -- 4 dígitos
  ativa             boolean not null default true,
  criada_em         timestamptz not null default now(),
  valida_ate        timestamptz
);

-- ============================================================
--  ÍNDICES (performance de filtros por hamburgueria)
-- ============================================================
create index if not exists idx_categorias_hamb on categorias(hamburgueria_id);
create index if not exists idx_produtos_hamb   on produtos(hamburgueria_id);
create index if not exists idx_produtos_cat    on produtos(categoria_id);
create index if not exists idx_pedidos_hamb    on pedidos(hamburgueria_id);
create index if not exists idx_pedidos_status  on pedidos(status);
create index if not exists idx_itens_pedido    on itens_pedido(pedido_id);

-- ============================================================
--  RLS (Row Level Security)
--  Estratégia:
--   - Catálogo (hamburguerias, temas, categorias, produtos,
--     variantes, aditivos): LEITURA PÚBLICA (cliente vê o menu)
--   - Escrita: apenas usuários autenticados vinculados à
--     hamburgueria (tabela usuarios_hamburgueria)
--   - Pedidos: qualquer um pode CRIAR (cliente faz pedido);
--     leitura/edição só quem é da hamburgueria
-- ============================================================

-- Função helper: o email autenticado pertence a esta hamburgueria?
create or replace function pertence_hamburgueria(h_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from usuarios_hamburgueria
    where hamburgueria_id = h_id
      and email = auth.email()
      and ativo = true
  );
$$;

-- Ativa RLS em todas as tabelas
alter table hamburguerias           enable row level security;
alter table temas                   enable row level security;
alter table categorias              enable row level security;
alter table produtos                enable row level security;
alter table variantes               enable row level security;
alter table aditivos                enable row level security;
alter table pedidos                 enable row level security;
alter table itens_pedido            enable row level security;
alter table usuarios_hamburgueria   enable row level security;
alter table sessoes_garcom          enable row level security;

-- ---------- HAMBURGUERIAS ----------
drop policy if exists "hamb_leitura_publica" on hamburguerias;
create policy "hamb_leitura_publica" on hamburguerias
  for select using (ativa = true);

drop policy if exists "hamb_insert_autenticado" on hamburguerias;
create policy "hamb_insert_autenticado" on hamburguerias
  for insert to authenticated
  with check (owner_email = auth.email());

drop policy if exists "hamb_update_dono" on hamburguerias;
create policy "hamb_update_dono" on hamburguerias
  for update to authenticated
  using (pertence_hamburgueria(id));

-- ---------- TEMAS ----------
drop policy if exists "temas_leitura_publica" on temas;
create policy "temas_leitura_publica" on temas
  for select using (true);

drop policy if exists "temas_escrita_dono" on temas;
create policy "temas_escrita_dono" on temas
  for all to authenticated
  using (pertence_hamburgueria(hamburgueria_id))
  with check (pertence_hamburgueria(hamburgueria_id));

-- ---------- CATEGORIAS ----------
drop policy if exists "cat_leitura_publica" on categorias;
create policy "cat_leitura_publica" on categorias
  for select using (true);

drop policy if exists "cat_escrita_dono" on categorias;
create policy "cat_escrita_dono" on categorias
  for all to authenticated
  using (pertence_hamburgueria(hamburgueria_id))
  with check (pertence_hamburgueria(hamburgueria_id));

-- ---------- PRODUTOS ----------
drop policy if exists "prod_leitura_publica" on produtos;
create policy "prod_leitura_publica" on produtos
  for select using (true);

drop policy if exists "prod_escrita_dono" on produtos;
create policy "prod_escrita_dono" on produtos
  for all to authenticated
  using (pertence_hamburgueria(hamburgueria_id))
  with check (pertence_hamburgueria(hamburgueria_id));

-- ---------- VARIANTES ----------
drop policy if exists "var_leitura_publica" on variantes;
create policy "var_leitura_publica" on variantes
  for select using (true);

drop policy if exists "var_escrita_dono" on variantes;
create policy "var_escrita_dono" on variantes
  for all to authenticated
  using (exists (
    select 1 from produtos p
    where p.id = variantes.produto_id
      and pertence_hamburgueria(p.hamburgueria_id)
  ))
  with check (exists (
    select 1 from produtos p
    where p.id = variantes.produto_id
      and pertence_hamburgueria(p.hamburgueria_id)
  ));

-- ---------- ADITIVOS ----------
drop policy if exists "adit_leitura_publica" on aditivos;
create policy "adit_leitura_publica" on aditivos
  for select using (true);

drop policy if exists "adit_escrita_dono" on aditivos;
create policy "adit_escrita_dono" on aditivos
  for all to authenticated
  using (pertence_hamburgueria(hamburgueria_id))
  with check (pertence_hamburgueria(hamburgueria_id));

-- ---------- PEDIDOS ----------
-- Cliente (anon) pode criar pedido
drop policy if exists "pedido_insert_publico" on pedidos;
create policy "pedido_insert_publico" on pedidos
  for insert with check (true);

-- Só a hamburgueria lê/edita seus pedidos
drop policy if exists "pedido_leitura_dono" on pedidos;
create policy "pedido_leitura_dono" on pedidos
  for select to authenticated
  using (pertence_hamburgueria(hamburgueria_id));

drop policy if exists "pedido_update_dono" on pedidos;
create policy "pedido_update_dono" on pedidos
  for update to authenticated
  using (pertence_hamburgueria(hamburgueria_id));

-- ---------- ITENS DO PEDIDO ----------
drop policy if exists "item_insert_publico" on itens_pedido;
create policy "item_insert_publico" on itens_pedido
  for insert with check (true);

drop policy if exists "item_leitura_dono" on itens_pedido;
create policy "item_leitura_dono" on itens_pedido
  for select to authenticated
  using (exists (
    select 1 from pedidos p
    where p.id = itens_pedido.pedido_id
      and pertence_hamburgueria(p.hamburgueria_id)
  ));

-- ---------- USUÁRIOS ----------
drop policy if exists "user_leitura_dono" on usuarios_hamburgueria;
create policy "user_leitura_dono" on usuarios_hamburgueria
  for select to authenticated
  using (email = auth.email() or pertence_hamburgueria(hamburgueria_id));

drop policy if exists "user_insert_autenticado" on usuarios_hamburgueria;
create policy "user_insert_autenticado" on usuarios_hamburgueria
  for insert to authenticated
  with check (true);

drop policy if exists "user_escrita_dono" on usuarios_hamburgueria;
create policy "user_escrita_dono" on usuarios_hamburgueria
  for update to authenticated
  using (pertence_hamburgueria(hamburgueria_id));

-- ---------- SESSÕES GARÇOM ----------
drop policy if exists "sessao_leitura_publica" on sessoes_garcom;
create policy "sessao_leitura_publica" on sessoes_garcom
  for select using (ativa = true);

drop policy if exists "sessao_escrita_dono" on sessoes_garcom;
create policy "sessao_escrita_dono" on sessoes_garcom
  for all to authenticated
  using (pertence_hamburgueria(hamburgueria_id))
  with check (pertence_hamburgueria(hamburgueria_id));

-- ============================================================
--  REALTIME (notificar ADM de novos pedidos)
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table pedidos;
exception when duplicate_object then
  null; -- já adicionado, ignora
end $$;

-- ============================================================
--  FIM DO SCHEMA
-- ============================================================
