-- =============================================
-- Migración: fixes de seguridad de la auditoría (03/sep/2026)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- =============================================

-- 1. Expiración de tokens de activación (clientes y asesores).
--    Sin esto, un link de activación viejo funciona para siempre.
alter table negocios add column if not exists token_generado_en timestamptz;
alter table asesores  add column if not exists token_generado_en timestamptz;

-- A las cuentas pendientes que ya existían les damos una ventana fresca de
-- 48h desde AHORA (si no, quedarían con el link vencido de inmediato).
update negocios set token_generado_en = now()
  where token_activacion is not null and token_generado_en is null;
update asesores set token_generado_en = now()
  where token_activacion is not null and token_generado_en is null;

-- 2. Tabla para detectar eventos duplicados de Stripe (evita registrar la
--    misma comisión dos veces o resetear el contador de conversaciones
--    más de una vez si Stripe reintenta el mismo webhook).
create table if not exists stripe_eventos_procesados (
  event_id text primary key,
  procesado_en timestamptz default now()
);

-- RLS: nadie necesita leer/escribir esta tabla desde el cliente, solo la
-- usa la función stripe-webhook con la clave de servicio (que ignora RLS).
alter table stripe_eventos_procesados enable row level security;

-- Limpieza opcional: podés borrar eventos de más de 30 días con un cron,
-- ya que Stripe no reintenta pasado ese tiempo. No es obligatorio.
