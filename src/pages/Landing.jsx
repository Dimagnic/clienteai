import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import s from './Landing.module.css'
import ThemeToggle from '../components/ThemeToggle'

const FEATURES = [
  { icon: 'lightning', title: 'Listo en 10 minutos', desc: 'Sin codigo. Sin complicaciones. Solo escribe la info de tu negocio y tu bot esta listo.' },
  { icon: 'moon', title: 'Atiende 24/7', desc: 'Tu asistente responde preguntas mientras duermes, sin costo de personal extra.' },
  { icon: 'chat', title: 'Web y WhatsApp', desc: 'Un solo bot, multiples canales. Conecta tu pagina web y WhatsApp desde el mismo lugar.' },
  { icon: 'chart', title: 'Aprende de tus clientes', desc: 'Descubre que preguntan mas tus clientes y mejora tu negocio con datos reales.' },
]

const TESTIMONIALS = [
  { name: 'Rosa Martinez', negocio: 'Salon de Belleza Rosita', text: 'Antes perdia clientes que preguntaban precios tarde en la noche. Ahora el bot responde por mi y al dia siguiente ya tengo citas agendadas.' },
  { name: 'Carlos Puebla', negocio: 'Taqueria El Primo', text: 'Mis clientes preguntan el menu todo el tiempo. Desde que puse ClienteAI ya no tengo que contestar lo mismo 20 veces al dia.' },
  { name: 'Dr. Avila', negocio: 'Consultorio Dental', text: 'Lo que mas me convencio fue que mis pacientes pueden preguntar horarios y costos sin que yo tenga que interrumpir una consulta.' },
]

const PLANS = [
  { name: 'Gratuito', price: '0', period: 'para siempre', desc: '30 días de prueba para conocer ClienteAI', features: ['50 conversaciones al mes', '1 asistente virtual', 'Widget para tu web', 'Soporte por email', 'Bot se desactiva al vencer el mes'], cta: 'Empezar gratis', highlight: false },
  { name: 'Pro', price: '299', period: 'MXN / mes', desc: 'Para negocios que quieren crecer', features: ['Hasta 2,000 conversaciones al mes', '1 asistente virtual', 'Widget personalizable', 'Historial de conversaciones', 'Soporte prioritario', 'Notificación al 80% del límite'], cta: 'Empezar ahora', highlight: true },
  { name: 'Negocio', price: '599', period: 'MXN / mes', desc: 'Para empresas con más necesidades', features: ['Conversaciones ilimitadas ♾️', '3 asistentes virtuales', 'Widget personalizable', 'Historial de conversaciones', 'Soporte prioritario', 'Reportes mensuales descargables'], cta: 'Empezar ahora', highlight: false },
]

