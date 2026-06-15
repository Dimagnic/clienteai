import { useNavigate } from 'react-router-dom'

export default function Legal() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: 18, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>
          ClienteAI
        </button>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Volver
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Terminos y Politica de Privacidad</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 48 }}>Ultima actualizacion: Junio 2026</p>

        <Section title="1. Que es ClienteAI">
          ClienteAI es una plataforma que permite a negocios crear asistentes virtuales con inteligencia artificial para atender a sus clientes de forma automatica. El servicio incluye un widget embebible para paginas web y un link directo de chat.
        </Section>

        <Section title="2. Datos que recopilamos">
          Recopilamos unicamente los datos necesarios para operar el servicio: correo electronico al registrarte, informacion del negocio que ingresas (nombre, menu, horarios, etc.) y las conversaciones entre el asistente y los clientes finales. No recopilamos datos sensibles ni informacion de pago directamente.
        </Section>

        <Section title="3. Como usamos tus datos">
          Los datos del negocio se usan exclusivamente para configurar y operar tu asistente virtual. Las conversaciones se almacenan para mostrarte estadisticas en tu dashboard. No vendemos ni compartimos tus datos con terceros, salvo los proveedores de infraestructura necesarios para operar el servicio (Supabase, Anthropic, Vercel).
        </Section>

        <Section title="4. Datos de clientes finales">
          Los mensajes que los clientes de tu negocio envian al asistente se almacenan en nuestra base de datos asociados a tu cuenta. Como dueno del negocio, eres responsable de informar a tus clientes que sus conversaciones pueden ser almacenadas.
        </Section>

        <Section title="5. Seguridad">
          Utilizamos cifrado en transito (HTTPS) y en reposo para proteger tus datos. El acceso a la base de datos esta restringido mediante politicas de seguridad (Row Level Security). Sin embargo, ningun sistema es 100% seguro y no podemos garantizar seguridad absoluta.
        </Section>

        <Section title="6. Cancelacion y eliminacion">
          Puedes cancelar tu cuenta en cualquier momento. Al cancelar, tus datos seran eliminados de nuestros sistemas en un plazo de 30 dias. Las conversaciones anonimas pueden conservarse por un periodo adicional para fines estadisticos.
        </Section>

        <Section title="7. Cambios a esta politica">
          Podemos actualizar esta politica ocasionalmente. Te notificaremos por correo electronico ante cambios importantes. El uso continuo del servicio despues de los cambios implica aceptacion de la nueva politica.
        </Section>

        <Section title="8. Contacto">
          Si tienes preguntas sobre esta politica, contactanos en: <a href="mailto:hola@clienteai.mx" style={{ color: '#16a34a' }}>hola@clienteai.mx</a>
        </Section>

        <div style={{ marginTop: 48, padding: '24px', background: 'var(--bg-secondary)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          Al usar ClienteAI aceptas estos terminos. Si no estas de acuerdo, por favor no uses el servicio.
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        © 2026 ClienteAI · Hecho en Puebla, Mexico
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{title}</h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{children}</p>
    </div>
  )
}