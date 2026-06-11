import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Dashboard.module.css'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase.from('negocios').select('*').eq('user_id', session.user.id).single()
    setNegocio(data)
    if (data) {
      const hoy = new Date().toISOString().split('T')[0]
      const semana = new Date(Date.now() - 7 * 86400000).toISOString()
      const [{ count: totalHoy }, { count: totalSemana }, { count: total }] = await Promise.all([
        supabase.from('conversaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', data.id).gte('created_at', hoy),
        supabase.from('conversaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', data.id).gte('created_at', semana),
        supabase.from('conversaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', data.id),
      ])
      setStats({ hoy: totalHoy || 0, semana: totalSemana || 0, total: total || 0 })
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <PageLoader />

  return (
    <div className={s.page}>
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>ClienteAI</div>
        <nav className={s.sidebarNav}>
          <button className={`${s.navItem} ${s.navItemActive}`}>
            <span className={s.navIcon}>+</span> Dashboard
          </button>
          <button className={s.navItem} onClick={() => navigate('/configurar')}>
            <span className={s.navIcon}>*</span> Mi asistente
          </button>
          <button className={s.navItem} onClick={() => navigate('/preview')}>
            <span className={s.navIcon}>o</span> Vista previa
          </button>
        </nav>
        <div className={s.sidebarBottom}>
          <div className={s.userInfo}>
            <div className={s.userAvatar}>{session.user.email[0].toUpperCase()}</div>
            <div className={s.userEmail}>{session.user.email}</div>
          </div>
          <button className={s.signOutBtn} onClick={handleSignOut}>Cerrar sesion</button>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.greeting}>Hola{negocio ? `, ${negocio.nombre}` : ''}</h1>
            <p className={s.subGreeting}>Aqui esta el resumen de tu asistente</p>
          </div>
          {negocio && (
            <div className={s.statusBadge}>
              <span className={s.statusDot} /> Bot activo
            </div>
          )}
        </div>

        {!negocio ? <EmptyState navigate={navigate} /> : (
          <>
            <div className={s.statsGrid}>
              <StatCard label="Conversaciones hoy" value={stats.hoy} icon="💬" />
              <StatCard label="Esta semana" value={stats.semana} icon="📅" />
              <StatCard label="Total historico" value={stats.total} icon="📊" />
              <StatCard label="Plan actual" value="Gratuito" icon="⭐" isText />
            </div>

            <div className={s.section}>
              <h2 className={s.sectionTitle}>Acciones rapidas</h2>
              <div className={s.actionsGrid}>
                <ActionCard icon="⚙" title="Configurar asistente" desc="Actualiza el menu, horarios y datos de tu negocio" onClick={() => navigate('/configurar')} />
                <ActionCard icon="o" title="Probar bot" desc="Habla con tu asistente antes de publicarlo" onClick={() => navigate('/preview')} />
                <ActionCard icon="<>" title="Codigo para tu web" desc="Copia el script y pegalo en tu pagina" onClick={() => navigate('/configurar?tab=embed')} />
              </div>
            </div>

            <div className={s.section}>
              <h2 className={s.sectionTitle}>Ultimas conversaciones</h2>
              <ConversacionesRecientes negocioId={negocio.id} />
            </div>

            <div className={s.section}>
              <h2 className={s.sectionTitle}>Codigo para tu web</h2>
              <div style={{ background: 'var(--bg-card)', border: '2px solid #16a34a', borderRadius: 14, padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>🚀</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Tu widget esta listo</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Copia este codigo y pegalo antes del cierre body de tu pagina web</p>
                  </div>
                </div>
                <EmbedCode token={negocio.token} />
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#16a34a' }}>
                  💡 <strong>No tienes web?</strong> Comparte este link directo con tus clientes:
                  <br />
                  <a href={`https://clienteai.vercel.app/chat/${negocio.token}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 600, wordBreak: 'break-all' }}>
                    {`https://clienteai.vercel.app/chat/${negocio.token}`}
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, isText }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: isText ? 20 : 32, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
    </button>
  )
}

function EmbedCode({ token }) {
  const [copied, setCopied] = useState(false)
  const code = `<script src="https://clienteai.vercel.app/widget.js" data-token="${token}"></script>`

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <pre style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)', overflowX: 'auto', fontFamily: 'monospace', lineHeight: 1.6 }}>
        {code}
      </pre>
      <button onClick={copy} style={{ position: 'absolute', top: 10, right: 10, background: copied ? '#16a34a' : 'var(--bg-card)', color: copied ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function EmptyState({ navigate }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '56px 32px', textAlign: 'center', maxWidth: 500 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>Configura tu primer asistente</h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
        Solo necesitas 10 minutos para tener un bot respondiendo por ti.
      </p>
      <button onClick={() => navigate('/configurar')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
        Configurar ahora
      </button>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ConversacionesRecientes({ negocioId }) {
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('conversaciones').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }).limit(20)
      setMensajes(data || [])
      setLoading(false)
    }
    load()
  }, [negocioId])

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando...</div>
  if (!mensajes.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
      Aun no hay conversaciones. Comparte tu widget para empezar!
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {mensajes.map((m, i) => (
        <div key={m.id} style={{ padding: '14px 20px', borderBottom: i < mensajes.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: m.rol === 'user' ? '#dbeafe' : '#dcfce7', color: m.rol === 'user' ? '#1d4ed8' : '#16a34a', whiteSpace: 'nowrap', marginTop: 2 }}>
            {m.rol === 'user' ? 'Cliente' : 'Bot'}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{m.mensaje}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString('es-MX')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}