import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError('Error: ' + err.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (success) return (
    <div className={s.page}>
      <div className={s.card} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#16a34a', marginBottom: 8 }}>¡Contraseña actualizada!</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Redirigiendo al inicio de sesión...</p>
      </div>
    </div>
  )

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>✦ ClienteAI</div>
        <h1 className={s.title}>Nueva contraseña</h1>
        <p className={s.subtitle}>Escribe tu nueva contraseña</p>

        <form onSubmit={handleReset} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Nueva contraseña</label>
            <input className={s.input} type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirmar contraseña</label>
            <input className={s.input} type="password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button className={s.btnSubmit} type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}