export default function Landing({ session }) {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('cai_ref', ref)
      localStorage.setItem('cai_ref_fecha', new Date().toISOString())
    }
  }, [])

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.logo}>ClienteAI</div>
          <div className={s.navLinks}>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Funciones</a>
            <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' }) }}>Precios</a>
            <ThemeToggle />
            {session
              ? <button className={s.btnPrimary} onClick={() => navigate('/dashboard')}>Mi dashboard</button>
              : <button className={s.btnPrimary} onClick={() => navigate('/admin')}>Admin</button>
            }
          </div>
        </div>
      </nav>

      <section className={s.hero}>
        <div className={s.heroBadge}>Inteligencia artificial para tu negocio</div>
        <h1 className={s.heroTitle}>
          Tu negocio atiende<br />
          <span className={s.heroAccent}>24 horas al dia</span>
        </h1>
        <p className={s.heroSub}>
          Crea un asistente inteligente para tu negocio en 10 minutos.<br />
          Sin codigo. Sin complicaciones. Desde $299 MXN al mes.
        </p>
        <div className={s.heroCtas}>
          <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login?mode=register')}>
            Crear mi asistente gratis
          </button>
          <button className={s.btnHeroSecondary} onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>
            Ver demo
          </button>
        </div>
        <p className={s.heroNote}>Sin tarjeta de credito - Cancela cuando quieras</p>
      </section>

      <section className={s.demoSection} id="demo">
        <div className={s.demoLabel}>Asi se ve tu asistente</div>
        <DemoChat />
      </section>

      <section className={s.features} id="features">
        <h2 className={s.sectionTitle}>Todo lo que necesitas</h2>
        <p className={s.sectionSub}>Sin complicaciones tecnicas. Tu te enfocas en tu negocio, nosotros en la tecnologia.</p>
        <div className={s.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={s.featureCard}>
              <div className={s.featureIcon}>⚡</div>
              <h3 className={s.featureTitle}>{f.title}</h3>
              <p className={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.howSection}>
        <h2 className={s.sectionTitle}>Listo en 3 pasos</h2>
        <div className={s.steps}>
          {[
            { n: '1', title: 'Crea tu cuenta', desc: 'Registrate gratis con tu correo o Google. Sin tarjeta de credito.' },
            { n: '2', title: 'Describe tu negocio', desc: 'Escribe tu menu, horarios y datos de contacto. La IA aprende en segundos.' },
            { n: '3', title: 'Publica tu asistente', desc: 'Copia una linea de codigo a tu web o conecta tu WhatsApp. Listo.' },
          ].map(step => (
            <div key={step.n} className={s.step}>
              <div className={s.stepNum}>{step.n}</div>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.testimonials}>
        <h2 className={s.sectionTitle}>Lo que dicen los negocios</h2>
        <div className={s.testimonialGrid}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className={s.testimonialCard}>
              <p className={s.testimonialText}>"{t.text}"</p>
              <div className={s.testimonialAuthor}>
                <div className={s.testimonialAvatar}>{t.name[0]}</div>
                <div>
                  <p className={s.testimonialName}>{t.name}</p>
                  <p className={s.testimonialNegocio}>{t.negocio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.pricing} id="precios">
        <h2 className={s.sectionTitle}>Precios simples y claros</h2>
        <p className={s.sectionSub}>En pesos mexicanos. Sin sorpresas.</p>
        <div className={s.planGrid}>
          {PLANS.map(p => (
            <div key={p.name} className={`${s.planCard} ${p.highlight ? s.planHighlight : ''}`}>
              {p.highlight && <div className={s.planBadge}>Mas popular</div>}
              <h3 className={s.planName}>{p.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>{p.desc}</p>
              <div className={s.planPrice}>
                <span className={s.planCurrency}>$</span>
                <span className={s.planAmount}>{p.price}</span>
                <span className={s.planPeriod}> {p.period}</span>
              </div>
              <ul className={s.planFeatures}>
                {p.features.map(f => (
                  <li key={f} className={s.planFeature}>
                    <span className={s.checkIcon}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={p.highlight ? s.btnPrimary : p.name === 'Negocio' ? s.btnPrimary : s.btnOutline}
                onClick={() => {
                  if (session) { navigate('/dashboard'); return }
                  if (p.name === 'Gratuito') {
                    navigate('/login?mode=register')
                  } else {
                    navigate(`/login?mode=register&plan=${p.name.toLowerCase()}`)
                  }
                }}
              >
                {p.name === 'Negocio' ? 'Empezar ahora' : p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={s.ctaSection}>
        <h2 className={s.ctaTitle}>Listo para que tu negocio atienda solo?</h2>
        <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login?mode=register')}>
          Crear mi asistente gratis
        </button>
        <p className={s.heroNote}>Sin tarjeta de credito - Cancela cuando quieras</p>
      </section>

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/522219663226?text=Hola,%20me%20interesa%20saber%20más%20sobre%20ClienteAI"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          background: '#25D366', color: '#fff', borderRadius: '50%',
          width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.5)', textDecoration: 'none',
          fontSize: 28, transition: 'transform 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Contáctanos por WhatsApp"
      >
        💬
      </a>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.logo}>ClienteAI</div>
          <p className={s.footerText}>© 2026 ClienteAI - Hecho en Puebla, Mexico</p>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/522219663226?text=Hola,%20me%20interesa%20saber%20más%20sobre%20ClienteAI"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              💬 Contáctanos por WhatsApp
            </a>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Desarrollado por</span>
            <img src="/cero-logo.png" alt="Cero+" style={{ height: 24, objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: 12, fontSize: 12 }}>
            <a href="/legal" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Terminos y Politica de Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DemoChat() {
  const messages = [
    { role: 'user', text: 'A que hora abren manana?' },
    { role: 'bot', text: 'Hola! Abrimos de lunes a domingo de 9am a 11pm, incluyendo domingos. Te puedo ayudar con algo mas?' },
    { role: 'user', text: 'Cuanto cuesta la quesadilla?' },
    { role: 'bot', text: 'La quesadilla sencilla cuesta $40 y con carne $55. Quieres ver el menu completo?' },
  ]

  return (
    <div className={s.demoChat}>
      <div className={s.demoChatHeader}>
        <div className={s.demoChatAvatar}>TG</div>
        <div>
          <p className={s.demoChatName}>Tacos El Gordo</p>
          <p className={s.demoChatStatus}><span className={s.demoDot} />En linea</p>
        </div>
      </div>
      <div className={s.demoChatMessages}>
        {messages.map((m, i) => (
          <div key={i} className={`${s.demoMsg} ${m.role === 'user' ? s.demoMsgUser : s.demoMsgBot}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className={s.demoChatInput}>
        <span className={s.demoChatPlaceholder}>Escribe tu pregunta...</span>
      </div>
    </div>
  )
}