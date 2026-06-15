import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

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
        await supabase.from('negocios').update({ plan, updated_at: new Date().toISOString() }).eq('id', negocio_id)
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
