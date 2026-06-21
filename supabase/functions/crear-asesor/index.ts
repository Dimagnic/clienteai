import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { nombre, email, codigo } = await req.json()

    if (!nombre || !email || !codigo) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: nombre, email o codigo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Verificar que el email no esté ya registrado como asesor
    const { data: existente } = await supabase
      .from('asesores')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existente) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un asesor con ese correo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Invitar al usuario por correo (crea el usuario en auth.users y le manda el magic link de invitación)
    const { data: invitado, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://clienteai.site/asesor',
      data: { rol: 'asesor', nombre },
    })

    if (inviteError) {
      // Si el usuario ya existe en auth, lo buscamos para vincularlo igual
      const { data: usuarios } = await supabase.auth.admin.listUsers()
      const existenteAuth = usuarios?.users?.find((u) => u.email === email)
      if (!existenteAuth) {
        return new Response(
          JSON.stringify({ error: inviteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Crear el registro de asesor vinculado al usuario existente
      const { error: insertError } = await supabase.from('asesores').insert({
        user_id: existenteAuth.id,
        nombre,
        email,
        codigo,
      })
      if (insertError) throw insertError

      return new Response(
        JSON.stringify({ ok: true, nota: 'Usuario ya existía, se vinculó como asesor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Crear el registro de asesor vinculado al nuevo usuario invitado
    const { error: insertError } = await supabase.from('asesores').insert({
      user_id: invitado.user.id,
      nombre,
      email,
      codigo,
    })

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
