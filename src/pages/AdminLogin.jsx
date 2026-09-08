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

  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [successRecuperar, setSuccessRecuperar] = useState('')

  async function recuperarPassword(e) {
    e.preventDefault()
    if (!emailRecuperar.trim()) { setError('Ingresa tu correo'); return }
    setRecuperando(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: 'https://clienteai.site/reset-password'
    })
    if (err) setError('Error: ' + err.message)
    else { setSuccessRecuperar('Te enviamos un correo con el link para restablecer tu contraseña.'); setMostrarRecuperar(false) }
    setRecuperando(false)
  }

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

        {successRecuperar && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{successRecuperar}</p>}

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280' }}>
          ¿Olvidaste tu contraseña?{' '}
          <button onClick={() => setMostrarRecuperar(v => !v)} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Recupérala aquí
          </button>
        </p>

        {mostrarRecuperar && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginTop: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#15803d', margin: '0 0 12px' }}>Recuperar contraseña</p>
            <form onSubmit={recuperarPassword}>
              <input type="email" placeholder="Tu correo electrónico" value={emailRecuperar} onChange={e => setEmailRecuperar(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={recuperando} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
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
