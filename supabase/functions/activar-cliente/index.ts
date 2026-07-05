import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { codigo, nuevaPassword } = await req.json()

    if (!codigo || !nuevaPassword) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: codigo o nuevaPassword' }),
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

    const codigoNormalizado = codigo.trim().toUpperCase()

    const { data: negocio, error: findError } = await supabase
      .from('negocios')
      .select('id, user_id, estado_cuenta, nombre')
      .eq('codigo_cliente', codigoNormalizado)
      .maybeSingle()

    if (findError || !negocio) {
      return new Response(
        JSON.stringify({ error: 'Código de cliente no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Marcar cuenta como activa
    const { error: updateError } = await supabase
      .from('negocios')
      .update({ estado_cuenta: 'activo', activado_en: new Date().toISOString() })
      .eq('id', negocio.id)
    if (updateError) throw updateError

    // Obtener email sintético para el login automático
    const { data: authUser } = await supabase.auth.admin.getUserById(negocio.user_id)
    const emailSintetico = authUser?.user?.email || ''

    return new Response(
      JSON.stringify({ ok: true, nombre: negocio.nombre, emailSintetico }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})