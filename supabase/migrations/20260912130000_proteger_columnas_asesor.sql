-- =============================================================
-- SEGURIDAD CRÍTICA: proteger columnas financieras/de estado de "asesores"
-- =============================================================
-- La política "asesor edita su cuenta bancaria" (creada en el script
-- histórico supabase-asesores.sql) permite:
--   update on asesores using (auth.uid() = user_id)
-- SIN ninguna restricción de columnas. Como Postgres RLS solo controla
-- qué FILAS puede tocar cada quien (no qué COLUMNAS), cualquier asesor
-- autenticado puede llamar directamente a la API de Supabase (con su
-- propio JWT, sin pasar por el frontend) y hacer, por ejemplo:
--
--   supabase.from('asesores').update({
--     comision_primer_mes: 100,
--     comision_recurrente: 100,
--     estado: 'activo',
--     activo: true
--   }).eq('id', suPropioId)
--
-- ...y subirse su propio porcentaje de comisión al 100%, o saltarse el
-- estado "pendiente"/"suspendido" que bloquea el pago de comisiones
-- hasta que el asesor realmente activó su cuenta. AsesorDashboard.jsx
-- (el único lugar del código que sí actualiza esta tabla) solo llega a
-- mandar nombre/telefono/datos bancarios/foto — nunca comisiones ni
-- estado — así que bloquear esas columnas no rompe ningún flujo real.
--
-- Se aplica exactamente el mismo patrón ya usado para "negocios" en
-- proteger_columnas_facturacion(): las columnas sensibles solo pueden
-- cambiar cuando la operación viene del service_role (Edge Functions).

create or replace function proteger_columnas_asesor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    if auth.role() <> 'service_role' then
      new.user_id := old.user_id;
      new.email := old.email;
      new.codigo := old.codigo;
      new.comision_primer_mes := old.comision_primer_mes;
      new.comision_recurrente := old.comision_recurrente;
      new.activo := old.activo;
      new.estado := old.estado;
      new.activado_en := old.activado_en;
      new.token_activacion := old.token_activacion;
      new.token_generado_en := old.token_generado_en;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_columnas_asesor on asesores;
create trigger trg_proteger_columnas_asesor
  before update on asesores
  for each row
  execute function proteger_columnas_asesor();

-- ✅ A partir de aquí, un asesor solo puede editar desde el navegador:
-- nombre, telefono, fecha_nacimiento, numero_cuenta, clabe, titular_cuenta,
-- banco y foto_url. Todo lo demás (comisiones, estado, código, email,
-- user_id, tokens) solo lo puede cambiar una Edge Function con la clave
-- de servicio (activar-asesor, crear-asesor, o una futura función de admin).
