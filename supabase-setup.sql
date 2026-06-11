-- =============================================
-- ClienteAI — Script SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Tabla de negocios
create table if not exists negocios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  nombre text not null,
  descripcion text,
  menu text,
  horario text,
  direccion text,
  telefono text,
  extra text,
  plan text default 'gratuito',
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabla de conversaciones
create table if not exists conversaciones (
  id uuid default gen_random_uuid() primary key,
  negocio_id uuid references negocios(id) on delete cascade not null,
  mensaje text not null,
  rol text check (rol in ('user', 'assistant')) not null,
  created_at timestamptz default now()
);

-- 3. Row Level Security (RLS) — cada usuario solo ve sus datos
alter table negocios enable row level security;
alter table conversaciones enable row level security;

-- Políticas para negocios
create policy "usuario ve sus negocios"
  on negocios for select
  using (auth.uid() = user_id);

create policy "usuario crea su negocio"
  on negocios for insert
  with check (auth.uid() = user_id);

create policy "usuario edita su negocio"
  on negocios for update
  using (auth.uid() = user_id);

create policy "usuario borra su negocio"
  on negocios for delete
  using (auth.uid() = user_id);

-- Políticas para conversaciones
create policy "usuario ve conversaciones de su negocio"
  on conversaciones for select
  using (
    exists (
      select 1 from negocios
      where negocios.id = conversaciones.negocio_id
      and negocios.user_id = auth.uid()
    )
  );

create policy "insertar conversaciones del negocio"
  on conversaciones for insert
  with check (
    exists (
      select 1 from negocios
      where negocios.id = conversaciones.negocio_id
      and negocios.user_id = auth.uid()
    )
  );

-- 4. Índices para mejor rendimiento
create index if not exists idx_negocios_user_id on negocios(user_id);
create index if not exists idx_negocios_token on negocios(token);
create index if not exists idx_conversaciones_negocio_id on conversaciones(negocio_id);
create index if not exists idx_conversaciones_created_at on conversaciones(created_at);

-- ✅ Listo. Ahora tu base de datos está configurada.
