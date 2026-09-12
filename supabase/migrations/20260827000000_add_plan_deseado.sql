-- Guarda qué plan quiso el cliente al registrarse, SIN otorgarle acceso.
-- El acceso real (columna "plan") solo lo activa el webhook de Stripe tras un pago confirmado.
alter table negocios add column if not exists plan_deseado text;
