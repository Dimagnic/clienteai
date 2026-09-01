-- Corrige una vulnerabilidad crítica de toma de cuenta: hasta ahora,
-- activar-cliente y activar-asesor solo pedían el "codigo" (predecible o
-- públicamente compartido) para poner una contraseña nueva. Cualquiera
-- que conociera/adivinara el código podía tomar la cuenta antes que el
-- dueño real. Se agrega un token secreto adicional, aleatorio, que solo
-- viaja por el correo privado de activación.

alter table negocios add column if not exists token_activacion text;
alter table asesores add column if not exists token_activacion text;
