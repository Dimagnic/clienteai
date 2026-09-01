import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, nuevaPassword, token } = await req.json()

    if (!email || !nuevaPassword || !token) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: email, token o nuevaPassword' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (nuevaPassword.length < 8) {
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

    const { data: negocio, error: findError } = await supabase
      .from('negocios')
      .select('id, user_id, estado_cuenta, nombre, token_activacion')
      .eq('email_contacto', emailNormalizado)
      .maybeSingle()

    if (findError || !negocio) {
      return new Response(
        JSON.stringify({ error: 'No encontramos una cuenta con ese correo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SEGURIDAD: el token secreto solo viaja en el link del correo privado
    // de activación, evitando que alguien active la cuenta en tu lugar.
    if (!negocio.token_activacion || negocio.token_activacion !== token) {
      return new Response(
        JSON.stringify({ error: 'Enlace de activación inválido o expirado. Revisa el correo que te enviamos.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (negocio.estado_cuenta === 'activo') {
      return new Response(
        JSON.stringify({ error: 'Esta cuenta ya fue activada. Usa el inicio de sesión normal.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Actualizar contraseña en auth
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(negocio.user_id, { password: nuevaPassword })
    if (updateAuthError) throw updateAuthError

    // Marcar cuenta como activa e invalidar el token (de un solo uso)
    const { error: updateError } = await supabase
      .from('negocios')
      .update({ estado_cuenta: 'activo', activado_en: new Date().toISOString(), token_activacion: null })
      .eq('id', negocio.id)
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ ok: true, nombre: negocio.nombre, email: emailNormalizado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})