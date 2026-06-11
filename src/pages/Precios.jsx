import { useNavigate } from 'react-router-dom'

export default function Precios() {
  const navigate = useNavigate()

  const planes = [
    {
      nombre: 'Gratuito',
      precio: '$0',
      periodo: 'para siempre',
      descripcion: 'Perfecto para probar ClienteAI',
      color: '#6b7280',
      features: [
        '50 conversaciones al mes',
        '1 asistente virtual',
        'Widget para tu web',
        'Soporte por email',
      ],
      cta: 'Empezar gratis',
      destacado: false,
    },
    {
      nombre: 'Pro',
      precio: '$299',
      periodo: 'MXN / mes',
      descripcion: 'Para negocios que quieren crecer',
      color: '#16a34a',
      features: [
        'Conversaciones ilimitadas',
        '1 asistente virtual',
        'Widget personalizable',
        'Historial de conversaciones',
        'Soporte prioritario',
      ],
      cta: 'Empezar ahora',
      destacado: true,
    },
    {
      nombre: 'Negocio',
      precio: '$599',
      periodo: 'MXN / mes',
      descripcion: 'Para empresas con más necesidades',
      color: '#1d4ed8',
      features: [
        'Conversaciones ilimitadas',
        '3 asistentes virtuales',
        'Widget personalizable',
        'Historial de conversaciones',
        'Soporte prioritario',
        'Reportes mensuales',
      ],
      cta: 'Contactar ventas',
      destacado: false,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: 20, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>
          ✦ ClienteAI
        </button>
        <button onClick={() => navigate('/login')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Iniciar sesión
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '64px 24px 48px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#111', margin: '0 0 16px', letterSpacing: '-1px' }}>
          Planes y precios
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', margin: 0 }}>
          Empieza gratis. Escala cuando lo necesites.
        </p>
      </div>

      {/* Planes */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        {planes.map((plan) => (
          <div key={plan.nombre} style={{
            background: '#fff',
            border: plan.destacado ? `2px solid ${plan.color}` : '1px solid #e5e7eb',
            borderRadius: 16,
            padding: '36px 32px',
            width: 300,
            position: 'relative',
            boxShadow: plan.destacado ? '0 8px 32px rgba(22,163,74,0.12)' : 'none',
          }}>
            {plan.destacado && (
              <div style={{
                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                background: plan.color, color: '#fff', fontSize: 12, fontWeight: 700,
                padding: '4px 16px', borderRadius: 20,
              }}>
                MÁS POPULAR
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {plan.nombre}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#111', marginBottom: 4 }}>
              {plan.precio}
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 12 }}>
              {plan.periodo}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 }}>
              {plan.descripcion}
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 24, marginBottom: 28 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: '#374151' }}>
                  <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', border: plan.destacado ? 'none' : `1px solid ${plan.color}`,
                background: plan.destacado ? plan.color : '#fff',
                color: plan.destacado ? '#fff' : plan.color,
                transition: 'all 0.15s',
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ simple */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 40 }}>Preguntas frecuentes</h2>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, puedes cancelar tu suscripción cuando quieras sin penalizaciones.' },
            { q: '¿Cómo se instala en mi página web?', a: 'Solo copias una línea de código y la pegas en tu página. Tu asistente aparece automáticamente.' },
            { q: '¿Qué pasa si supero el límite del plan gratuito?', a: 'Te avisamos cuando estés cerca del límite. Puedes actualizar a Pro en cualquier momento.' },
            { q: '¿Aceptan pagos por transferencia?', a: 'Sí, aceptamos transferencia bancaria. Contáctanos para coordinar el pago.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <div style={{ fontWeight: 600, color: '#111', marginBottom: 6, fontSize: 15 }}>{q}</div>
              <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}