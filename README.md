# ✦ ClienteAI

Asistente de atención al cliente con IA para negocios pequeños en LATAM.

## Stack
- React + Vite
- Supabase (Auth + PostgreSQL + Edge Functions)
- Claude API (Anthropic) — claude-3-5-sonnet
- Stripe (pagos con suscripciones)
- Vercel (deploy)

---

## Instalación local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear archivo `.env` en la raíz
```
VITE_SUPABASE_URL=https://hwdxqddkiheewirgbsor.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

> La API key de Anthropic NO va en el `.env` del frontend. Va en las variables de entorno de Supabase Edge Functions.

### 3. Configurar Supabase

#### Base de datos
1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido de `supabase-setup.sql`

#### Variables de entorno en Edge Functions
En Supabase → Edge Functions → Secrets, agrega:
```
ANTHROPIC_API_KEY=sk-ant-tu_key
SB_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=sk_live_...
```

### 4. Activar admin
Después de registrarte con tu cuenta en la app, ejecuta en SQL Editor:
```sql
update perfiles set is_admin = true
where user_id = (select id from auth.users where email = 'tu@email.com');
```

### 5. Correr el proyecto
```bash
npm run dev
```

---

## Deploy en Vercel

1. Sube el repo a GitHub
2. Entra a [vercel.com](https://vercel.com) → New Project
3. Importa el repo
4. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

---

## Webhooks de Stripe

Para que el plan se actualice automáticamente después del pago:

1. En Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://hwdxqddkiheewirgbsor.supabase.co/functions/v1/stripe-webhook`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`

---

## Estructura del proyecto
```
src/
  lib/
    supabase.js        — cliente de Supabase
    claude.js          — llamada a Claude API (pasa negocio_id)
  pages/
    Landing.jsx        — página de ventas
    Login.jsx          — login / registro
    Dashboard.jsx      — panel principal (admin desde DB)
    Configurar.jsx     — configurar el bot
    Preview.jsx        — probar el bot (sin contar contra límites)
    Chat.jsx           — chat público embebible
    Precios.jsx        — página de precios
    Legal.jsx          — aviso legal
supabase/
  functions/
    ask-claude/        — Edge Function: llama a Claude, guarda conversaciones, controla límites
    stripe-checkout/   — Edge Function: crea sesión de pago en Stripe
    stripe-webhook/    — Edge Function: actualiza plan al completar pago (NUEVO)
```

---

## Fixes aplicados (vs versión original)

- **Bug crítico:** Eliminado el doble guardado de conversaciones (se guardaban 2 veces)
- **Bug crítico:** `negocio_id` ahora se pasa correctamente a la Edge Function para controlar límites de plan
- **Seguridad:** Admin verificado desde tabla `perfiles` en DB, no por email hardcodeado en el cliente
- **Stripe:** Nuevo webhook `stripe-webhook` que actualiza el plan automáticamente al pagar
- **Preview:** Vista previa no cuenta contra el límite de conversaciones del plan
- **Chat:** Respeta el `color` configurado por el negocio
- **Edge Function:** Usa `SUPABASE_URL` desde variable de entorno en lugar de URL hardcodeada
- **SQL:** Tabla `perfiles`, trigger de creación automática, función `increment_conversaciones`, políticas RLS corregidas

---

Hecho con ❤️ en Puebla, México 🇲🇽
