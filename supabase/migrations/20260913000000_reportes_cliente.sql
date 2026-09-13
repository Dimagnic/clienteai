-- Agrega datos del cliente y agrupacion por sesion de chat, para poder
-- generar reportes por dia con nombre, telefono y conversacion completa.
alter table conversaciones add column if not exists sesion_id uuid;
alter table conversaciones add column if not exists cliente_nombre text;
alter table conversaciones add column if not exists cliente_telefono text;

create index if not exists idx_conversaciones_sesion on conversaciones(negocio_id, sesion_id);