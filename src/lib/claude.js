// ─────────────────────────────────────────────
// Llamada a Claude API
// En producción: mover a Supabase Edge Function
// ─────────────────────────────────────────────

export async function askClaude({ systemPrompt, messages }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Error al conectar con la IA')
  }

  const data = await response.json()
  return data.content[0].text
}

export function buildSystemPrompt(negocio) {
  return `Eres el asistente virtual de "${negocio.nombre}".
Responde siempre en español, de forma amable y concisa (máximo 3 líneas).
Solo responde sobre el negocio. Si te preguntan algo fuera de tu información, di amablemente que no tienes esa información.

${negocio.descripcion ? `DESCRIPCIÓN: ${negocio.descripcion}` : ''}
${negocio.menu ? `MENÚ / SERVICIOS:\n${negocio.menu}` : ''}
${negocio.horario ? `HORARIO: ${negocio.horario}` : ''}
${negocio.direccion ? `DIRECCIÓN: ${negocio.direccion}` : ''}
${negocio.telefono ? `TELÉFONO: ${negocio.telefono}` : ''}
${negocio.extra ? `INFORMACIÓN ADICIONAL:\n${negocio.extra}` : ''}

Siempre sé amable, breve y útil. Si el cliente quiere hacer un pedido o necesita ayuda urgente, indícale que puede llamar o escribir directamente.`
}
