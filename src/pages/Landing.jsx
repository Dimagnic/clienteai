import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import s from './Landing.module.css'

const FEATURES = [
  { icon: '⚡', title: 'Listo en 10 minutos', desc: 'Sin código. Sin complicaciones. Solo escribe la info de tu negocio y tu bot está listo.' },
  { icon: '🌙', title: 'Atiende 24/7', desc: 'Tu asistente responde preguntas mientras duermes, sin costo de personal extra.' },
  { icon: '💬', title: 'Web y WhatsApp', desc: 'Un solo bot, múltiples canales. Conecta tu página web y WhatsApp desde el mismo lugar.' },
  { icon: '📊', title: 'Aprende de tus clientes', desc: 'Descubre qué preguntan más tus clientes y mejora tu negocio con datos reales.' },
]

const TESTIMONIALS = [
  { name: 'Rosa Martínez', negocio: 'Salón de Belleza Rosita', text: 'Antes perdía clientes que preguntaban precios tarde en la noche. Ahora el bot responde por mí y al día siguiente ya tengo citas agendadas.' },
  { name: 'Carlos Puebla', negocio: 'Taquería El Primo', text: 'Mis clientes preguntan el menú todo el tiempo. Desde que puse ClienteAI ya no tengo que contestar lo mismo 20 veces al día.' },
  { name: 'Dr. Ávila', negocio: 'Consultorio Dental', text: 'Lo que más me convenció fue que mis pacientes pueden preguntar horarios y costos sin que yo tenga que interrumpir una consulta.' },
]

const PLANS = [
  { name: 'Gratuito', price: '0', period: 'para siempre', features: ['100 conversaciones/mes', '1 negocio', 'Chat en tu web', 'Soporte por email'], cta: 'Empezar gratis', highlight: false },
  { name: 'Starter', price: '299', period: 'por mes', features: ['1,000 conversaciones/mes', '1 negocio', 'Chat web + WhatsApp', 'Dashboard con métricas', 'Soporte prioritario'], cta: 'Empezar ahora', highlight: true },
  { name: 'Pro', price: '699', period: 'por mes', features: ['Conversaciones ilimitadas', '3 negocios', 'Todos los canales', 'Métricas avanzadas', 'Soporte dedicado'], cta: 'Contactar', highlight: false },
]

export default function Landing({ session }) {
  const navigate = useNavigate()

  return (
    <div className={s.page}>
      {/* NAV */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.logo}>✦ ClienteAI</div>
          <div className={s.navLinks}>
  <a href="#features">Funciones</a>
  <ThemeToggle />
            <a href="#precios" onClick={(e) => { e.preventDefault(); navigate('/precios') }}>Precios</a>
            {session
              ? <button className={s.btnPrimary} onClick={() => navigate('/dashboard')}>Mi dashboard</button>
              : <button className={s.btnPrimary} onClick={() => navigate('/login')}>Empezar gratis</button>
            }
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroBadge}>✦ Inteligencia artificial para tu negocio</div>
        <h1 className={s.heroTitle}>
          Tu negocio atiende<br />
          <span className={s.heroAccent}>24 horas al día</span>
        </h1>
        <p className={s.heroSub}>
          Crea un asistente inteligente para tu negocio en 10 minutos.<br />
          Sin código. Sin complicaciones. Desde $299 MXN al mes.
        </p>
        <div className={s.heroCtas}>
          <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login')}>
            Crear mi asistente gratis →
          </button>
          <button className={s.btnHeroSecondary} onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>
            Ver demo
          </button>
        </div>
        <p className={s.heroNote}>Sin tarjeta de crédito · Cancela cuando quieras</p>
      </section>

      {/* DEMO CHAT */}
      <section className={s.demoSection} id="demo">
        <div className={s.demoLabel}>Así se ve tu asistente</div>
        <DemoChat />
      </section>

      {/* FEATURES */}
      <section className={s.features} id="features">
        <h2 className={s.sectionTitle}>Todo lo que necesitas</h2>
        <p className={s.sectionSub}>Sin complicaciones técnicas. Tú te enfocas en tu negocio, nosotros en la tecnología.</p>
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
            { n: '1', title: 'Crea tu cuenta', desc: 'Regístrate gratis con tu correo o Google. Sin tarjeta de crédito.' },
            { n: '2', title: 'Describe tu negocio', desc: 'Escribe tu menú, horarios y datos de contacto. La IA aprende en segundos.' },
            { n: '3', title: 'Publica tu asistente', desc: 'Copia una línea de código a tu web o conecta tu WhatsApp. Listo.' },
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
              {p.highlight && <div className={s.planBadge}>Más popular</div>}
              <h3 className={s.planName}>{p.name}</h3>
              <div className={s.planPrice}>
                <span className={s.planCurrency}>$</span>
                <span className={s.planAmount}>{p.price}</span>
                <span className={s.planPeriod}> MXN/{p.period}</span>
              </div>
              <ul className={s.planFeatures}>
                {p.features.map(f => (
                  <li key={f} className={s.planFeature}>
                    <span className={s.checkIcon}>✓</span> {f}
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
        <h2 className={s.ctaTitle}>¿Listo para que tu negocio<br />atienda solo?</h2>
        <button className={s.btnHero} onClick={() => navigate(session ? '/dashboard' : '/login')}>
          Crear mi asistente gratis →
        </button>
        <p className={s.heroNote}>Sin tarjeta de crédito · Cancela cuando quieras</p>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.logo}>✦ ClienteAI</div>
          <p className={s.footerText}>© 2026 ClienteAI · Hecho en Puebla, México 🇲🇽</p>
        </div>
      </footer>
    </div>
  )
}

// ── Demo chat animado ──
function DemoChat() {
  const messages = [
    { role: 'user', text: '¿A qué hora abren mañana?' },
    { role: 'bot', text: '¡Hola! Abrimos de lunes a domingo de 9am a 11pm, incluyendo domingos 😊 ¿Te puedo ayudar con algo más?' },
    { role: 'user', text: '¿Cuánto cuesta la quesadilla?' },
    { role: 'bot', text: 'La quesadilla sencilla cuesta $40 y con carne $55. ¿Quieres ver el menú completo?' },
  ]

  return (
    <div className={s.demoChat}>
      <div className={s.demoChatHeader}>
        <div className={s.demoChatAvatar}>TG</div>
        <div>
          <p className={s.demoChatName}>Tacos El Gordo</p>
          <p className={s.demoChatStatus}><span className={s.demoDot} />En línea</p>
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
