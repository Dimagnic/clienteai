import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLANES_VALIDOS = ['gratuito', 'pro', 'negocio']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = 'https://eevflmyoqwndobjkjuov.supabase.co'
    const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''

    // Cliente con la clave de servicio (para leer/escribir sin restricciones de RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // 1. Verificar quién está llamando, usando su propio JWT
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Verificar que ese usuario sea admin en la tabla perfiles
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('is_admin')
      .eq('user_id', userData.user.id)
      .single()

    if (perfilError || !perfil?.is_admin) {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Validar los datos recibidos
    const { negocio_id, nuevo_plan, dias_vigencia } = await req.json()

    if (!negocio_id || !PLANES_VALIDOS.includes(nuevo_plan)) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Aplicar el cambio (esto SÍ puede escribir plan/plan_expira_en porque
    // usa la clave de servicio, y ya verificamos que quien pide el cambio es admin)
    let plan_expira_en: string | null = null
    if (nuevo_plan === 'pro' || nuevo_plan === 'negocio') {
      const expira = new Date()
      expira.setDate(expira.getDate() + (dias_vigencia && dias_vigencia > 0 ? dias_vigencia : 30))
      plan_expira_en = expira.toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('negocios')
      .update({
        plan: nuevo_plan,
        plan_expira_en,
        notificacion_7dias_enviada: false,
        notificacion_80_enviada: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', negocio_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ ok: true, plan: nuevo_plan, plan_expira_en }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
