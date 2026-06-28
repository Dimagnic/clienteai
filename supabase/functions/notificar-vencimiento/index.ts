import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { nombre, email, plan, expira_en } = await req.json()
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''

    if (!resendKey || !email) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const expira = new Date(expira_en)
    const diasRestantes = Math.ceil((expira.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const fechaStr = expira.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    const planNombre = plan === 'pro' ? 'Pro ($299/mes)' : plan === 'negocio' ? 'Negocio ($599/mes)' : 'Gratuito'
    const esPago = plan === 'pro' || plan === 'negocio'

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9fafb;padding:32px 0">
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#16a34a,#166534);padding:28px 32px;text-align:center">
          <p style="color:#fff;font-size:24px;font-weight:900;margin:0">ClienteAI</p>
          <p style="color:#bbf7d0;font-size:12px;margin:4px 0 0">Asistente virtual con Inteligencia Artificial</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px;color:#111;margin:0 0 16px">⏰ Hola ${nombre || 'Cliente'},</p>
          ${esPago
            ? `<p style="font-size:14px;color:#374151;margin:0 0 16px">Tu <strong>Plan ${planNombre}</strong> vence en <strong>${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</strong> (${fechaStr}).</p>
               <p style="font-size:14px;color:#374151;margin:0 0 20px">Para no interrumpir la atención a tus clientes, renueva tu plan antes de que venza.</p>
               <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px">
                 <p style="font-size:13px;color:#15803d;margin:0;font-weight:600">¿Quieres más por menos?</p>
                 ${plan === 'pro' ? `<p style="font-size:13px;color:#374151;margin:6px 0 0">Migra al <strong>Plan Negocio ($599/mes)</strong> y obtén conversaciones ilimitadas y 3 asistentes virtuales.</p>` : ''}
               </div>
               <a href="https://clienteai.site/dashboard" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;margin-bottom:8px">Renovar mi plan</a>`
            : `<p style="font-size:14px;color:#374151;margin:0 0 16px">Tu <strong>período de prueba gratuito</strong> vence en <strong>${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</strong> (${fechaStr}).</p>
               <p style="font-size:14px;color:#374151;margin:0 0 20px">Para seguir atendiendo a tus clientes automáticamente, elige un plan de pago antes de que se acabe tu prueba.</p>
               <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
                 <a href="https://clienteai.site/dashboard" style="background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;display:inline-block">Plan Pro — $299/mes</a>
                 <a href="https://clienteai.site/dashboard" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;display:inline-block">Plan Negocio — $599/mes</a>
               </div>`
          }
          <p style="font-size:12px;color:#9ca3af;margin:16px 0 0">Si ya renovaste tu plan, ignora este correo.</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
          <p style="font-size:11px;color:#9ca3af;margin:0">ClienteAI · clienteai.site · Desarrollado por Cero+ Software</p>
        </div>
      </div>
    </div>`

    const subject = esPago
      ? `⏰ Tu Plan ${plan === 'pro' ? 'Pro' : 'Negocio'} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`
      : `⏰ Tu prueba gratuita vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ClienteAI <noreply@clienteai.site>', to: [email], subject, html }),
    })

    if (!res.ok) throw new Error('Error enviando correo')

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})