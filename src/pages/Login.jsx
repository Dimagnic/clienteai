import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'register') {
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
        if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.')

        const { data, error } = await supabase.functions.invoke('registrar-cliente', {
          body: { email, password, ref }
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)

        setCodigoGenerado(data.codigo)
        setSuccess(`¡Cuenta creada! Tu código de cliente es: ${data.codigo}. Te lo enviamos también por correo.`)
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      } else {
        // Login con código o correo directo
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
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
            <input
              className={s.input}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          {mode === 'register' && (
            <div className={s.field}>
              <label className={s.label}>Confirmar contraseña</label>
              <input
                className={s.input}
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
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