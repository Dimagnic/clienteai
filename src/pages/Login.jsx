import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const planParam = searchParams.get('plan')
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [nombre, setNombre] = useState('')
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

    try {
      if (mode === 'register') {
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.')

        const { data, error } = await supabase.functions.invoke('registrar-cliente', {
          body: { email, password, nombre, ref }
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)

        setCodigoGenerado(data.codigo)
        setSuccess(`¡Listo! Te enviamos un correo a ${email} con tu código de cliente y un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada (y spam) para activarla.`)
        setMode('login')
        setEmail('')
        setNombre('')
        setPassword('')
        setConfirmPassword('')
      } else {
        // Esta página solo es para registro. El login de clientes es por código en /admin.
        navigate('/admin')
        return
      }
    } catch (err) {
      const msg = err.message
      if (msg.includes('Invalid login')) setError('Correo o contraseña incorrectos.')
      else if (msg.includes('already registered')) setError('Este correo ya tiene una cuenta.')
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

        <h1 className={s.title}>
          {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratis'}
        </h1>
        <p className={s.subtitle}>
          {mode === 'login'
            ? 'Entra con tu correo y contraseña'
            : 'Sin tarjeta de crédito · Cancela cuando quieras'}
        </p>

        {ref && mode === 'register' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>
            🎉 Registrándote con código de referido: <strong>{ref}</strong>
          </div>
        )}

        {codigoGenerado && (
          <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: 10, padding: '14px 18px', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px' }}>Tu código de cliente</p>
            <p style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#16a34a', margin: 0, letterSpacing: 2 }}>{codigoGenerado}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>Guárdalo — lo necesitas para iniciar sesión</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={s.form}>
          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Nombre de tu negocio</label>
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
          )}
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
            <label className={s.label}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                className={s.input}
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 4 }}
                tabIndex={-1}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className={s.input}
                  type={mostrarConfirmar ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280', padding: 4 }}
                  tabIndex={-1}
                >
                  {mostrarConfirmar ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p style={{ fontSize: 12, margin: '6px 0 0', color: password === confirmPassword ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {password === confirmPassword ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                </p>
              )}
            </div>
          )}

          {error && <div className={s.error}>{error}</div>}
          {success && <div className={s.successMsg}>{success}</div>}

          {mode === 'register' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 4 }}>
              <input type="checkbox" id="nobot" required style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }} />
              <label htmlFor="nobot" style={{ fontSize: 14, color: '#374151', cursor: 'pointer', userSelect: 'none' }}>No soy un robot 🤖</label>
            </div>
          )}

          <button className={s.btnSubmit} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            ¿Olvidaste tu contraseña?{' '}
            <button onClick={() => setMostrarRecuperar(true)} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Recupérala aquí
            </button>
          </p>
        )}

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

        <p className={s.toggle}>
          {mode === 'login' ? '¿No tienes cuenta? ' : ''}
          {mode === 'login' && (
            <button className={s.toggleBtn} onClick={() => { setMode('register'); setError(''); setSuccess(''); setCodigoGenerado('') }}>
              Regístrate gratis
            </button>
          )}
        </p>
      </div>
    </div>
  )
}