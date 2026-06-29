import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generarCodigo(supabase: any): Promise<string> {
  const anio = new Date().getFullYear()
  const { count } = await supabase.from('negocios').select('*', { count: 'exact', head: true })
  const num = String((count || 0) + 1).padStart(6, '0')
  let codigo = `CAI${anio}-CL${num}`
  let intento = 0
  while (true) {
    const { data } = await supabase.from('negocios').select('id').eq('codigo_cliente', codigo).maybeSingle()
    if (!data) break
    intento++
    codigo = `CAI${anio}-CL${String((count || 0) + 1 + intento).padStart(6, '0')}`
  }
  return codigo
}

function plantillaCorreo(nombre: string, codigo: string, email: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background:#f9fafb; padding: 32px 0;">
    <div style="background:#fff; border-radius: 16px; overflow:hidden; border:1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #16a34a, #166534); padding: 28px 32px; text-align:center;">
        <p style="color:#fff; font-size: 24px; font-weight: 900; margin:0;">ClienteAI</p>
        <p style="color:#bbf7d0; font-size: 12px; margin: 4px 0 0;">Bienvenido a tu asistente virtual con IA</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px; color:#111; margin:0 0 8px;">🎉 ¡Bienvenido a ClienteAI!</p>
        <p style="font-size: 14px; color:#374151; margin:0 0 20px;">Tu cuenta está lista. Aquí está tu código de acceso:</p>
        <div style="background:#f0fdf4; border:2px solid #16a34a; border-radius:10px; padding:16px; text-align:center; margin-bottom: 24px;">
          <p style="font-size: 11px; color:#6b7280; margin:0 0 4px;">TU CÓDIGO DE CLIENTE</p>
          <p style="font-family: monospace; font-size: 24px; font-weight: 900; color:#16a34a; margin:0; letter-spacing: 3px;">${codigo}</p>
        </div>
        <p style="font-size: 13px; color:#6b7280; margin:0 0 24px;">Entra con tu código + la contraseña que elegiste en <strong>clienteai.site/admin</strong></p>

        <div style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:24px;">
          <p style="font-size:14px; font-weight:700; color:#111; margin:0 0 16px;">🚀 Próximos pasos:</p>
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
            <span style="background:#16a34a; color:#fff; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">1</span>
            <div>
              <p style="font-size:13px; font-weight:600; color:#111; margin:0;">Configura tu asistente</p>
              <p style="font-size:12px; color:#6b7280; margin:4px 0 0;">Agrega el nombre, descripción, menú y horarios de tu negocio.</p>
            </div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
            <span style="background:#16a34a; color:#fff; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">2</span>
            <div>
              <p style="font-size:13px; font-weight:600; color:#111; margin:0;">Personaliza el widget</p>
              <p style="font-size:12px; color:#6b7280; margin:4px 0 0;">Elige el color y nombre de tu asistente para que combine con tu marca.</p>
            </div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
            <span style="background:#16a34a; color:#fff; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">3</span>
            <div>
              <p style="font-size:13px; font-weight:600; color:#111; margin:0;">Comparte tu enlace</p>
              <p style="font-size:12px; color:#6b7280; margin:4px 0 0;">Copia tu link directo o instala el widget en tu página web.</p>
            </div>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px;">
            <span style="background:#16a34a; color:#fff; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">4</span>
            <div>
              <p style="font-size:13px; font-weight:600; color:#111; margin:0;">¡Empieza a atender!</p>
              <p style="font-size:12px; color:#6b7280; margin:4px 0 0;">Tu asistente ya puede responder a tus clientes 24/7 de forma automática.</p>
            </div>
          </div>
        </div>

        <div style="text-align:center; margin-bottom:16px;">
          <a href="https://clienteai.site/admin" style="background:#16a34a; color:#fff; padding: 14px 32px; border-radius: 8px; text-decoration:none; font-weight:700; font-size: 15px; display:inline-block;">Ir a mi panel ahora →</a>
        </div>
        <p style="font-size:12px; color:#9ca3af; text-align:center; margin:0;">¿Tienes dudas? Escríbenos al <a href="https://wa.me/522219663226" style="color:#16a34a;">WhatsApp</a></p>
      </div>
      <div style="background:#f9fafb; padding: 16px 32px; border-top:1px solid #f3f4f6; text-align:center;">
        <p style="font-size: 11px; color:#9ca3af; margin:0;">ClienteAI · clienteai.site · Desarrollado por Cero+ Software</p>
      </div>
    </div>
  </div>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, ref } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Faltan email o password' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // Verificar si ya existe
    const { data: existente } = await supabase.from('negocios').select('id').eq('email_contacto', email).maybeSingle()
    if (existente) {
      return new Response(JSON.stringify({ error: 'Este correo ya tiene una cuenta registrada.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Crear usuario en auth
    const { data: creado, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw new Error(authError.message)

    // Buscar asesor por código de referido
    let asesor_id = null
    if (ref) {
      const { data: asesor } = await supabase.from('asesores').select('id').eq('codigo', ref.toUpperCase()).maybeSingle()
      if (asesor) asesor_id = asesor.id
    }

    // Generar código de cliente
    const codigo = await generarCodigo(supabase)
    const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
    const trialExpira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Crear negocio
    const { error: negocioError } = await supabase.from('negocios').insert({
      user_id: creado.user.id,
      nombre: 'Mi negocio',
      email_contacto: email,
      codigo_cliente: codigo,
      token,
      plan: 'gratuito',
      asistente_num: 1,
      asistente_nombre: 'Asistente 1',
      estado_cuenta: 'activo',
      activado_en: new Date().toISOString(),
      asesor_id,
      trial_expira_en: trialExpira,
      trial_activo: true,
    })
    if (negocioError) throw new Error(negocioError.message)

    // Enviar correo con código
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ClienteAI <noreply@clienteai.site>',
          to: [email],
          subject: `Tu código de acceso ClienteAI: ${codigo}`,
          html: plantillaCorreo('', codigo, email),
        }),
      })
    }

    return new Response(JSON.stringify({ ok: true, codigo }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})