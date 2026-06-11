# ✦ ClienteAI

Asistente de atención al cliente con IA para negocios pequeños en LATAM.

## Stack
- React + Vite
- Supabase (Auth + PostgreSQL)
- Claude API (Anthropic)
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
VITE_ANTHROPIC_API_KEY=sk-ant-tu_api_key_aqui
```

### 3. Configurar Supabase
1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido de `supabase-setup.sql`

### 4. Correr el proyecto
```bash
npm run dev
```

---

## Deploy en Vercel

1. Sube el repo a GitHub
2. Entra a [vercel.com](https://vercel.com) → New Project
3. Importa el repo
4. En **Environment Variables** agrega las 3 variables del `.env`
5. Deploy

---

## Estructura del proyecto
```
src/
  lib/
    supabase.js     — cliente de Supabase
    claude.js       — llamada a Claude API
  pages/
    Landing.jsx     — página de ventas
    Login.jsx       — login / registro
    Dashboard.jsx   — panel principal
    Configurar.jsx  — configurar el bot
    Preview.jsx     — probar el bot
```

---

## Cobro por transferencia (MVP)
Mientras integras Stripe, puedes cobrar así:
- BBVA / CLABE: tu número de cuenta
- Precio sugerido: $299 MXN/mes plan Starter
- Activa las cuentas manualmente desde Supabase Dashboard

---

Hecho con ❤️ en Puebla, México 🇲🇽
