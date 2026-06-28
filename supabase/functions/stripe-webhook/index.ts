import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const PRECIOS: Record<string, number> = { pro: 299, negocio: 599 }

async function verificarFirmaStripe(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = signature.split(',')
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1]
    if (!timestamp || !v1) return false

    const payload = `${timestamp}.${body}`
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
    const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
    return expected === v1
  } catch { return false }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature') || ''
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

    // Verificar firma de Stripe
    const firmaValida = await verificarFirmaStripe(body, signature, webhookSecret)
    if (!firmaValida) {
      return new Response(JSON.stringify({ error: 'Firma inválida' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const event = JSON.parse(body)
    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    // Pago inicial del plan
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const negocio_id = session.metadata?.negocio_id
      const plan = session.metadata?.plan

      if (negocio_id && plan) {
        const expira = new Date()
        expira.setMonth(expira.getMonth() + 1)
        await supabase.from('negocios').update({
          plan,
          plan_expira_en: expira.toISOString(),
          notificacion_7dias_enviada: false,
          notificacion_80_enviada: false,
          conversaciones_mes: 0,
          mes_actual: new Date().toISOString().slice(0, 7),
          updated_at: new Date().toISOString()
        }).eq('id', negocio_id)
        await registrarComision(supabase, negocio_id, plan, 'primer_mes')
      }
    }

    // Renovación mensual automática de Stripe
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const negocio_id = invoice.subscription_details?.metadata?.negocio_id
        || invoice.lines?.data?.[0]?.metadata?.negocio_id
      const plan = invoice.subscription_details?.metadata?.plan
        || invoice.lines?.data?.[0]?.metadata?.plan

      if (negocio_id && plan && invoice.billing_reason === 'subscription_cycle') {
        const expira = new Date()
        expira.setMonth(expira.getMonth() + 1)
        await supabase.from('negocios').update({
          plan_expira_en: expira.toISOString(),
          notificacion_7dias_enviada: false,
          notificacion_80_enviada: false,
          conversaciones_mes: 0,
          mes_actual: new Date().toISOString().slice(0, 7),
        }).eq('id', negocio_id)
        await registrarComision(supabase, negocio_id, plan, 'recurrente')
      }
    }

    // Suscripción cancelada
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const negocio_id = subscription.metadata?.negocio_id
      if (negocio_id) {
        await supabase.from('negocios').update({
          plan: 'gratuito',
          plan_expira_en: null,
          updated_at: new Date().toISOString()
        }).eq('id', negocio_id)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function registrarComision(supabase: any, negocio_id: string, plan: string, tipo: 'primer_mes' | 'recurrente') {
  const { data: negocio } = await supabase.from('negocios').select('asesor_id').eq('id', negocio_id).single()
  if (!negocio?.asesor_id) return

  const { data: asesor } = await supabase.from('asesores').select('comision_primer_mes, comision_recurrente, activo').eq('id', negocio.asesor_id).single()
  if (!asesor || !asesor.activo) return

  const montoPago = PRECIOS[plan] || 0
  if (montoPago === 0) return

  const porcentaje = tipo === 'primer_mes' ? asesor.comision_primer_mes : asesor.comision_recurrente
  const montoComision = Math.round((montoPago * porcentaje / 100) * 100) / 100
  const periodo = new Date().toISOString().slice(0, 7)

  await supabase.from('comisiones').insert({
    asesor_id: negocio.asesor_id,
    negocio_id,
    monto_pago: montoPago,
    tipo,
    porcentaje,
    monto_comision: montoComision,
    periodo,
    elegible: false,
    estado: 'pendiente',
  })
}