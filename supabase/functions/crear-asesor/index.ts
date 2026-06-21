import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function generarCodigo(nombre: string, apellido: string, fechaNacimiento: string): string {
  // fechaNacimiento esperado en formato YYYY-MM-DD
  const [anio, mes, dia] = fechaNacimiento.split('-')
  const inicialNombre = (nombre.trim()[0] || 'X').toUpperCase()
  const inicialApellido = (apellido.trim()[0] || 'X').toUpperCase()
  const dd = dia.padStart(2, '0')
  const mm = mes.padStart(2, '0')
  const yy = anio.slice(-2)
  return `CAI2026-${inicialNombre}${inicialApellido}${dd}${mm}${yy}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { nombre, apellido, email, telefono, fechaNacimiento } = await req.json()

    if (!nombre || !apellido || !email || !fechaNacimiento) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos: nombre, apellido, email o fecha de nacimiento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      'https://eevflmyoqwndobjkjuov.supabase.co',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '',
    )

    const nombreCompleto = `${nombre} ${apellido}`
    let codigo = generarCodigo(nombre, apellido, fechaNacimiento)

    // Verificar unicidad del código; si ya existe, agregar sufijo numérico
    let intento = 0
    let codigoFinal = codigo
    while (true) {
      const { data: existeCodigo } = await supabase.from('asesores').select('id').eq('codigo', codigoFinal).maybeSingle()
      if (!existeCodigo) break
      intento++
      codigoFinal = `${codigo}-${intento}`
    }
    codigo = codigoFinal

    // Verificar que el email no esté ya registrado como asesor
    const { data: existente } = await supabase.from('asesores').select('id').eq('email', email).maybeSingle()
    if (existente) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un asesor con ese correo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const password = generarPassword()
    const emailSintetico = `${codigo.toLowerCase()}@asesores.clienteai.site`

    // Crear el usuario de autenticación con el correo SINTÉTICO (no el real)
    const { data: creado, error: createError } = await supabase.auth.admin.createUser({
      email: emailSintetico,
      password,
      email_confirm: true,
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear el registro de asesor
    const { error: insertError } = await supabase.from('asesores').insert({
      user_id: creado.user.id,
      nombre: nombreCompleto,
      email,
      telefono: telefono || null,
      codigo,
    })

    if (insertError) throw insertError

    // Enviar las credenciales al correo REAL del asesor
    // Nota: esto usa el sistema de correo de Supabase Auth a través de un magic link
    // con metadata que el frontend o un servicio de correo externo puede usar para mandar el código y password.
    // Como Supabase no permite mandar contraseñas en texto plano por su propio sistema de email,
    // devolvemos el código y password en la respuesta para que el admin se los comparta manualmente
    // o se conecte un servicio de email transaccional (Resend, SendGrid, etc.) en el futuro.

    return new Response(
      JSON.stringify({ ok: true, codigo, password, emailSintetico, nombreCompleto }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
