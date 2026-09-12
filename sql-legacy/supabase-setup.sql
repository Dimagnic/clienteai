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
  color text default '#16a34a',
  plan text default 'gratuito',
  activo boolean default true,
  conversaciones_mes integer default 0,
  mes_actual text default to_char(now(), 'YYYY-MM'),
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

-- 3. Tabla de perfiles (para roles admin sin exponer emails en el cliente)
create table if not exists perfiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security (RLS)
alter table negocios enable row level security;
alter table conversaciones enable row level security;
alter table perfiles enable row level security;

-- Políticas para negocios
drop policy if exists "usuario ve sus negocios" on negocios;
create policy "usuario ve sus negocios"
  on negocios for select
  using (auth.uid() = user_id);

drop policy if exists "widget puede leer negocio por token" on negocios;
create policy "widget puede leer negocio por token"
  on negocios for select
  using (true);  -- El widget público necesita leer por token

drop policy if exists "usuario crea su negocio" on negocios;
create policy "usuario crea su negocio"
  on negocios for insert
  with check (auth.uid() = user_id);

drop policy if exists "usuario edita su negocio" on negocios;
create policy "usuario edita su negocio"
  on negocios for update
  using (auth.uid() = user_id);

drop policy if exists "usuario borra su negocio" on negocios;
create policy "usuario borra su negocio"
  on negocios for delete
  using (auth.uid() = user_id);

-- Políticas para conversaciones
drop policy if exists "usuario ve conversaciones de su negocio" on conversaciones;
create policy "usuario ve conversaciones de su negocio"
  on conversaciones for select
  using (
    exists (
      select 1 from negocios
      where negocios.id = conversaciones.negocio_id
      and negocios.user_id = auth.uid()
    )
  );

drop policy if exists "edge function puede insertar conversaciones" on conversaciones;
create policy "edge function puede insertar conversaciones"
  on conversaciones for insert
  with check (true);  -- La Edge Function usa service_role, esto es fallback

-- Políticas para perfiles
drop policy if exists "usuario ve su perfil" on perfiles;
create policy "usuario ve su perfil"
  on perfiles for select
  using (auth.uid() = user_id);

-- 5. Función para incrementar conversaciones (atómica, evita race conditions)
create or replace function increment_conversaciones(p_negocio_id uuid)
returns void language plpgsql security definer as $$
begin
  update negocios
  set conversaciones_mes = coalesce(conversaciones_mes, 0) + 1
  where id = p_negocio_id;
end;
$$;

-- 6. Índices para rendimiento
create index if not exists idx_negocios_user_id on negocios(user_id);
create index if not exists idx_negocios_token on negocios(token);
create index if not exists idx_conversaciones_negocio_id on conversaciones(negocio_id);
create index if not exists idx_conversaciones_created_at on conversaciones(created_at);
create index if not exists idx_perfiles_user_id on perfiles(user_id);

-- ============================================================
-- PARA ACTIVAR UN ADMIN: ejecuta esto con el email del admin
-- ============================================================
-- update perfiles set is_admin = true
-- where user_id = (select id from auth.users where email = 'tu@email.com');

-- ✅ Listo. Base de datos configurada correctamente.
