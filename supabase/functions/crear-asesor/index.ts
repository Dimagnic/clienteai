import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generarCodigo(nombre: string, apellido: string, fechaNacimiento: string): string {
  const anioActual = new Date().getFullYear()
  const [anio, mes, dia] = fechaNacimiento.split('-')
  const inicialNombre = (nombre.trim()[0] || 'X').toUpperCase()
  const inicialApellido = (apellido.trim()[0] || 'X').toUpperCase()
  const dd = dia.padStart(2, '0')
  const mm = mes.padStart(2, '0')
  const yy = anio.slice(-2)
  return `CAI${anioActual}-${inicialNombre}${inicialApellido}${dd}${mm}${yy}`
}

function plantillaCorreoActivacion(nombre: string, codigo: string, enlaceActivacion: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background:#f9fafb; padding: 32px 0;">
    <div style="background:#fff; border-radius: 16px; overflow:hidden; border:1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 28px 32px; text-align:center;">
        <p style="color:#fff; font-size: 24px; font-weight: 900; margin:0; letter-spacing: -0.5px;">ClienteAI</p>
        <p style="color:#e9d5ff; font-size: 12px; margin: 4px 0 0;">Programa de Asesores</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px; color:#111; margin:0 0 16px;">Hola ${nombre} 👋</p>
        <p style="font-size: 14px; color:#374151; line-height:1.6; margin:0 0 20px;">
          Has sido registrado como <strong>Asesor ClienteAI</strong>. Tu código de acceso es:
        </p>
        <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; padding:16px; text-align:center; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 20px; font-weight: 800; color:#6b21a8; margin:0; letter-spacing: 1px;">${codigo}</p>
        </div>
        <p style="font-size: 14px; color:#374151; line-height:1.6; margin:0 0 20px;">
          Para activar tu cuenta y crear tu contraseña, haz clic en el siguiente botón:
        </p>
        <div style="text-align:center; margin-bottom: 24px;">
          <a href="${enlaceActivacion}" style="background:#7c3aed; color:#fff; padding: 12px 28px; border-radius: 8px; text-decoration:none; font-weight:700; font-size: 14px; display:inline-block;">Activar mi cuenta</a>
        </div>
        <p style="font-size: 12px; color:#9ca3af; line-height:1.5; margin:0;">
          Guarda tu código de acceso, lo usarás cada vez que inicies sesión en clienteai.site.
        </p>
      </div>
      <div style="background:#f9fafb; padding: 16px 32px; border-top:1px solid #f3f4f6;">
        <p style="font-size: 11px; color:#9ca3af; margin:0; text-align:center;">
          Este correo fue enviado por ClienteAI · clienteai.site<br/>
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    </div>
  </div>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // SEGURIDAD: solo un administrador autenticado puede crear asesores.
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('is_admin')
      .eq('user_id', userData.user.id)
      .single()
    if (perfilError || !perfil?.is_admin) {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { nombre, apellido, email, telefono, fechaNacimiento } = await req.json()

    if (!nombre || !apellido || !email || !fechaNacimiento) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: nombre, apellido, email o fecha de nacimiento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nombreCompleto = `${nombre} ${apellido}`
    let codigo = generarCodigo(nombre, apellido, fechaNacimiento)

    let intento = 0
    let codigoFinal = codigo
    while (true) {
      const { data: existeCodigo } = await supabase.from('asesores').select('id').eq('codigo', codigoFinal).maybeSingle()
      if (!existeCodigo) break
      intento++
      codigoFinal = `${codigo}-${intento}`
    }
    codigo = codigoFinal

    const emailNormalizado = email.trim().toLowerCase()

    const { data: existente } = await supabase.from('asesores').select('id').eq('email', emailNormalizado).maybeSingle()
    if (existente) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un asesor con ese correo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const passwordTemporal = crypto.randomUUID() // password aleatorio temporal, el asesor lo cambia al activar

    const { data: creado, error: createError } = await supabase.auth.admin.createUser({
      email: emailNormalizado,
      password: passwordTemporal,
      email_confirm: true,
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Token SECRETO de activación: distinto del "codigo" (que se comparte
    // públicamente como link de referido). Solo viaja en el correo privado.
    const tokenActivacion = crypto.randomUUID().replace(/-/g, '')
    const tokenGeneradoEn = new Date().toISOString()

    const { error: insertError } = await supabase.from('asesores').insert({
      user_id: creado.user.id,
      nombre: nombreCompleto,
      email: emailNormalizado,
      telefono: telefono || null,
      fecha_nacimiento: fechaNacimiento,
      codigo,
      token_activacion: tokenActivacion,
      token_generado_en: tokenGeneradoEn,
      estado: 'pendiente',
    })

    if (insertError) throw insertError

    // Enviar correo de activación vía Resend (identidad = correo real; el
    // codigo queda solo como número de referencia y link de referido)
    const enlaceActivacion = `https://clienteai.site/activar-asesor?email=${encodeURIComponent(emailNormalizado)}&token=${encodeURIComponent(tokenActivacion)}`
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    let correoEnviado = false

    if (resendApiKey) {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ClienteAI <noreply@clienteai.site>',
          to: [emailNormalizado],
          subject: 'Activa tu cuenta de Asesor ClienteAI',
          html: plantillaCorreoActivacion(nombreCompleto, codigo, enlaceActivacion),
        }),
      })
      correoEnviado = resendResp.ok
    }

    return new Response(
      JSON.stringify({ ok: true, codigo, nombreCompleto, email: emailNormalizado, correoEnviado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('crear-asesor error:', error)
    return new Response(
      JSON.stringify({ error: 'No se pudo crear el asesor. Intenta de nuevo.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
