import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMITES: Record<string, number | null> = { gratuito: 50, pro: 2000, negocio: null }

async function enviarCorreo(resendKey: string, to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'ClienteAI <noreply@clienteai.site>', to: [to], subject, html }),
  }).catch(() => {})
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const systemPrompt: string = body.systemPrompt || ''
    const messages: { role: string; content: string }[] = body.messages || []
    const negocio_id: string | null = body.negocio_id || null

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    if (negocio_id) {
      const { data: negocio } = await supabase
        .from('negocios')
        .select('plan, conversaciones_mes, mes_actual, trial_expira_en, plan_expira_en, email_contacto, nombre, notificacion_7dias_enviada, notificacion_80_enviada')
        .eq('id', negocio_id)
        .single()

      if (negocio) {
        const ahora = new Date()
        const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
        const mesActual = ahora.toISOString().slice(0, 7)

        // Resetear conversaciones al nuevo mes
        if (negocio.mes_actual !== mesActual) {
          await supabase.from('negocios').update({ 
            conversaciones_mes: 0, 
            mes_actual: mesActual,
            notificacion_80_enviada: false,
          }).eq('id', negocio_id)
          negocio.conversaciones_mes = 0
          negocio.notificacion_80_enviada = false
        }

        // ===== PLAN GRATUITO =====
        if (negocio.plan === 'gratuito') {
          if (negocio.trial_expira_en && ahora > new Date(negocio.trial_expira_en)) {
            return new Response(JSON.stringify({ 
              error: 'trial_vencido',
              mensaje: 'Tu período de prueba gratuito ha vencido. Actualiza tu plan en clienteai.site para reactivar tu asistente.'
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
          if ((negocio.conversaciones_mes || 0) >= 50) {
            return new Response(JSON.stringify({ 
              error: 'limite_alcanzado',
              mensaje: 'Has alcanzado el límite de 50 conversaciones del mes. Actualiza al Plan Pro para continuar.'
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
        }

        // ===== PLAN PRO Y NEGOCIO =====
        if (negocio.plan === 'pro' || negocio.plan === 'negocio') {
          if (negocio.plan_expira_en) {
            const expira = new Date(negocio.plan_expira_en)
            const diasRestantes = Math.ceil((expira.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

            // Bot vencido - detener
            if (ahora > expira) {
              return new Response(JSON.stringify({ 
                error: 'plan_vencido',
                mensaje: `Tu Plan ${negocio.plan === 'pro' ? 'Pro' : 'Negocio'} ha vencido. Renueva en clienteai.site para reactivar tu asistente.`
              }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Notificación 7 días antes
            if (diasRestantes <= 7 && !negocio.notificacion_7dias_enviada && negocio.email_contacto) {
              await supabase.from('negocios').update({ notificacion_7dias_enviada: true }).eq('id', negocio_id)
              await enviarCorreo(resendKey, negocio.email_contacto,
                `⏰ Tu Plan ${negocio.plan === 'pro' ? 'Pro' : 'Negocio'} vence en ${diasRestantes} días`,
                `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 0">
                  <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
                    <p style="font-size:24px;font-weight:900;color:#16a34a;margin:0 0 16px">ClienteAI</p>
                    <p style="font-size:16px;color:#111;margin:0 0 12px">⏰ Hola ${negocio.nombre},</p>
                    <p style="font-size:14px;color:#374151;margin:0 0 16px">Tu <strong>Plan ${negocio.plan === 'pro' ? 'Pro ($299/mes)' : 'Negocio ($599/mes)'}</strong> vence en <strong>${diasRestantes} días</strong> (${expira.toLocaleDateString('es-MX')}).</p>
                    <p style="font-size:14px;color:#374151;margin:0 0 20px">Para no interrumpir la atención a tus clientes, renueva tu plan antes de que venza.</p>
                    <a href="https://clienteai.site/dashboard" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;margin-bottom:12px">Renovar mi plan</a>
                    ${negocio.plan === 'pro' ? `<p style="font-size:13px;color:#6b7280;margin:12px 0 0">¿Quieres más? Migra al <strong>Plan Negocio ($599/mes)</strong> y obtén conversaciones ilimitadas y 3 asistentes virtuales.</p>` : ''}
                  </div>
                </div>`
              )
            }
          }

          // Límite conversaciones Plan Pro
          if (negocio.plan === 'pro' && (negocio.conversaciones_mes || 0) >= 2000) {
            return new Response(JSON.stringify({ 
              error: 'limite_alcanzado',
              mensaje: 'Has alcanzado el límite de 2,000 conversaciones del mes. Renueva tu plan o migra al Plan Negocio para conversaciones ilimitadas.'
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          // Notificación 80% Plan Pro
          if (negocio.plan === 'pro' && !negocio.notificacion_80_enviada && negocio.email_contacto) {
            const usadas = negocio.conversaciones_mes || 0
            const porcentaje = (usadas / 2000) * 100
            if (porcentaje >= 80) {
              await supabase.from('negocios').update({ notificacion_80_enviada: true }).eq('id', negocio_id)
              await enviarCorreo(resendKey, negocio.email_contacto,
                '⚠️ Has usado el 80% de tus conversaciones del mes',
                `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 0">
                  <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
                    <p style="font-size:24px;font-weight:900;color:#16a34a;margin:0 0 16px">ClienteAI</p>
                    <p style="font-size:16px;color:#111;margin:0 0 12px">⚠️ Hola ${negocio.nombre},</p>
                    <p style="font-size:14px;color:#374151;margin:0 0 16px">Has usado <strong>${usadas} de 2,000 conversaciones</strong> este mes (${Math.round(porcentaje)}%).</p>
                    <p style="font-size:14px;color:#374151;margin:0 0 20px">Considera migrar al <strong>Plan Negocio ($599/mes)</strong> para obtener conversaciones ilimitadas.</p>
                    <a href="https://clienteai.site/dashboard" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">Ver mis opciones</a>
                  </div>
                </div>`
              )
            }
          }
        }
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: messages.length > 0
          ? messages.map((m) => ({ role: m.role, content: m.content }))
          : [{ role: 'user', content: 'hola' }],
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Error al conectar con Claude')

    const reply = data.content[0].text

    if (negocio_id && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]
      await supabase.from('conversaciones').insert([
        { negocio_id, mensaje: lastUserMessage.content, rol: 'user' },
        { negocio_id, mensaje: reply, rol: 'assistant' },
      ])
      const { data: neg } = await supabase.from('negocios').select('conversaciones_mes').eq('id', negocio_id).single()
      await supabase.from('negocios').update({ conversaciones_mes: (neg?.conversaciones_mes || 0) + 1 }).eq('id', negocio_id)
    }

    return new Response(
      JSON.stringify({ text: reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})