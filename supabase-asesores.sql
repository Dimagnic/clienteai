-- =============================================
-- ClienteAI — Sistema de Asesores y Comisiones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Tabla de asesores
create table if not exists asesores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nombre text not null,
  email text not null,
  codigo text unique not null,              -- código corto para el enlace (?ref=codigo)
  comision_primer_mes numeric default 25,    -- % sobre el primer pago
  comision_recurrente numeric default 15,    -- % sobre pagos siguientes
  activo boolean default true,
  cuenta_banco text,                         -- CLABE o referencia para transferencia (opcional, lo llena el asesor)
  titular_cuenta text,
  banco text,
  telefono text,
  fecha_nacimiento date,
  estado text check (estado in ('pendiente', 'activo', 'suspendido')) default 'pendiente',
  activado_en timestamptz,
  created_at timestamptz default now()
);

-- Si la tabla asesores ya existía sin estas columnas, esto las agrega sin error
alter table asesores add column if not exists telefono text;
alter table asesores add column if not exists fecha_nacimiento date;
alter table asesores add column if not exists estado text check (estado in ('pendiente', 'activo', 'suspendido')) default 'pendiente';
alter table asesores add column if not exists activado_en timestamptz;

-- 2. Vincular negocios con el asesor que los refirió
alter table negocios add column if not exists asesor_id uuid references asesores(id) on delete set null;
alter table negocios add column if not exists referido_en timestamptz;
alter table negocios add column if not exists plan_renueva_en timestamptz;

-- 3. Tabla de comisiones (un registro por cada pago de cliente)
create table if not exists comisiones (
  id uuid default gen_random_uuid() primary key,
  asesor_id uuid references asesores(id) on delete cascade not null,
  negocio_id uuid references negocios(id) on delete cascade not null,
  monto_pago numeric not null,               -- lo que pagó el cliente ese mes (MXN)
  tipo text check (tipo in ('primer_mes', 'recurrente')) not null,
  porcentaje numeric not null,               -- % aplicado en este registro
  monto_comision numeric not null,           -- monto_pago * porcentaje / 100
  periodo text not null,                     -- 'YYYY-MM' del mes que se está pagando
  elegible boolean default false,            -- true cuando pasan los 7 días sin reembolso
  elegible_desde timestamptz,                -- fecha en que se vuelve elegible
  estado text check (estado in ('pendiente', 'aprobada', 'pagada', 'cancelada')) default 'pendiente',
  pagada_en timestamptz,
  created_at timestamptz default now()
);

-- 4. Tabla de cortes mensuales (resumen por asesor y periodo)
create table if not exists cortes_comisiones (
  id uuid default gen_random_uuid() primary key,
  asesor_id uuid references asesores(id) on delete cascade not null,
  periodo text not null,                     -- 'YYYY-MM'
  total_comision numeric not null default 0,
  estado text check (estado in ('abierto', 'pagado')) default 'abierto',
  pagado_en timestamptz,
  comprobante_url text,
  created_at timestamptz default now(),
  unique(asesor_id, periodo)
);

-- 5. RLS
alter table asesores enable row level security;
alter table comisiones enable row level security;
alter table cortes_comisiones enable row level security;

-- Políticas: asesor ve solo su propia info
drop policy if exists "asesor ve su perfil" on asesores;
create policy "asesor ve su perfil"
  on asesores for select
  using (auth.uid() = user_id);

drop policy if exists "asesor edita su cuenta bancaria" on asesores;
create policy "asesor edita su cuenta bancaria"
  on asesores for update
  using (auth.uid() = user_id);

drop policy if exists "asesor ve sus comisiones" on comisiones;
create policy "asesor ve sus comisiones"
  on comisiones for select
  using (
    exists (select 1 from asesores where asesores.id = comisiones.asesor_id and asesores.user_id = auth.uid())
  );

drop policy if exists "asesor ve sus cortes" on cortes_comisiones;
create policy "asesor ve sus cortes"
  on cortes_comisiones for select
  using (
    exists (select 1 from asesores where asesores.id = cortes_comisiones.asesor_id and asesores.user_id = auth.uid())
  );

-- Admin (tú) ve y gestiona todo vía service_role en las Edge Functions, no necesita política adicional aquí.

-- 6. Índices
create index if not exists idx_asesores_codigo on asesores(codigo);
create index if not exists idx_asesores_user_id on asesores(user_id);
create index if not exists idx_negocios_asesor_id on negocios(asesor_id);
create index if not exists idx_comisiones_asesor_id on comisiones(asesor_id);
create index if not exists idx_comisiones_periodo on comisiones(periodo);
create index if not exists idx_comisiones_estado on comisiones(estado);

-- 7. Función para marcar comisiones elegibles (más de 7 días sin reembolso)
create or replace function marcar_comisiones_elegibles()
returns void language plpgsql security definer as $$
begin
  update comisiones
  set elegible = true
  where elegible = false
    and estado = 'pendiente'
    and created_at <= now() - interval '7 days';
end;
$$;

-- 8. Función para generar el corte mensual (suma comisiones elegibles por asesor y periodo)
create or replace function generar_corte_mensual(p_periodo text)
returns void language plpgsql security definer as $$
begin
  insert into cortes_comisiones (asesor_id, periodo, total_comision)
  select asesor_id, p_periodo, sum(monto_comision)
  from comisiones
  where periodo = p_periodo
    and elegible = true
    and estado = 'aprobada'
  group by asesor_id
  on conflict (asesor_id, periodo)
  do update set total_comision = excluded.total_comision;
end;
$$;

-- ✅ Listo. Sistema de asesores configurado.
