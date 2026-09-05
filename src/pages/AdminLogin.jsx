import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

// Sub-componente reutilizable: los 3 modos de acceso (admin/asesor/cliente)
// comparten exactamente el mismo formulario, solo cambian título, color del
// botón, a dónde navegan al entrar, y los enlaces para cambiar de modo.
function LoginForm({ title, email, setEmail, password, setPassword, onSubmit, buttonColor, error, loading, toggles }) {
  return (
    <>
      <h1 className={s.title}>{title}</h1>
      <p className={s.subtitle}>Entra con tu correo y contraseña</p>
      <form className={s.form} onSubmit={onSubmit}>
        <div className={s.field}>
          <label className={s.label}>Correo electrónico</label>
          <input className={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
        </div>
        <div className={s.field}>
          <label className={s.label}>Contraseña</label>
          <input className={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
        </div>
        {error && <div className={s.error}>{error}</div>}
        <button className={s.btnSubmit} type="submit" disabled={loading} style={{ background: buttonColor }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      {toggles.map(t => (
        <p className={s.toggle} key={t.pregunta}>{t.pregunta} <button className={s.toggleBtn} onClick={t.onClick}>Entra aquí</button></p>
      ))}
    </>
  )
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('cliente') // 'admin' | 'asesor' | 'cliente'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [emailAsesor, setEmailAsesor] = useState('')
  const [passwordAsesor, setPasswordAsesor] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [passwordCliente, setPasswordCliente] = useState('')

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo)
    setError('')
  }

  async function login(email, password, rutaDestino) {
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (err) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    navigate(rutaDestino)
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => navigate('/')}>← Inicio</button>
        <div className={s.logo}>ClienteAI</div>

        {modo === 'admin' && (
          <LoginForm
            title="Acceso administrador"
            email={adminEmail} setEmail={setAdminEmail}
            password={adminPassword} setPassword={setAdminPassword}
            onSubmit={e => { e.preventDefault(); login(adminEmail, adminPassword, '/dashboard') }}
            buttonColor="#111827"
            error={error} loading={loading}
            toggles={[
              { pregunta: '¿Eres asesor?', onClick: () => cambiarModo('asesor') },
              { pregunta: '¿Eres cliente?', onClick: () => cambiarModo('cliente') },
            ]}
          />
        )}

        {modo === 'asesor' && (
          <LoginForm
            title="Acceso de asesor"
            email={emailAsesor} setEmail={setEmailAsesor}
            password={passwordAsesor} setPassword={setPasswordAsesor}
            onSubmit={e => { e.preventDefault(); login(emailAsesor, passwordAsesor, '/asesor') }}
            buttonColor="#7c3aed"
            error={error} loading={loading}
            toggles={[
              { pregunta: '¿Eres cliente?', onClick: () => cambiarModo('cliente') },
              { pregunta: '¿Eres administrador?', onClick: () => cambiarModo('admin') },
            ]}
          />
        )}

        {modo === 'cliente' && (
          <LoginForm
            title="Acceso de cliente"
            email={emailCliente} setEmail={setEmailCliente}
            password={passwordCliente} setPassword={setPasswordCliente}
            onSubmit={e => { e.preventDefault(); login(emailCliente, passwordCliente, '/dashboard') }}
            buttonColor="#16a34a"
            error={error} loading={loading}
            toggles={[
              { pregunta: '¿Eres asesor?', onClick: () => cambiarModo('asesor') },
              { pregunta: '¿Eres administrador?', onClick: () => cambiarModo('admin') },
            ]}
          />
        )}
      </div>
    </div>
  )
}
