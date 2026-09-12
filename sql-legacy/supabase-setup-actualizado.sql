-- =============================================================
-- Actualización de esquema base: columnas usadas por el código que
-- no estaban declaradas en NINGÚN archivo del proyecto (ni en
-- supabase-setup.sql, ni en supabase-asesores.sql, ni en ninguna
-- migración de supabase/migrations/) — 6 en "negocios", 3 en
-- "asesores". Probablemente se agregaron en algún momento directo
-- desde el SQL Editor de Supabase, sin dejar registro en el
-- repositorio.
--
-- CÓMO USAR ESTE ARCHIVO:
-- Si armás un ambiente nuevo desde cero, ejecutá en este orden:
--   1. supabase-setup.sql
--   2. supabase-asesores.sql
--   3. ESTE ARCHIVO
--   4. Todo lo que hay en supabase/migrations/, en orden por fecha
--
-- Es seguro correr esto en la base actual de producción: usa
-- "add column if not exists" en todos los casos, así que si la
-- columna ya existe (como en producción, donde ya están las 9),
-- no hace nada — no duplica ni pisa datos.
-- =============================================================

alter table negocios add column if not exists email_contacto text;
alter table negocios add column if not exists asistente_num integer default 1;
alter table negocios add column if not exists asistente_nombre text default 'Asistente 1';
alter table negocios add column if not exists stripe_subscription_id text;
alter table negocios add column if not exists trial_expira_en timestamptz;
alter table negocios add column if not exists trial_activo boolean default true;

alter table asesores add column if not exists numero_cuenta text;
alter table asesores add column if not exists clabe text;
alter table asesores add column if not exists foto_url text;

-- Verificación: debería devolver 0 filas si el esquema ya está al día.
select table_name, column_name
from (values
  ('negocios', 'email_contacto'), ('negocios', 'asistente_num'), ('negocios', 'asistente_nombre'),
  ('negocios', 'stripe_subscription_id'), ('negocios', 'trial_expira_en'), ('negocios', 'trial_activo'),
  ('asesores', 'numero_cuenta'), ('asesores', 'clabe'), ('asesores', 'foto_url')
) as esperadas(table_name, column_name)
where (table_name, column_name) not in (
  select table_name, column_name from information_schema.columns
  where table_name in ('negocios', 'asesores') and table_schema = 'public'
);
