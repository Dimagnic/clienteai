import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { codigo, password } = await req.json()

    if (!codigo || !password) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: codigo o password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    const codigoNormalizado = codigo.trim().toUpperCase()

    const { data: asesor, error: findError } = await supabase
      .from('asesores')
      .select('id, user_id, estado, nombre')
      .eq('codigo', codigoNormalizado)
      .maybeSingle()

    if (findError || !asesor) {
      return new Response(
        JSON.stringify({ error: 'Código de asesor no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (asesor.estado === 'activo') {
      return new Response(
        JSON.stringify({ error: 'Esta cuenta ya fue activada anteriormente. Usa el inicio de sesión normal.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar la contraseña del usuario en auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(asesor.user_id, { password })
    if (updateAuthError) throw updateAuthError

    // Marcar como activo
    const { error: updateAsesorError } = await supabase
      .from('asesores')
      .update({ estado: 'activo', activado_en: new Date().toISOString() })
      .eq('id', asesor.id)
    if (updateAsesorError) throw updateAsesorError

    return new Response(
      JSON.stringify({ ok: true, nombre: asesor.nombre }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
