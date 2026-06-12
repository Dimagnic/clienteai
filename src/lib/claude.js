import { supabase } from './supabase'

export async function askClaude({ systemPrompt, messages }) {
  const { data, error } = await supabase.functions.invoke('ask-claude', {
    body: { systemPrompt, messages },
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