import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMITES: Record<string, number | null> = { gratuito: 50, pro: 2000, negocio: null }

// System prompt fijo para el demo público de la landing (nadie autenticado,
// nadie con negocio_id). Nunca se usa texto libre enviado por el cliente.
const SISTEMA_DEMO = `Eres el asistente virtual de ClienteAI, una plataforma que permite a negocios crear asistentes de IA en 10 minutos.
Responde siempre en español, amable y conciso (maximo 3 lineas).

SOBRE CLIENTEAI:
- Crea un asistente virtual para tu negocio en 10 minutos
- Sin codigo, sin complicaciones
- Widget embebible para tu pagina web
- Link directo para compartir por WhatsApp
- Planes desde $0 MXN (gratuito con 50 conversaciones/mes)
- Plan Pro: $299 MXN/mes - conversaciones ilimitadas
- Plan Negocio: $599 MXN/mes - 3 asistentes, reportes mensuales
- Funciona con cualquier tipo de negocio: restaurantes, salones, consultorios, tiendas, etc.
- Atiende a tus clientes 24/7 automaticamente
- Dashboard con estadisticas de conversaciones
- Modo oscuro/claro incluido
- Soporte en español

Si el visitante quiere registrarse, indicale que haga clic en "Empezar gratis" en la parte superior.
Si tiene dudas sobre precios, menciona los planes disponibles.`

function buildSystemPromptServidor(negocio: any, idioma = 'es'): string {
  const instruccionIdioma = idioma === 'es'
    ? 'Responde siempre en español, de forma amable y concisa (maximo 3 lineas).'
    : `Respond always in ${idioma === 'en' ? 'English' : idioma === 'fr' ? 'French' : idioma === 'pt' ? 'Portuguese' : 'the same language the user writes in'}, friendly and concise (max 3 lines).`

  return `Eres el asistente virtual de "${negocio.nombre}".
${instruccionIdioma}
Solo responde sobre el negocio. Si te preguntan algo fuera de tu informacion, di amablemente que no tienes esa informacion.

${negocio.descripcion ? `DESCRIPCION: ${negocio.descripcion}` : ''}
${negocio.menu ? `MENU / SERVICIOS:\n${negocio.menu}` : ''}
${negocio.horario ? `HORARIO: ${negocio.horario}` : ''}
${negocio.direccion ? `DIRECCION: ${negocio.direccion}` : ''}
${negocio.telefono ? `TELEFONO: ${negocio.telefono}` : ''}
${negocio.extra ? `INFORMACION ADICIONAL:\n${negocio.extra}` : ''}

Siempre se amable, breve y util. Si el cliente quiere hacer un pedido o necesita ayuda urgente, indicale que puede llamar o escribir directamente.`
}

async function enviarCorreo(resendKey: string, to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'ClienteAI <noreply@clienteai.site>', to: [to], subject, html }),
  }).catch(() => {})
}

