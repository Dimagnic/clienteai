-- =============================================================
-- SEGURIDAD CRÍTICA: proteger columnas de facturación/plan
-- =============================================================
-- Antes de este cambio, la política RLS "usuario edita su negocio"
-- permitía a cualquier usuario autenticado modificar la columna "plan"
-- (y otras relacionadas a facturación) de su propio negocio directamente
-- desde el navegador, sin pasar por Stripe. Esto permitía auto-otorgarse
-- planes de pago gratis.
--
-- Este trigger fuerza que esas columnas SOLO puedan cambiar cuando la
-- operación viene del rol "service_role" (usado internamente por las
-- Edge Functions con la clave secreta), nunca desde el navegador
-- (rol "authenticated" o "anon").

create or replace function proteger_columnas_facturacion()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'UPDATE' then
    -- Si quien ejecuta la actualización NO es el service_role,
    -- se ignoran los cambios a las columnas sensibles (se mantiene el valor anterior).
    if auth.role() <> 'service_role' then
      new.plan := old.plan;
      new.plan_expira_en := old.plan_expira_en;
      new.plan_deseado := old.plan_deseado;
      new.conversaciones_mes := old.conversaciones_mes;
      new.mes_actual := old.mes_actual;
      new.estado_cuenta := old.estado_cuenta;
      new.notificacion_7dias_enviada := old.notificacion_7dias_enviada;
      new.notificacion_80_enviada := old.notificacion_80_enviada;
      new.codigo_cliente := old.codigo_cliente;
      new.token := old.token;
      new.asesor_id := old.asesor_id;
    end if;
  elsif TG_OP = 'INSERT' then
    -- Un negocio nuevo creado desde el navegador (no desde una Edge Function)
    -- SIEMPRE nace en plan gratuito, sin importar qué mande el cliente.
    if auth.role() <> 'service_role' then
      new.plan := 'gratuito';
      new.plan_expira_en := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_columnas_facturacion on negocios;
create trigger trg_proteger_columnas_facturacion
  before insert or update on negocios
  for each row
  execute function proteger_columnas_facturacion();

-- ✅ A partir de aquí, ningún usuario (ni admin) puede cambiar su propio
-- plan desde el navegador. Solo las Edge Functions (Stripe webhook y la
-- nueva función admin-cambiar-plan) pueden hacerlo, usando la clave de servicio.
