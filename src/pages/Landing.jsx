import { useNavigate } from 'react-router-dom'
import s from './Landing.module.css'
import ThemeToggle from '../components/ThemeToggle'

const FEATURES = [
  { icon: 'âš¡', title: 'Listo en 10 minutos', desc: 'Sin cÃ³digo. Sin complicaciones. Solo escribe la info de tu negocio y tu bot estÃ¡ listo.' },
  { icon: 'ðŸŒ™', title: 'Atiende 24/7', desc: 'Tu asistente responde preguntas mientras duermes, sin costo de personal extra.' },
  { icon: 'ðŸ’¬', title: 'Web y WhatsApp', desc: 'Un solo bot, mÃºltiples canales. Conecta tu pÃ¡gina web y WhatsApp desde el mismo lugar.' },
  { icon: 'ðŸ“Š', title: 'Aprende de tus clientes', desc: 'Descubre quÃ© preguntan mÃ¡s tus clientes y mejora tu negocio con datos reales.' },
]

const TESTIMONIALS = [
  { name: 'Rosa MartÃ­nez', negocio: 'SalÃ³n de Belleza Rosita', text: 'Antes perdÃ­a clientes que preguntaban precios tarde en la noche. Ahora el bot responde por mÃ­ y al dÃ­a siguiente ya tengo citas agendadas.' },
  { name: 'Carlos Puebla', negocio: 'TaquerÃ­a El Primo', text: 'Mis clientes preguntan el menÃº todo el tiempo. Desde que puse ClienteAI ya no tengo que contestar lo mismo 20 veces al dÃ­a.' },
  { name: 'Dr. Ãvila', negocio: 'Consultorio Dental', text: 'Lo que mÃ¡s me convenciÃ³ fue que mis pacientes pueden preguntar horarios y costos sin que yo tenga que interrumpir una consulta.' },
]

const PLANS = [
  { name: 'Gratuito', price: '0', period: 'para siempre', desc: 'Perfecto para probar ClienteAI', features: ['50 conversaciones al mes', '1 asistente virtual', 'Widget para tu web', 'Soporte por email'], cta: 'Empezar gratis', highlight: false },
  { name: 'Pro', price: '299', period: 'MXN / mes', desc: 'Para negocios que quieren crecer', features: ['Conversaciones ilimitadas', '1 asistente virtual', 'Widget personalizable', 'Historial de conversaciones', 'Soporte prioritario'], cta: 'Empezar ahora', highlight: true },
  { name: 'Negocio', price: '599', period: 'MXN / mes', desc: 'Para empresas con mÃ¡s necesidades', features: ['Conversaciones ilimitadas', '3 asistentes virtuales', 'Widget personalizable', 'Historial de conversaciones', 'Soporte prioritario', 'Reportes mensuales'], cta: 'Contactar ventas', highlight: false },
]

