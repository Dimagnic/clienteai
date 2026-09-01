import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, token } = await req.json()

    if (!email || !password || !token) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: email, token o password' }),
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

    const emailNormalizado = email.trim().toLowerCase()

    const { data: asesor, error: findError } = await supabase
      .from('asesores')
      .select('id, user_id, estado, nombre, token_activacion')
      .eq('email', emailNormalizado)
      .maybeSingle()

    if (findError || !asesor) {
      return new Response(
        JSON.stringify({ error: 'No encontramos una cuenta con ese correo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SEGURIDAD: el token secreto solo viaja en el link del correo privado
    // de activación, evitando que alguien active la cuenta en tu lugar.
    if (!asesor.token_activacion || asesor.token_activacion !== token) {
      return new Response(
        JSON.stringify({ error: 'Enlace de activación inválido o expirado. Revisa el correo que te enviamos.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Marcar como activo e invalidar el token (de un solo uso)
    const { error: updateAsesorError } = await supabase
      .from('asesores')
      .update({ estado: 'activo', activado_en: new Date().toISOString(), token_activacion: null })
      .eq('id', asesor.id)
    if (updateAsesorError) throw updateAsesorError

    return new Response(
      JSON.stringify({ ok: true, nombre: asesor.nombre, email: emailNormalizado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
