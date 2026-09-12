-- =============================================================
-- FIX: la función proteger_columnas_facturacion() en producción
-- tenía una lógica de límite de asistentes (1 para gratuito/pro,
-- 3 para negocio) que nunca quedó guardada en ninguna migración
-- del repositorio — se había agregado directo en el SQL Editor de
-- Supabase en algún momento anterior. Esta migración:
--   1. Deja esa lógica documentada y versionada correctamente.
--   2. Le agrega la exención para cuentas administradoras: el
--      admin puede crear asistentes ilimitados, igual que ya
--      hicimos en ask-claude y en el frontend (Dashboard.jsx).
-- =============================================================

create or replace function proteger_columnas_facturacion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_plan_actual text;
  v_max integer;
  v_es_admin boolean;
begin
  if TG_OP = 'UPDATE' then
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
    if auth.role() <> 'service_role' then
      -- Las cuentas administradoras no tienen límite de asistentes:
      -- se usan para demos/pruebas internas, no son clientes de pago.
      select coalesce(is_admin, false) into v_es_admin
        from perfiles where user_id = new.user_id;

      if not v_es_admin then
        -- LÍMITE DE ASISTENTES: cuenta cuántos negocios ya tiene este
        -- usuario y compara contra el máximo real de su plan (basado en
        -- el negocio más antiguo, que refleja el plan realmente pagado).
        select count(*) into v_count from negocios where user_id = new.user_id;

        if v_count > 0 then
          select plan into v_plan_actual from negocios
            where user_id = new.user_id order by created_at asc limit 1;
          v_max := case when v_plan_actual = 'negocio' then 3 else 1 end;

          if v_count >= v_max then
            raise exception 'Límite de asistentes alcanzado para tu plan (%). Actualiza tu plan para crear más.', v_max;
          end if;
        end if;
      end if;

      new.plan := 'gratuito';
      new.plan_expira_en := null;
    end if;
  end if;
  return new;
end;
$$;

-- El trigger ya existe y sigue apuntando a esta misma función — no hace
-- falta recrearlo, "create or replace function" ya actualiza su lógica.

-- Verificación rápida: confirma que la función quedó con la exención de admin.
select prosrc ilike '%v_es_admin%' as tiene_exencion_admin
from pg_proc where proname = 'proteger_columnas_facturacion';
