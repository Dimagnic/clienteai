alter table negocios add column if not exists plan_expira_en timestamptz;
alter table negocios add column if not exists notificacion_7dias_enviada boolean default false;
alter table negocios add column if not exists notificacion_80_enviada boolean default false;