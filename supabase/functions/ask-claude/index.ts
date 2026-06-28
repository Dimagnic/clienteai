import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMITES: Record<string, number | null> = { gratuito: 50, pro: 2000, negocio: null }

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
        .select('plan, conversaciones_mes, mes_actual, trial_expira_en, trial_activo, email_contacto, nombre')
        .eq('id', negocio_id)
        .single()

      if (negocio) {
        const mesActual = new Date().toISOString().slice(0, 7)
        if (negocio.mes_actual !== mesActual) {
          await supabase.from('negocios').update({ conversaciones_mes: 0, mes_actual: mesActual }).eq('id', negocio_id)
          negocio.conversaciones_mes = 0
        }

        // Verificar si el trial venció (solo plan gratuito)
        if (negocio.plan === 'gratuito' && negocio.trial_expira_en) {
          const ahora = new Date()
          const expira = new Date(negocio.trial_expira_en)
          if (ahora > expira) {
            return new Response(
              JSON.stringify({ error: 'Tu período de prueba gratuito ha vencido. Actualiza tu plan en clienteai.site para reactivar tu asistente.' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        const limite = LIMITES[negocio.plan]
        if (limite !== null && (negocio.conversaciones_mes || 0) >= limite) {
          return new Response(
            JSON.stringify({ error: `Límite de ${limite} conversaciones del mes alcanzado. Actualiza tu plan para continuar.` }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Notificación al 80% del límite
        if (limite !== null) {
          const usadas = negocio.conversaciones_mes || 0
          const porcentaje = (usadas / limite) * 100
          if (porcentaje >= 80 && porcentaje < 81 && negocio.email_contacto) {
            const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
            if (resendKey) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  from: 'ClienteAI <noreply@clienteai.site>',
                  to: [negocio.email_contacto],
                  subject: '⚠️ Tu asistente está al 80% de su límite mensual',
                  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 0">
                    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
                      <p style="font-size:24px;font-weight:900;color:#16a34a;margin:0 0 16px">ClienteAI</p>
                      <p style="font-size:16px;color:#111;margin:0 0 12px">⚠️ Hola ${negocio.nombre},</p>
                      <p style="font-size:14px;color:#374151;margin:0 0 16px">Tu asistente virtual ha usado <strong>${usadas} de ${limite} conversaciones</strong> este mes (${Math.round(porcentaje)}%).</p>
                      <p style="font-size:14px;color:#374151;margin:0 0 20px">Para no interrumpir la atención a tus clientes, te recomendamos actualizar tu plan antes de que se agote.</p>
                      <a href="https://clienteai.site/dashboard" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">Ver mis planes</a>
                    </div>
                  </div>`
                }),
              }).catch(() => {})
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
      await supabase.from('negocios').update({
        conversaciones_mes: (await supabase.from('negocios').select('conversaciones_mes').eq('id', negocio_id).single()).data?.conversaciones_mes + 1 || 1
      }).eq('id', negocio_id)
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