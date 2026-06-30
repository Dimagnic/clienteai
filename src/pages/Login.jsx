import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const planParam = searchParams.get('plan')
  const [mode] = useState('register') // esta pagina solo registra; login real es en /admin
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [plan, setPlan] = useState(planParam && ['gratuito', 'pro', 'negocio'].includes(planParam) ? planParam : 'gratuito')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [recuperando, setRecuperando] = useState(false)

  async function recuperarPassword(e) {
    e.preventDefault()
    if (!emailRecuperar.trim()) { setError('Ingresa tu correo'); return }
    setRecuperando(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: 'https://clienteai.site/reset-password'
    })
    if (err) { setError('Error: ' + err.message) }
    else { setSuccess('Te enviamos un correo con el link para restablecer tu contraseña.'); setMostrarRecuperar(false) }
    setRecuperando(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setCodigoGenerado('')

    try {
      // Buscar asesor por código de referido si viene en la URL
      let asesor_id = null
      if (ref) {
        const { data: asesor } = await supabase.from('asesores').select('id').eq('codigo', ref.toUpperCase()).maybeSingle()
        if (asesor) asesor_id = asesor.id
      }

      // Mismo flujo exacto que usa el admin internamente: crear-cliente
      const { data, error } = await supabase.functions.invoke('crear-cliente', {
        body: {
          nombre,
          email,
          telefono: telefono || null,
          plan,
          asesor_id,
        }
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setCodigoGenerado(data.codigo)
      setSuccess(`¡Listo! Te enviamos un correo a ${email} con tu código de cliente y un enlace para activar tu cuenta. Revisa tu bandeja de entrada (y spam) para crear tu contraseña.`)
      setNombre('')
      setEmail('')
      setTelefono('')
      setPlan('gratuito')
    } catch (err) {
      const msg = err.message
      if (msg.includes('Ya existe')) setError('Ya existe un cliente con ese correo.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => navigate('/')}>← Inicio</button>
        <div className={s.logo}>✦ ClienteAI</div>

        <h1 className={s.title}>Crea tu cuenta gratis</h1>
        <p className={s.subtitle}>Sin tarjeta de crédito · Cancela cuando quieras</p>

        {ref && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>
            🎉 Registrándote con código de referido: <strong>{ref}</strong>
          </div>
        )}

        {codigoGenerado && (
          <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: 10, padding: '14px 18px', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px' }}>Tu código de cliente</p>
            <p style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#16a34a', margin: 0, letterSpacing: 2 }}>{codigoGenerado}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>Te lo enviamos también por correo. Úsalo cuando actives tu cuenta.</p>
          </div>
        )}

        {!codigoGenerado && (
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Nombre del negocio</label>
              <input
                className={s.input}
                type="text"
                placeholder="Ej: Tacos El Gordo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Correo electrónico</label>
              <input
                className={s.input}
                type="email"
                placeholder="tu@negocio.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Teléfono (opcional)</label>
              <input
                className={s.input}
                type="tel"
                placeholder="222-555-0134"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Plan</label>
              <select
                className={s.input}
                value={plan}
                onChange={e => setPlan(e.target.value)}
                disabled={loading}
                style={{ cursor: 'pointer' }}
              >
                <option value="gratuito">Plan Gratuito — $0/mes</option>
                <option value="pro">Plan Pro — $299/mes</option>
                <option value="negocio">Plan Negocio — $599/mes</option>
              </select>
            </div>

            {error && <div className={s.error}>{error}</div>}
            {success && <div className={s.successMsg}>{success}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 4 }}>
              <input type="checkbox" id="nobot" required style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }} />
              <label htmlFor="nobot" style={{ fontSize: 14, color: '#374151', cursor: 'pointer', userSelect: 'none' }}>No soy un robot 🤖</label>
            </div>

            <button className={s.btnSubmit} type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {codigoGenerado && (
          <>
            {error && <div className={s.error}>{error}</div>}
            {success && <div className={s.successMsg}>{success}</div>}
            <button className={s.btnSubmit} onClick={() => navigate('/admin')} style={{ marginTop: 8 }}>
              Ir a iniciar sesión
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Inicia sesión aquí
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: 4, fontSize: 13, color: '#6b7280' }}>
          ¿Olvidaste tu contraseña?{' '}
          <button onClick={() => setMostrarRecuperar(true)} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Recupérala aquí
          </button>
        </p>

        {mostrarRecuperar && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px', marginTop: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#15803d', margin: '0 0 12px' }}>Recuperar contraseña</p>
            <form onSubmit={recuperarPassword}>
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={emailRecuperar}
                onChange={e => setEmailRecuperar(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={recuperando} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  {recuperando ? 'Enviando...' : 'Enviar correo'}
                </button>
                <button type="button" onClick={() => setMostrarRecuperar(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}