import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('cliente') // 'admin' | 'asesor' | 'cliente'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Admin
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Asesor
  const [emailAsesor, setEmailAsesor] = useState('')
  const [password, setPassword] = useState('')

  // Cliente
  const [emailCliente, setEmailCliente] = useState('')
  const [passwordCliente, setPasswordCliente] = useState('')

  async function loginAdmin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword })
    if (err) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    navigate('/dashboard')
  }

  async function loginAsesor(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!emailAsesor.trim()) { setError('Ingresa tu correo electrónico.'); setLoading(false); return }
    const { error: err } = await supabase.auth.signInWithPassword({ email: emailAsesor.trim().toLowerCase(), password })
    if (err) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    navigate('/asesor')
  }

  async function loginCliente(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!emailCliente.trim()) { setError('Ingresa tu correo electrónico.'); setLoading(false); return }
    const { error: err } = await supabase.auth.signInWithPassword({ email: emailCliente.trim().toLowerCase(), password: passwordCliente })
    if (err) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    navigate('/dashboard')
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => navigate('/')}>← Inicio</button>
        <div className={s.logo}>ClienteAI</div>

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
              <button className={s.btnSubmit} type="submit" disabled={loading} style={{ background: '#111827' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
            <p className={s.toggle}>¿Eres asesor? <button className={s.toggleBtn} onClick={() => { setModo('asesor'); setError('') }}>Entra aquí</button></p>
            <p className={s.toggle}>¿Eres cliente? <button className={s.toggleBtn} onClick={() => { setModo('cliente'); setError('') }}>Entra aquí</button></p>
          </>
        )}

        {modo === 'asesor' && (
          <>
            <h1 className={s.title}>Acceso de asesor</h1>
            <p className={s.subtitle}>Entra con tu correo y contraseña</p>
            <form className={s.form} onSubmit={loginAsesor}>
              <div className={s.field}>
                <label className={s.label}>Correo electrónico</label>
                <input className={s.input} type="email" value={emailAsesor} onChange={e => setEmailAsesor(e.target.value)} required disabled={loading} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Contraseña</label>
                <input className={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
              </div>
              {error && <div className={s.error}>{error}</div>}
              <button className={s.btnSubmit} type="submit" disabled={loading} style={{ background: '#7c3aed' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
            <p className={s.toggle}>¿Eres cliente? <button className={s.toggleBtn} onClick={() => { setModo('cliente'); setError('') }}>Entra aquí</button></p>
            <p className={s.toggle}>¿Eres administrador? <button className={s.toggleBtn} onClick={() => { setModo('admin'); setError('') }}>Entra aquí</button></p>
          </>
        )}

        {modo === 'cliente' && (
          <>
            <h1 className={s.title}>Acceso de cliente</h1>
            <p className={s.subtitle}>Entra con tu correo y contraseña</p>
            <form className={s.form} onSubmit={loginCliente}>
              <div className={s.field}>
                <label className={s.label}>Correo electrónico</label>
                <input className={s.input} type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} required disabled={loading} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Contraseña</label>
                <input className={s.input} type="password" value={passwordCliente} onChange={e => setPasswordCliente(e.target.value)} required disabled={loading} />
              </div>
              {error && <div className={s.error}>{error}</div>}
              <button className={s.btnSubmit} type="submit" disabled={loading} style={{ background: '#16a34a' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
            <p className={s.toggle}>¿Eres asesor? <button className={s.toggleBtn} onClick={() => { setModo('asesor'); setError('') }}>Entra aquí</button></p>
            <p className={s.toggle}>¿Eres administrador? <button className={s.toggleBtn} onClick={() => { setModo('admin'); setError('') }}>Entra aquí</button></p>
          </>
        )}
      </div>
    </div>
  )
}