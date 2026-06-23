import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function ActivarAsesor() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    const codigoUrl = searchParams.get('codigo')
    if (codigoUrl) setCodigo(codigoUrl.toUpperCase())
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!codigo.trim()) { setError('Ingresa tu código de asesor.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    if (!aceptaTerminos) { setError('Debes aceptar los términos y condiciones.'); return }

    setLoading(true)
    try {
      const { data, error: err } = await supabase.functions.invoke('activar-asesor', {
        body: { codigo: codigo.trim().toUpperCase(), password }
      })
      if (err) throw err
      if (data.error) throw new Error(data.error)
      setExito(true)
      setTimeout(() => navigate('/admin'), 2500)
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
          <p className={s.subtitle}>Tu contraseña fue creada correctamente. Te llevaremos al inicio de sesión...</p>
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
            <label className={s.label}>Código de asesor</label>
            <input
              className={s.input}
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="CAI2026-XXNNNNNN"
              style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              required
              disabled={loading}
            />
          </div>
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
