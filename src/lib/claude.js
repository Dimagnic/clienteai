import { supabase } from './supabase'

export async function askClaude({ messages, negocio_id = null, idioma = 'es', sesion_id = null, cliente_nombre = null, cliente_telefono = null }) {
  // Nota: el "systemPrompt" ya no se manda desde el cliente. El servidor lo
  // reconstruye siempre a partir de los datos del negocio en la base de datos,
  // para evitar que alguien inyecte instrucciones arbitrarias llamando a la
  // función directamente. Solo se manda el idioma detectado del visitante.
  const { data, error } = await supabase.functions.invoke('ask-claude', {
    body: { messages, negocio_id, idioma, sesion_id, cliente_nombre, cliente_telefono },
  })

  if (error) throw new Error(error.message || 'Error al conectar con la IA')
  if (data.error) throw new Error(data.error)

  return data.text
}

export function detectarIdioma() {
  const lang = navigator.language || 'es'
  return lang.split('-')[0]
}
