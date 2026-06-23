import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICES = {
  pro: 'price_1Tl2eDAu44j0iikUgex1aLMr',
  negocio: 'price_1Tl2g0Au44j0iikUR8K6taWt',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { plan, negocio_id, success_url, cancel_url } = await req.json()
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    const priceId = PRICES[plan]

    if (!priceId) throw new Error('Plan no valido')

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': success_url + '?session_id={CHECKOUT_SESSION_ID}&plan=' + plan + '&negocio_id=' + negocio_id,
        'cancel_url': cancel_url,
        'metadata[negocio_id]': negocio_id,
        'metadata[plan]': plan,
      })
    })

    const session = await response.json()
    if (!response.ok) throw new Error(session.error?.message || 'Error en Stripe')

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})