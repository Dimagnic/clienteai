import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { systemPrompt, messages, negocio_id } = await req.json()

    // Llamar a Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al conectar con Claude')
    }

    const reply = data.content[0].text

    // Guardar conversación en Supabase
    if (negocio_id) {
      const supabase = createClient(
        'https://hwdxqddkiheewirgbsor.supabase.co',
        Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
      )

      const lastUserMessage = messages[messages.length - 1]

      await supabase.from('conversaciones').insert([
        { negocio_id, mensaje: lastUserMessage.content, rol: 'user' },
        { negocio_id, mensaje: reply, rol: 'assistant' },
      ])
    }

    return new Response(
      JSON.stringify({ text: reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})