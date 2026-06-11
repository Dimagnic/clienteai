import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Dashboard.module.css'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('negocios')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
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
      {/* Sidebar */}
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>✦ ClienteAI</div>
        <nav className={s.sidebarNav}>
          <button className={`${s.navItem} ${s.navItemActive}`}>
            <span className={s.navIcon}>⊞</span> Dashboard
          </button>
          <button className={s.navItem} onClick={() => navigate('/configurar')}>
            <span className={s.navIcon}>⚙</span> Mi asistente
          </button>
          <button className={s.navItem} onClick={() => navigate('/preview')}>
            <span className={s.navIcon}>◉</span> Vista previa
          </button>
        </nav>
        <div className={s.sidebarBottom}>
          <div className={s.userInfo}>
            <div className={s.userAvatar}>{session.user.email[0].toUpperCase()}</div>
            <div className={s.userEmail}>{session.user.email}</div>
          </div>
          <button className={s.signOutBtn} onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </aside>

      {/* Main */}
      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.greeting}>
              Hola{negocio ? `, ${negocio.nombre}` : ''} 👋
            </h1>
            <p className={s.subGreeting}>Aquí está el resumen de tu asistente</p>
          </div>
          {negocio && (
            <div className={s.statusBadge}>
              <span className={s.statusDot} />
              Bot activo
            </div>
          )}
        </div>

        {!negocio ? (
          <EmptyState navigate={navigate} />
        ) : (
          <>
            {/* Stats */}
            <div className={s.statsGrid}>
              <StatCard label="Conversaciones hoy" value={stats.hoy} icon="💬" />
              <StatCard label="Esta semana" value={stats.semana} icon="📅" />
              <StatCard label="Total histórico" value={stats.total} icon="📊" />
              <StatCard label="Plan actual" value="Gratuito" icon="⭐" isText />
            </div>

            {/* Quick actions */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Acciones rápidas</h2>
              <div className={s.actionsGrid}>
                <ActionCard
                  icon="⚙"
                  title="Configurar asistente"
                  desc="Actualiza el menú, horarios y datos de tu negocio"
                  onClick={() => navigate('/configurar')}
                />
                <ActionCard
                  icon="◉"
                  title="Probar bot"
                  desc="Habla con tu asistente antes de publicarlo"
                  onClick={() => navigate('/preview')}
                />
                <ActionCard
                  icon="{'</>'}"
                  title="Código para tu web"
                  desc="Copia el script y pégalo en tu página"
                  onClick={() => navigate('/configurar?tab=embed')}
                />
              </div>
            </div>
{/* Historial de conversaciones */}
<div className={s.section}>
  <h2 className={s.sectionTitle}>Últimas conversaciones</h2>
  <ConversacionesRecientes negocioId={negocio.id} />
</div>
            {/* Embed snippet */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Código para tu web</h2>
              <div className={s.embedCard}>
                <p className={s.embedDesc}>Copia este código y pégalo antes del <code>&lt;/body&gt;</code> de tu página web.</p>
                <EmbedCode token={negocio.token} />
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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: isText ? 20 : 32, fontWeight: 700, letterSpacing: '-0.5px', color: '#111', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#16a34a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{desc}</div>
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
      <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#374151', overflowX: 'auto', fontFamily: 'monospace', lineHeight: 1.6 }}>
        {code}
      </pre>
      <button onClick={copy} style={{ position: 'absolute', top: 10, right: 10, background: copied ? '#16a34a' : '#fff', color: copied ? '#fff' : '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function EmptyState({ navigate }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '56px 32px', textAlign: 'center', maxWidth: 500 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Configura tu primer asistente</h2>
      <p style={{ fontSize: 15, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
        Solo necesitas 10 minutos para tener un bot respondiendo por ti.
      </p>
      <button
        onClick={() => navigate('/configurar')}
        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
      >
        Configurar ahora →
      </button>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
function ConversacionesRecientes({ negocioId }) {
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('created_at', { ascending: false })
        .limit(20)
      setMensajes(data || [])
      setLoading(false)
    }
    load()
  }, [negocioId])

  if (loading) return <div style={{ color: '#9ca3af', fontSize: 14 }}>Cargando...</div>
  if (!mensajes.length) return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
      Aún no hay conversaciones. ¡Comparte tu widget para empezar!
    </div>
  )

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {mensajes.map((m, i) => (
        <div key={m.id} style={{
          padding: '14px 20px',
          borderBottom: i < mensajes.length - 1 ? '1px solid #f3f4f6' : 'none',
          display: 'flex', alignItems: 'flex-start', gap: 12
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            background: m.rol === 'user' ? '#dbeafe' : '#dcfce7',
            color: m.rol === 'user' ? '#1d4ed8' : '#16a34a',
            whiteSpace: 'nowrap', marginTop: 2
          }}>
            {m.rol === 'user' ? 'Cliente' : 'Bot'}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{m.mensaje}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
              {new Date(m.created_at).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
}
