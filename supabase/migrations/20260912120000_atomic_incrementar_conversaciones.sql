-- =============================================================
-- FIX: incremento atómico de conversaciones_mes
-- =============================================================
-- La función increment_conversaciones() solo existía en el script manual
-- supabase-setup.sql (nunca en una migración versionada), y encima la
-- función ask-claude no la estaba usando: hacía un
--   select conversaciones_mes ... luego update ... = valor + 1
-- en dos pasos separados. Si llegan dos mensajes casi al mismo tiempo
-- (dos pestañas, dos visitantes chateando a la vez con el mismo negocio),
-- ambos pueden leer el mismo valor antes de que el otro escriba, y se
-- pierde un conteo real. Con pocos usuarios es poco probable, pero es
-- una condición de carrera real y ya existía la solución correcta.

create or replace function increment_conversaciones(p_negocio_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update negocios
  set conversaciones_mes = coalesce(conversaciones_mes, 0) + 1
  where id = p_negocio_id;
end;
$$;

grant execute on function increment_conversaciones(uuid) to service_role;
