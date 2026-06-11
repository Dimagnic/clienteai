import { supabase } from './supabase'

export async function askClaude({ systemPrompt, messages }) {
  const { data, error } = await supabase.functions.invoke('ask-claude', {
    body: { systemPrompt, messages },
  })

  if (error) throw new Error(error.message || 'Error al conectar con la IA')
  if (data.error) throw new Error(data.error)

  return data.text
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

