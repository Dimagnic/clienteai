import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://clienteai.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICES: Record<string, string> = {
  pro: 'price_1U8k9VApo7QiorpoMIfy9nXG',
  negocio: 'price_1U8k77Apo7Qiorpo5V42AdtL',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Verificar que quien llama esté autenticado
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: userData, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { plan, negocio_id } = await req.json()
    const priceId = PRICES[plan]
    if (!priceId) throw new Error('Plan no valido')

    // 2. Verificar que el negocio_id pertenezca a este usuario autenticado
    // (nunca confiar en un negocio_id que venga del cliente sin verificar)
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('id')
      .eq('id', negocio_id)
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (negocioError || !negocio) {
      return new Response(JSON.stringify({ error: 'Negocio no autorizado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

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
        // 3. success_url / cancel_url fijas en el servidor, nunca vienen del
        // cliente (evita que alguien redirija el pago a un sitio de phishing)
        'success_url': `https://clienteai.site/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&negocio_id=${negocio_id}`,
        'cancel_url': 'https://clienteai.site/precios',
        'metadata[negocio_id]': negocio_id,
        'metadata[plan]': plan,
      })
    })

    const session = await response.json()
    if (!response.ok) throw new Error('Error al crear sesión de pago')

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('stripe-checkout error:', error)
    return new Response(
      JSON.stringify({ error: 'No se pudo procesar el pago' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
