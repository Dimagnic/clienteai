import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function ActivarAsesor() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    const emailUrl = searchParams.get('email')
    if (emailUrl) setEmail(emailUrl)
    const tokenUrl = searchParams.get('token')
    if (tokenUrl) setToken(tokenUrl)
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return }
    if (!token.trim()) { setError('Falta el código de activación de tu correo. Usa el link completo que te enviamos, o pégalo abajo.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos y condiciones.'); return }

    setLoading(true)
    try {
      const { data, error: err } = await supabase.functions.invoke('activar-asesor', {
        body: { email: email.trim().toLowerCase(), password, token: token.trim() }
      })
      if (err) throw err
      if (data.error) throw new Error(data.error)

      // Importante: si el navegador ya tenía otra sesión abierta (un cliente,
      // otro asesor, o el admin), hay que cerrarla primero. Si no, el login
      // de abajo puede quedar "pisado" por la sesión vieja y el usuario
      // termina en el dashboard equivocado.
      await supabase.auth.signOut()

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      if (loginError) throw loginError

      setExito(true)
      setTimeout(() => navigate('/asesor'), 1500)
    } catch (err) {
      setError(err.message || 'No se pudo activar la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div className={s.page}>
        <div className={s.card} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h1 className={s.title}>¡Cuenta activada!</h1>
          <p className={s.subtitle}>Tu contraseña fue creada correctamente. Te llevaremos a tu panel de asesor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => navigate('/')}>← Inicio</button>
        <div className={s.logo}>ClienteAI</div>
        <h1 className={s.title}>Activa tu cuenta de asesor</h1>
        <p className={s.subtitle}>Crea tu contraseña para empezar a usar tu panel</p>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>Correo electrónico</label>
            <input
              className={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {!searchParams.get('token') && (
            <div className={s.field}>
              <label className={s.label}>Código de activación (del correo)</label>
              <input
                className={s.input}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Pega aquí el código largo de tu correo"
                disabled={loading}
              />
            </div>
          )}
          <div className={s.field}>
            <label className={s.label}>Crea tu contraseña</label>
            <input className={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} minLength={8} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirma tu contraseña</label>
            <input className={s.input} type="password" value={password2} onChange={e => setPassword2(e.target.value)} required disabled={loading} minLength={8} />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} disabled={loading} style={{ marginTop: 3 }} />
            <span>No soy un robot. Acepto los <a href="/legal" target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontWeight: 600 }}>términos y condiciones</a> y la política de comisiones del Programa de Asesores ClienteAI.</span>
          </label>

          {error && <div className={s.error}>{error}</div>}

          <button className={s.btnSubmit} type="submit" disabled={loading} style={{ background: '#7c3aed' }}>
            {loading ? 'Activando...' : 'Crear contraseña y activar mi cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
