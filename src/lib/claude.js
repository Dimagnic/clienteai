import { supabase } from './supabase'

export async function askClaude({ messages, negocio_id = null, idioma = 'es' }) {
  // Nota: el "systemPrompt" ya no se manda desde el cliente. El servidor lo
  // reconstruye siempre a partir de los datos del negocio en la base de datos,
  // para evitar que alguien inyecte instrucciones arbitrarias llamando a la
  // función directamente. Solo se manda el idioma detectado del visitante.
  const { data, error } = await supabase.functions.invoke('ask-claude', {
    body: { messages, negocio_id, idioma },
  })

  if (error) throw new Error(error.message || 'Error al conectar con la IA')
  if (data.error) throw new Error(data.error)

  return data.text
}

export function buildSystemPrompt(negocio, idioma = 'es') {
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

export function detectarIdioma() {
  const lang = navigator.language || 'es'
  return lang.split('-')[0]
}
