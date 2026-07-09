import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Precios({ session, negocio }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)

  async function handlePago(plan) {
    if (!session) {
  const ref = localStorage.getItem('cai_ref') || ''
  const refParam = ref ? `&ref=${ref}` : ''
  navigate(`/login?mode=register&plan=${plan}${refParam}`)
  return
}
    if (!negocio) { navigate('/configurar'); return }
    setLoading(plan)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan,
          negocio_id: negocio.id,
          success_url: 'https://clienteai.site/dashboard',
          cancel_url: 'https://clienteai.site/precios',
        }
      })
      if (error) throw error
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert('Error al procesar el pago. Intenta de nuevo.')
    }
    setLoading(null)
  }

  const planes = [
    {
      nombre: 'Gratuito',
      precio: '$0',
      periodo: 'para siempre',
      desc: 'Perfecto para probar ClienteAI',
      features: ['50 conversaciones al mes', '1 asistente virtual', 'Widget para tu web', 'Link directo', 'Soporte por email'],
      cta: 'Tu plan actual',
      plan: null,
      destacado: false,
      disabled: true,
    },
    {
      nombre: 'Pro',
      precio: '$299',
      periodo: 'MXN / mes',
      desc: 'Para negocios que quieren crecer',
      features: ['2,000 conversaciones al mes', '1 asistente virtual', 'Widget personalizable', 'Link directo', 'Historial de conversaciones', 'Soporte prioritario'],
      cta: 'Contratar Pro',
      plan: 'pro',
      destacado: true,
      disabled: false,
    },
    {
      nombre: 'Negocio',
      precio: '$599',
      periodo: 'MXN / mes',
      desc: 'Para empresas con mas necesidades',
      features: ['5,000 conversaciones al mes', '3 asistentes virtuales', 'Widget personalizable', 'Link directo', 'Historial de conversaciones', 'Soporte prioritario', 'Reportes mensuales'],
      cta: 'Contratar Negocio',
      plan: 'negocio',
      destacado: false,
      disabled: false,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>Planes y precios</h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>Empieza gratis. Escala cuando lo necesites.</p>
<p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Precios en MXN. IVA incluido.</p>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {planes.map(p => (
            <div key={p.nombre} style={{
              background: 'var(--bg-card)', border: p.destacado ? '2px solid #16a34a' : '1px solid var(--border)',
              borderRadius: 16, padding: '32px 28px', width: 280, position: 'relative',
              boxShadow: p.destacado ? '0 8px 32px rgba(22,163,74,0.12)' : 'none',
            }}>
              {p.destacado && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 20 }}>
                  MAS POPULAR
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{p.nombre}</div>
              <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{p.precio}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{p.periodo}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>{p.desc}</div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => !p.disabled && handlePago(p.plan)}
                disabled={p.disabled || loading === p.plan}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: p.disabled ? 'default' : 'pointer',
                  border: p.destacado ? 'none' : '1px solid var(--border)',
                  background: p.disabled ? 'var(--bg-secondary)' : p.destacado ? '#16a34a' : 'var(--bg-card)',
                  color: p.disabled ? 'var(--text-muted)' : p.destacado ? '#fff' : '#16a34a',
                  opacity: loading && loading !== p.plan ? 0.6 : 1,
                }}
              >
                {loading === p.plan ? 'Redirigiendo...' : p.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--text-muted)' }}>
          Pagos seguros procesados por Stripe. Cancela cuando quieras.
        </div>
      </div>
    </div>
  )
}