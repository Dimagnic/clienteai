import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generarCodigoCliente(supabase: any): Promise<string> {
  const anio = new Date().getFullYear()
  const { count } = await supabase.from('negocios').select('*', { count: 'exact', head: true })
  const num = String((count || 0) + 1).padStart(6, '0')
  let codigo = `CAI${anio}-CL${num}`
  // Asegurar unicidad
  let intento = 0
  while (true) {
    const { data } = await supabase.from('negocios').select('id').eq('codigo_cliente', codigo).maybeSingle()
    if (!data) break
    intento++
    codigo = `CAI${anio}-CL${String((count || 0) + 1 + intento).padStart(6, '0')}`
  }
  return codigo
}

function plantillaCorreoCliente(nombre: string, codigo: string, enlaceActivacion: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background:#f9fafb; padding: 32px 0;">
    <div style="background:#fff; border-radius: 16px; overflow:hidden; border:1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #16a34a, #166534); padding: 28px 32px; text-align:center;">
        <p style="color:#fff; font-size: 24px; font-weight: 900; margin:0; letter-spacing: -0.5px;">ClienteAI</p>
        <p style="color:#bbf7d0; font-size: 12px; margin: 4px 0 0;">Bienvenido a tu asistente virtual con IA</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px; color:#111; margin:0 0 16px;">Hola ${nombre} 👋</p>
        <p style="font-size: 14px; color:#374151; line-height:1.6; margin:0 0 20px;">
          Tu cuenta en <strong>ClienteAI</strong> ha sido creada. Tu código de acceso es:
        </p>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px; text-align:center; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 20px; font-weight: 800; color:#16a34a; margin:0; letter-spacing: 1px;">${codigo}</p>
        </div>
        <p style="font-size: 14px; color:#374151; line-height:1.6; margin:0 0 20px;">
          Para activar tu cuenta y crear tu contraseña, haz clic en el siguiente botón:
        </p>
        <div style="text-align:center; margin-bottom: 24px;">
          <a href="${enlaceActivacion}" style="background:#16a34a; color:#fff; padding: 12px 28px; border-radius: 8px; text-decoration:none; font-weight:700; font-size: 14px; display:inline-block;">Activar mi cuenta</a>
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
    const { nombre, email, telefono, plan, asesor_id } = await req.json()

    if (!nombre || !email) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: nombre y email son obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // Verificar que no exista el email
    const { data: existente } = await supabase.from('negocios').select('id').eq('email_contacto', email).maybeSingle()
    if (existente) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un cliente con ese correo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const codigo = await generarCodigoCliente(supabase)
    const emailSintetico = `${codigo.toLowerCase().replace(/-/g, '.')}@clientes.clienteai.site`
    const passwordTemporal = crypto.randomUUID()

    const { data: creado, error: createError } = await supabase.auth.admin.createUser({
      email: emailSintetico,
      password: passwordTemporal,
      email_confirm: true,
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

    const { error: insertError } = await supabase.from('negocios').insert({
      user_id: creado.user.id,
      nombre,
      email_contacto: email,
      telefono: telefono || null,
      plan: plan || 'gratuito',
      asesor_id: asesor_id || null,
      codigo_cliente: codigo,
      token,
      estado_cuenta: 'pendiente',
    })

    if (insertError) throw insertError

    // Enviar correo de activación
    const enlaceActivacion = `https://clienteai.site/activar-cliente?codigo=${encodeURIComponent(codigo)}`
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
          to: [email],
          subject: 'Activa tu cuenta en ClienteAI',
          html: plantillaCorreoCliente(nombre, codigo, enlaceActivacion),
        }),
      })
      correoEnviado = resendResp.ok
    }

    return new Response(
      JSON.stringify({ ok: true, codigo, nombre, correoEnviado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})