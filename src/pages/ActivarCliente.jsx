import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ActivarCliente() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const emailUrl = params.get('email') || ''
  const tokenUrl = params.get('token') || ''

  const [email, setEmail] = useState(emailUrl)
  const [token, setToken] = useState(tokenUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  async function activar() {
    setError('')
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return }
    if (!token.trim()) { setError('Falta el código de activación de tu correo. Usa el link completo que te enviamos, o pégalo abajo.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      const emailNormalizado = email.trim().toLowerCase()

      // Nota: la verificación de que la cuenta exista y esté pendiente la
      // hace la función Edge (con permisos de servidor). No se puede
      // consultar la tabla "negocios" desde el navegador en este punto
      // porque el cliente aún no inició sesión, y las reglas de seguridad
      // (RLS) bloquean correctamente ese acceso anónimo.

      // Llamar a la función Edge que activa la cuenta
      const { data, error: fnError } = await supabase.functions.invoke('activar-cliente', {
        body: { email: emailNormalizado, nuevaPassword: password, token: token.trim() }
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      // Login automático con el correo real
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data?.email || emailNormalizado,
        password
      })
      if (loginError) throw loginError

      // Cuenta activada y sesión iniciada. Si el cliente eligió un plan de
      // pago al registrarse, lo mandamos a pagar AHORA, antes de configurar
      // su bot. Solo si paga con éxito llegará a /configurar.
      const planPago = data?.plan_deseado

      if (planPago === 'pro' || planPago === 'negocio') {
        setExito('pago')
        const { data: checkout, error: checkoutError } = await supabase.functions.invoke('stripe-checkout', {
          body: { plan: planPago, negocio_id: data.negocio_id }
        })
        if (checkoutError || !checkout?.url) {
          // Si falla el checkout, no dejamos al cliente varado: lo mandamos
          // a su dashboard en plan gratuito, puede intentar pagar de nuevo desde ahí.
          navigate('/dashboard')
          return
        }
        window.location.href = checkout.url
        return
      }

      setExito(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      setError('Error al activar la cuenta: ' + (err.message || 'intenta de nuevo'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', marginTop: 4,
  }

  if (exito === 'pago') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 400, textAlign: 'center', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#16a34a', marginBottom: 8 }}>¡Cuenta activada!</h2>
        <p style={{ color: '#374151', fontSize: 14 }}>Te llevamos a completar tu pago para activar tu plan...</p>
      </div>
    </div>
  )

  if (exito) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 400, textAlign: 'center', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#16a34a', marginBottom: 8 }}>¡Cuenta activada!</h2>
        <p style={{ color: '#374151', fontSize: 14 }}>Tu cuenta está lista. Redirigiendo al inicio de sesión...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <a href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Inicio</a>
        <div style={{ margin: '16px 0 24px' }}>
          <p style={{ color: '#16a34a', fontWeight: 900, fontSize: 20, margin: '0 0 4px' }}>ClienteAI</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Activa tu cuenta</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Crea tu contraseña para acceder</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@negocio.com"
            style={inputStyle}
          />
        </div>

        {!tokenUrl && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Código de activación (del correo)</label>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Pega aquí el código largo de tu correo"
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Lo encuentras en el link del correo de activación, o pega solo el código que sigue a "&token=" en ese link.</p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={activar}
          disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Activando...' : 'Activar mi cuenta'}
        </button>
      </div>
    </div>
  )
}
