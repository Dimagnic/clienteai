import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')
  const planParam = searchParams.get('plan')

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [plan, setPlan] = useState(planParam && ['gratuito','pro','negocio'].includes(planParam) ? planParam : 'gratuito')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clienteCreado, setClienteCreado] = useState(null)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let asesor_id = null
      if (ref) {
        const { data: asesor } = await supabase.from('asesores').select('id').eq('codigo', ref.toUpperCase()).maybeSingle()
        if (asesor) asesor_id = asesor.id
      }

      const { data, error: fnError } = await supabase.functions.invoke('crear-cliente', {
        body: { nombre, email, telefono: telefono || null, plan, asesor_id }
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)

      setClienteCreado({ nombre, codigo: data.codigo, correoEnviado: data.correoEnviado })
      setNombre(''); setEmail(''); setTelefono(''); setPlan('gratuito')
    } catch (err) {
      setError(err.message?.includes('Ya existe') ? 'Ya existe una cuenta con ese correo.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.backLink} onClick={() => navigate('/')}>← Inicio</button>
        <div className={s.logo}>✦ ClienteAI</div>
        <h1 className={s.title}>Crea tu cuenta gratis</h1>
        <p className={s.subtitle}>Sin tarjeta de crédito · Cancela cuando quieras</p>

        {ref && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d' }}>
            🎉 Registrándote con código de referido: <strong>{ref}</strong>
          </div>
        )}

        {/* Modal de éxito — idéntico al del admin */}
        {clienteCreado && (
          <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 10 }}>
              ✅ Cliente "{clienteCreado.nombre}" registrado.
              {clienteCreado.correoEnviado
                ? ' Se le envió un correo con su código y enlace de activación.'
                : ' ⚠️ No se pudo confirmar el envío del correo — guarda estos datos:'}
            </p>
            <div style={{ background: '#fff', borderRadius: 10, padding: 14, fontSize: 14, fontFamily: 'monospace', lineHeight: 2 }}>
              <p style={{ margin: 0 }}><strong>Código de cliente:</strong> {clienteCreado.codigo}</p>
              <p style={{ margin: 0 }}><strong>Enlace de activación:</strong> https://clienteai.site/activar-cliente?codigo={clienteCreado.codigo}</p>
              <p style={{ margin: 0 }}><strong>Estado:</strong> Pendiente (se activa cuando crees tu contraseña)</p>
            </div>
            <button onClick={() => navigate('/admin')} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Entendido
            </button>
          </div>
        )}

        {/* Formulario de registro */}
        {!clienteCreado && (
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Nombre del negocio</label>
              <input className={s.input} type="text" placeholder="Ej: Tacos El Gordo" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={loading} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Correo electrónico</label>
              <input className={s.input} type="email" placeholder="tu@negocio.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Teléfono (opcional)</label>
              <input className={s.input} type="tel" placeholder="222-555-0134" value={telefono} onChange={e => setTelefono(e.target.value)} disabled={loading} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Plan</label>
              <select className={s.input} value={plan} onChange={e => setPlan(e.target.value)} disabled={loading} style={{ cursor: 'pointer' }}>
                <option value="gratuito">Plan Gratuito — $0/mes</option>
                <option value="pro">Plan Pro — $299/mes</option>
                <option value="negocio">Plan Negocio — $599/mes</option>
              </select>
            </div>

            {error && <div className={s.error}>{error}</div>}
            {successRecuperar && <div className={s.successMsg}>{successRecuperar}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 4 }}>
              <input type="checkbox" id="nobot" required style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }} />
              <label htmlFor="nobot" style={{ fontSize: 14, color: '#374151', cursor: 'pointer', userSelect: 'none' }}>No soy un robot 🤖</label>
            </div>

            <button className={s.btnSubmit} type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Inicia sesión aquí
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: 4, fontSize: 13, color: '#6b7280' }}>
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