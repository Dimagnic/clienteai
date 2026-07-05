import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ActivarCliente() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const codigoUrl = params.get('codigo') || ''

  const [codigo, setCodigo] = useState(codigoUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  async function activar() {
    setError('')
    if (!codigo.trim()) { setError('Ingresa tu código de cliente.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      const codigoNormalizado = codigo.trim().toUpperCase()
      const emailSintetico = `${codigoNormalizado.toLowerCase().replace(/-/g, '.')}@clientes.clienteai.site`

      // Buscar el negocio con ese código
      const { data: negocio } = await supabase
        .from('negocios')
        .select('id, estado_cuenta')
        .eq('codigo_cliente', codigoNormalizado)
        .maybeSingle()

      if (!negocio) { setError('Código de cliente no encontrado.'); setLoading(false); return }
      if (negocio.estado_cuenta === 'activo') { setError('Esta cuenta ya fue activada. Inicia sesión normalmente.'); setLoading(false); return }

      // Llamar a la función Edge que activa la cuenta
      const { data, error: fnError } = await supabase.functions.invoke('activar-cliente', {
        body: { codigo: codigoNormalizado, nuevaPassword: password }
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      // Login automático con el email sintético devuelto por la función (o el calculado localmente)
      const emailParaLogin = data?.emailSintetico || emailSintetico
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailParaLogin,
        password
      })
      if (loginError) throw loginError

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
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Código de cliente</label>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="CAI2026-CL000001"
            style={inputStyle}
          />
        </div>

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