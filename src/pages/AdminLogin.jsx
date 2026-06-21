import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [modo, setModo] = useState(null) // null | 'admin' | 'asesor'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Admin (correo normal)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Asesor (código + contraseña)
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')

  async function loginAdmin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword })
    if (err) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }
    navigate('/dashboard')
  }

  async function loginAsesor(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const codigoNormalizado = codigo.trim().toUpperCase()
    if (!codigoNormalizado) {
      setError('Ingresa tu código de asesor.')
      setLoading(false)
      return
    }

    // El código se traduce a un correo sintético interno (el asesor nunca lo ve ni lo usa)
    const emailSintetico = `${codigoNormalizado.toLowerCase()}@asesores.clienteai.site`

    const { error: err } = await supabase.auth.signInWithPassword({ email: emailSintetico, password })
    if (err) {
      setError('Código o contraseña incorrectos.')
      setLoading(false)
      return
    }
    navigate('/asesor')
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => modo ? setModo(null) : navigate('/')}>← {modo ? 'Volver' : 'Inicio'}</button>
        <div className={s.logo}>ClienteAI</div>

        {!modo && (
          <>
            <h1 className={s.title}>Acceso administrativo</h1>
            <p className={s.subtitle}>Selecciona tu tipo de acceso</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className={s.btnSubmit} onClick={() => setModo('admin')}>Soy administrador</button>
              <button className={s.btnGoogle} onClick={() => setModo('asesor')} style={{ fontWeight: 600 }}>Soy asesor</button>
            </div>
          </>
        )}

        {modo === 'admin' && (
          <>
            <h1 className={s.title}>Acceso administrador</h1>
            <p className={s.subtitle}>Entra con tu correo y contraseña</p>
            <form className={s.form} onSubmit={loginAdmin}>
              <div className={s.field}>
                <label className={s.label}>Correo electrónico</label>
                <input className={s.input} type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Contraseña</label>
                <input className={s.input} type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required disabled={loading} />
              </div>
              {error && <div className={s.error}>{error}</div>}
              <button className={s.btnSubmit} type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
          </>
        )}

        {modo === 'asesor' && (
          <>
            <h1 className={s.title}>Acceso de asesor</h1>
            <p className={s.subtitle}>Entra con tu código y contraseña</p>
            <form className={s.form} onSubmit={loginAsesor}>
              <div className={s.field}>
                <label className={s.label}>Código de asesor</label>
                <input className={s.input} placeholder="CAI2026-XXNNNNNN" value={codigo} onChange={e => setCodigo(e.target.value)} required disabled={loading} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Contraseña</label>
                <input className={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
              </div>
              {error && <div className={s.error}>{error}</div>}
              <button className={s.btnSubmit} type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