// Rate limiting simple por IP (nota: se resetea si la función "duerme" y
// no protege contra IPs falsificadas — es una barrera adicional, no la unica)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const LIMITE_CON_NEGOCIO = 30   // req/min: uso normal del widget/chat
const LIMITE_SIN_NEGOCIO = 8    // req/min: demo publico de landing, sin dueño identificado

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const messagesCrudos: { role: string; content: string }[] = Array.isArray(body.messages) ? body.messages : []
    // Límites defensivos de tamaño: evita que una sola petición mande un
    // historial enorme y consuma muchos tokens de golpe, aunque esté
    // dentro del límite de peticiones por minuto.
    const messages = messagesCrudos
      .slice(-20)
      .map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, 4000) }))
    const negocio_id: string | null = body.negocio_id || null
    const idioma: string = typeof body.idioma === 'string' ? body.idioma.slice(0, 5) : 'es'

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // Identidad de quien llama (si mandó su sesión) — solo se usa para
    // permitir el modo "vista previa" del propio dueño del negocio.
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    let usuarioId: string | null = null
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt)
      usuarioId = userData?.user?.id ?? null
    }

    // Rate limit por IP: más estricto si no hay negocio_id (tráfico anónimo/demo)
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const claveLimite = `${ip}:${negocio_id ? 'con' : 'sin'}`
    const tope = negocio_id ? LIMITE_CON_NEGOCIO : LIMITE_SIN_NEGOCIO
    const ahoraMs = Date.now()
    const limite = requestCounts.get(claveLimite)
    if (limite) {
      if (ahoraMs < limite.resetAt) {
        if (limite.count >= tope) {
          return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta en un momento.' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        limite.count++
      } else {
        requestCounts.set(claveLimite, { count: 1, resetAt: ahoraMs + 60000 })
      }
    } else {
      requestCounts.set(claveLimite, { count: 1, resetAt: ahoraMs + 60000 })
    }

    // El systemPrompt NUNCA se toma del body del cliente. Se reconstruye
    // siempre en el servidor a partir de datos ya validados, según el caso:
    let systemPrompt: string = SISTEMA_DEMO

    if (negocio_id) {
      const { data: negocio } = await supabase
        .from('negocios')
        .select('plan, conversaciones_mes, trial_expira_en, plan_expira_en, email_contacto, nombre, notificacion_7dias_enviada, notificacion_80_enviada, descripcion, menu, horario, direccion, telefono, extra')
        .eq('id', negocio_id)
        .single()

      if (!negocio) {
        return new Response(JSON.stringify({ error: 'Negocio no encontrado' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Caso 1: hay negocio_id -> chat real (widget público o link directo)
      systemPrompt = buildSystemPromptServidor(negocio, idioma)

      if (negocio) {
        const ahora = new Date()
        const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''

        // NOTA DE DISEÑO: conversaciones_mes ya NO se resetea por mes de
        // calendario. Los únicos resets válidos son:
        //   - Plan gratuito: nunca se resetea durante el trial — son 50
        //     conversaciones TOTALES en la ventana de 30 días, no 50/mes.
        //   - Plan pro/negocio: se resetea únicamente cuando Stripe confirma
        //     una renovación real (ver stripe-webhook, evento invoice.paid),
        //     así el período de 2,000 conversaciones queda atado a la fecha
        //     real de pago del cliente, no al día 1 del mes calendario.

        // ===== PLAN GRATUITO =====
        if (negocio.plan === 'gratuito') {
          if (negocio.trial_expira_en && ahora > new Date(negocio.trial_expira_en)) {
            return new Response(JSON.stringify({
              error: 'trial_vencido',
              mensaje: 'Tu período de prueba gratuito de 30 días ha vencido. Actualiza tu plan en clienteai.site para reactivar tu asistente.'
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
          if ((negocio.conversaciones_mes || 0) >= 50) {
            return new Response(JSON.stringify({
              error: 'limite_alcanzado',
              mensaje: 'Has alcanzado el límite de 50 conversaciones de tu prueba gratuita. Actualiza al Plan Pro para continuar.'
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
        }

        // ===== PLAN PRO Y NEGOCIO =====
        if (negocio.plan === 'pro' || negocio.plan === 'negocio') {
          // SEGURIDAD: sin fecha de vencimiento no hay pago confirmado por Stripe.
          // Nunca se debe tratar como acceso ilimitado por ausencia de dato.
          if (!negocio.plan_expira_en) {
            return new Response(JSON.stringify({
              error: 'plan_no_confirmado',
              mensaje: `Tu Plan ${negocio.plan === 'pro' ? 'Pro' : 'Negocio'} aún no tiene un pago confirmado. Completa tu pago en clienteai.site para activar tu asistente.`
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

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
    } else if (usuarioId) {
      // Caso 2: sin negocio_id pero CON sesión válida -> "vista previa" del
      // propio dueño probando su asistente. Se busca SU negocio, nunca uno ajeno.
      const { data: negocioPropio } = await supabase
        .from('negocios')
        .select('nombre, descripcion, menu, horario, direccion, telefono, extra')
        .eq('user_id', usuarioId)
        .order('asistente_num', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!negocioPropio) {
        return new Response(JSON.stringify({ error: 'No se encontró un negocio asociado a tu cuenta' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      systemPrompt = buildSystemPromptServidor(negocioPropio, idioma)
    }
    // Caso 3: sin negocio_id y sin sesión -> demo público de la landing.
    // systemPrompt queda como SISTEMA_DEMO (fijo), no se toca nada más.

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
    console.error('ask-claude error:', error)
    return new Response(
      JSON.stringify({ error: 'No se pudo procesar tu mensaje. Intenta de nuevo.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
