import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const PRECIOS: Record<string, number> = { pro: 299, negocio: 599 }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const event = JSON.parse(body)

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const negocio_id = session.metadata?.negocio_id
      const plan = session.metadata?.plan

      if (negocio_id && plan) {
        const renuevaEn = new Date()
        renuevaEn.setMonth(renuevaEn.getMonth() + 1)
        await supabase.from('negocios').update({ plan, plan_renueva_en: renuevaEn.toISOString(), updated_at: new Date().toISOString() }).eq('id', negocio_id)
        await registrarComision(supabase, negocio_id, plan, 'primer_mes')
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const negocio_id = invoice.subscription_details?.metadata?.negocio_id || invoice.lines?.data?.[0]?.metadata?.negocio_id
      const plan = invoice.subscription_details?.metadata?.plan || invoice.lines?.data?.[0]?.metadata?.plan
      if (negocio_id && plan && invoice.billing_reason === 'subscription_cycle') {
        const renuevaEn = new Date()
        renuevaEn.setMonth(renuevaEn.getMonth() + 1)
        await supabase.from('negocios').update({ plan_renueva_en: renuevaEn.toISOString() }).eq('id', negocio_id)
        await registrarComision(supabase, negocio_id, plan, 'recurrente')
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const negocio_id = subscription.metadata?.negocio_id
      if (negocio_id) {
        await supabase.from('negocios').update({ plan: 'gratuito', updated_at: new Date().toISOString() }).eq('id', negocio_id)
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
  const { data: negocio } = await supabase
    .from('negocios')
    .select('asesor_id')
    .eq('id', negocio_id)
    .single()

  if (!negocio?.asesor_id) return

  const { data: asesor } = await supabase
    .from('asesores')
    .select('comision_primer_mes, comision_recurrente, activo')
    .eq('id', negocio.asesor_id)
    .single()

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
