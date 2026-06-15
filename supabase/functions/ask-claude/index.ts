import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LIMITES: Record<string, number> = { gratuito: 50, pro: 2000, negocio: 5000 }

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
        .select('plan, conversaciones_mes, mes_actual')
        .eq('id', negocio_id)
        .single()

      if (negocio) {
        const mesActual = new Date().toISOString().slice(0, 7)
        if (negocio.mes_actual !== mesActual) {
          await supabase.from('negocios').update({ conversaciones_mes: 0, mes_actual: mesActual }).eq('id', negocio_id)
          negocio.conversaciones_mes = 0
        }
        const limite = LIMITES[negocio.plan] || 50
        if ((negocio.conversaciones_mes || 0) >= limite) {
          return new Response(
            JSON.stringify({ error: `Limite de ${limite} conversaciones del mes alcanzado. Actualiza tu plan para continuar.` }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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
        model: 'claude-3-5-sonnet-20241022',
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
      await supabase.rpc('increment_conversaciones', { p_negocio_id: negocio_id })
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