export default function Landing({ session }) {
  const navigate = useNavigate()

  return (
    <div className={s.page}>
      {/* NAV */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.logo}>âœ¦ ClienteAI</div>
          <div className={s.navLinks}>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Funciones</a>
            <a href="#precios" onClick={(e) => { e.preventDefault(); document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' }) }}>Precios</a>
            <ThemeToggle />
            {session
              ? <button className={s.btnPrimary} onClick={() => navigate('/dashboard')}>Mi dashboard</button>
              : <button className={s.btnPrimary} onClick={() => navigate('/login')}>Empezar gratis</button>
            }
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroBadge}>âœ¦ Inteligencia artificial para tu negocio</div>
        <h1 className={s.heroTitle}>
          Tu negocio atiende<br />
          <span className={s.heroAccent}>24 horas al dÃ­a</span>
        </h1>
        <p className={s.heroSub}>
          Crea un asistente inteligente para tu negocio en 10 minutos.<br />
          Sin cÃ³digo. Sin complicaciones. Desde $299 MXN al mes.
        </p>
        <div className={s.heroCtas}>
          <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login')}>
            Crear mi asistente gratis â†’
          </button>
          <button className={s.btnHeroSecondary} onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>
            Ver demo
          </button>
        </div>
        <p className={s.heroNote}>Sin tarjeta de crÃ©dito Â· Cancela cuando quieras</p>
      </section>

      {/* DEMO CHAT */}
      <section className={s.demoSection} id="demo">
        <div className={s.demoLabel}>AsÃ­ se ve tu asistente</div>
        <DemoChat />
      </section>

      {/* FEATURES */}
      <section className={s.features} id="features">
        <h2 className={s.sectionTitle}>Todo lo que necesitas</h2>
        <p className={s.sectionSub}>Sin complicaciones tÃ©cnicas. TÃº te enfocas en tu negocio, nosotros en la tecnologÃ­a.</p>
        <div className={s.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={s.featureCard}>
              <div className={s.featureIcon}>{f.icon}</div>
              <h3 className={s.featureTitle}>{f.title}</h3>
              <p className={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={s.howSection}>
        <h2 className={s.sectionTitle}>Listo en 3 pasos</h2>
        <div className={s.steps}>
          {[
            { n: '1', title: 'Crea tu cuenta', desc: 'RegÃ­strate gratis con tu correo o Google. Sin tarjeta de crÃ©dito.' },
            { n: '2', title: 'Describe tu negocio', desc: 'Escribe tu menÃº, horarios y datos de contacto. La IA aprende en segundos.' },
            { n: '3', title: 'Publica tu asistente', desc: 'Copia una lÃ­nea de cÃ³digo a tu web o conecta tu WhatsApp. Listo.' },
          ].map(step => (
            <div key={step.n} className={s.step}>
              <div className={s.stepNum}>{step.n}</div>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
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

      {/* PRICING */}
      <section className={s.pricing} id="precios">
        <h2 className={s.sectionTitle}>Precios simples y claros</h2>
        <p className={s.sectionSub}>En pesos mexicanos. Sin sorpresas.</p>
        <div className={s.planGrid}>
          {PLANS.map(p => (
            <div key={p.name} className={`${s.planCard} ${p.highlight ? s.planHighlight : ''}`}>
              {p.highlight && <div className={s.planBadge}>MÃ¡s popular</div>}
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
                    <span className={s.checkIcon}>âœ“</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={p.highlight ? s.btnPrimary : s.btnOutline}
                onClick={() => navigate(session ? '/dashboard' : '/login')}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className={s.ctaSection}>
        <h2 className={s.ctaTitle}>Â¿Listo para que tu negocio<br />atienda solo?</h2>
        <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login')}>
          Crear mi asistente gratis â†’
        </button>
        <p className={s.heroNote}>Sin tarjeta de crÃ©dito Â· Cancela cuando quieras</p>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.logo}>âœ¦ ClienteAI</div>
          <p className={s.footerText}>Â© 2026 ClienteAI Â· Hecho en Puebla, MÃ©xico ðŸ‡²ðŸ‡½</p>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Desarrollado por</span>
            <img src="/cero-logo.png" alt="Cero+" style={{ height: 24, objectFit: 'contain' }} />
          </div>
        </div>
      </footer>
    </div>
  )
}

function DemoChat() {
  const messages = [
    { role: 'user', text: 'Â¿A quÃ© hora abren maÃ±ana?' },
    { role: 'bot', text: 'Â¡Hola! Abrimos de lunes a domingo de 9am a 11pm, incluyendo domingos ðŸ˜Š Â¿Te puedo ayudar con algo mÃ¡s?' },
    { role: 'user', text: 'Â¿CuÃ¡nto cuesta la quesadilla?' },
    { role: 'bot', text: 'La quesadilla sencilla cuesta $40 y con carne $55. Â¿Quieres ver el menÃº completo?' },
  ]

  return (
    <div className={s.demoChat}>
      <div className={s.demoChatHeader}>
        <div className={s.demoChatAvatar}>TG</div>
        <div>
          <p className={s.demoChatName}>Tacos El Gordo</p>
          <p className={s.demoChatStatus}><span className={s.demoDot} />En lÃ­nea</p>
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
