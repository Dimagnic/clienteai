# ⚠️ Scripts históricos — NO ejecutar

Estos 3 archivos (`supabase-setup.sql`, `supabase-setup-actualizado.sql`,
`supabase-asesores.sql`) eran los scripts manuales que se corrían a mano en
el SQL Editor de Supabase antes de que el proyecto empezara a usar
migraciones versionadas (`supabase/migrations/`).

**Se movieron aquí solo como referencia histórica.** No representan el
estado real de la base de datos en producción y **no deben volver a
ejecutarse**, por dos razones:

1. `supabase-setup.sql` crea la política `"widget puede leer negocio por
   token" using (true)`, que exponía la tabla `negocios` completa
   (teléfonos, correos, tokens de otros negocios) a cualquiera. Esto se
   corrigió en `supabase/migrations/20260828090000_fix_exposicion_datos_negocios.sql`.
   Volver a correr el script viejo reintroduciría ese hueco de seguridad.

2. El estado real y auditable de la base de datos es siempre el resultado
   de aplicar, en orden, todas las migraciones en `supabase/migrations/`.
   Estos scripts sueltos ya no reflejan eso.

Si necesitás levantar un ambiente nuevo desde cero, usá:

```
supabase db push
```

parado en la raíz del proyecto (con el CLI ya vinculado al proyecto
correspondiente), y no estos archivos.
