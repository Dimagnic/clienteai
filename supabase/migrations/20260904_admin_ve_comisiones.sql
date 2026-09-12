-- =============================================================
-- FIX: el admin no podía ver la tabla "comisiones"
-- =============================================================
-- Existía "admin ve todos los asesores" en la tabla asesores, pero
-- nunca se creó el equivalente para comisiones ni cortes_comisiones.
-- Por eso el panel de admin mostraba la lista vacía aunque las
-- comisiones sí se estaban generando correctamente en la base.

drop policy if exists "admin ve todas las comisiones" on comisiones;
create policy "admin ve todas las comisiones"
  on comisiones for select
  using (es_admin());

drop policy if exists "admin ve todos los cortes" on cortes_comisiones;
create policy "admin ve todos los cortes"
  on cortes_comisiones for select
  using (es_admin());

-- El admin también necesita poder actualizar comisiones (por ejemplo,
-- marcarlas como pagadas desde el panel) y cortes_comisiones.
drop policy if exists "admin actualiza comisiones" on comisiones;
create policy "admin actualiza comisiones"
  on comisiones for update
  using (es_admin());

drop policy if exists "admin actualiza cortes" on cortes_comisiones;
create policy "admin actualiza cortes"
  on cortes_comisiones for update
  using (es_admin());

-- Verificación
select tablename, policyname, cmd
from pg_policies
where tablename in ('comisiones', 'cortes_comisiones')
order by tablename, policyname;
