-- Permite el nuevo estado "bloqueada": se usa cuando se genera una comisión
-- para un asesor que aún no activó su cuenta. La comisión NO se pierde,
-- solo queda retenida hasta que el asesor active (ponga su contraseña).

alter table comisiones drop constraint if exists comisiones_estado_check;
alter table comisiones add constraint comisiones_estado_check
  check (estado in ('pendiente', 'bloqueada', 'aprobada', 'pagada', 'cancelada'));

-- Verificación
select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'comisiones_estado_check';
