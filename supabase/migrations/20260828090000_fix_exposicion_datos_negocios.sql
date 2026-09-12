-- =============================================================
-- FIX CRÍTICO 1: cerrar la fuga de datos de TODOS los negocios
-- =============================================================
-- La política "widget puede leer negocio por token" usaba using(true),
-- lo que permitía a CUALQUIERA (sin sesión, sin token) leer la tabla
-- negocios completa: email, teléfono, codigo_cliente, token de otros
-- negocios, etc. Se reemplaza por una función seguro que solo expone
-- los campos que el widget público realmente necesita para funcionar.

drop policy if exists "widget puede leer negocio por token" on negocios;

create or replace function obtener_negocio_widget(p_token text)
returns table (
  id uuid,
  nombre text,
  nombre_bot text,
  descripcion text,
  menu text,
  horario text,
  direccion text,
  telefono text,
  extra text,
  color text,
  activo boolean
)
language sql
security definer
set search_path = public
as $$
  select id, nombre, nombre_bot, descripcion, menu, horario, direccion, telefono, extra, color, activo
  from negocios
  where token = p_token
  limit 1;
$$;

grant execute on function obtener_negocio_widget(text) to anon, authenticated;

-- Ahora que la política abierta se eliminó, el admin y el asesor necesitan
-- sus propios permisos explícitos para ver negocios que no son suyos.

drop policy if exists "admin ve todos los negocios" on negocios;
create policy "admin ve todos los negocios"
  on negocios for select
  using (
    exists (select 1 from perfiles where perfiles.user_id = auth.uid() and perfiles.is_admin = true)
  );

drop policy if exists "asesor ve sus referidos" on negocios;
create policy "asesor ve sus referidos"
  on negocios for select
  using (
    exists (select 1 from asesores where asesores.id = negocios.asesor_id and asesores.user_id = auth.uid())
  );

-- =============================================================
-- FIX CRÍTICO 2: los links de referido (?ref=CODIGO) no funcionaban
-- =============================================================
-- Login.jsx intentaba buscar el asesor directo en la tabla "asesores"
-- desde el navegador SIN sesión (usuario anónimo registrándose). RLS
-- lo bloqueaba silenciosamente y asesor_id quedaba siempre null, sin
-- generar comisión. Esta función expone SOLO el id del asesor a partir
-- de su código público, sin exponer datos bancarios ni personales.

create or replace function buscar_asesor_por_codigo(p_codigo text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from asesores where codigo = upper(p_codigo) limit 1;
$$;

grant execute on function buscar_asesor_por_codigo(text) to anon, authenticated;

-- ✅ Listo. La tabla negocios ya no es de lectura pública total.
-- El widget, el admin y los asesores mantienen exactamente el acceso
-- que necesitan, y nada más.
drop policy if exists "publico lee negocio por token" on negocios;

-- Verificación: ya no debe quedar ninguna política con qual = true en negocios
select policyname, cmd, qual from pg_policies where tablename = 'negocios' order by policyname;
