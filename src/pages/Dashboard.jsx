import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Dashboard.module.css'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [stats, setStats] = useState({ hoy: 0, semana: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [asesores, setAsesores] = useState([])
  const [nuevoAsesor, setNuevoAsesor] = useState({ nombre: '', apellido: '', email: '', telefono: '', fechaNacimiento: '' })
  const [creandoAsesor, setCreandoAsesor] = useState(false)
  const [credencialesGeneradas, setCredencialesGeneradas] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    // Verificar rol admin desde la base de datos (no expuesto en el cliente)
    const { data: perfil } = await supabase.from('perfiles').select('is_admin').eq('user_id', session.user.id).single()
    const esAdmin = perfil?.is_admin === true
    setIsAdmin(esAdmin)

    // Si es asesor (y no admin), redirigir a su panel personal
    if (!esAdmin) {
      const { data: esAsesor } = await supabase.from('asesores').select('id').eq('user_id', session.user.id).maybeSingle()
      if (esAsesor) {
        navigate('/asesor', { replace: true })
        return
      }
    }

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
    if (esAdmin) {
      const { data: todos } = await supabase.from('negocios').select('*, asesores(nombre, codigo)').order('created_at', { ascending: false })
      setClientes(todos || [])
      const { data: todosAsesores } = await supabase.from('asesores').select('*').order('created_at', { ascending: false })
      setAsesores(todosAsesores || [])
    }
    setLoading(false)
  }

  async function crearAsesor() {
    if (!nuevoAsesor.nombre.trim() || !nuevoAsesor.apellido.trim() || !nuevoAsesor.email.trim() || !nuevoAsesor.fechaNacimiento) {
      alert('Completa nombre, apellido, correo y fecha de nacimiento del asesor')
      return
    }
    setCreandoAsesor(true)
    try {
      const { data, error } = await supabase.functions.invoke('crear-asesor', {
        body: {
          nombre: nuevoAsesor.nombre,
          apellido: nuevoAsesor.apellido,
          email: nuevoAsesor.email,
          telefono: nuevoAsesor.telefono,
          fechaNacimiento: nuevoAsesor.fechaNacimiento,
        }
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      setCredencialesGeneradas(data)
      setNuevoAsesor({ nombre: '', apellido: '', email: '', telefono: '', fechaNacimiento: '' })
      const { data: todosAsesores } = await supabase.from('asesores').select('*').order('created_at', { ascending: false })
      setAsesores(todosAsesores || [])
    } catch (err) {
      alert('Error al crear asesor: ' + err.message)
    } finally {
      setCreandoAsesor(false)
    }
  }

  async function cambiarPlan(negocioId, nuevoPlan) {
    await supabase.from('negocios').update({ plan: nuevoPlan }).eq('id', negocioId)
    const { data: todos } = await supabase.from('negocios').select('*, asesores(nombre, codigo)').order('created_at', { ascending: false })
    setClientes(todos || [])
  }

  async function eliminarAsesor(asesor) {
    if (!confirm(`¿Eliminar al asesor "${asesor.nombre}"? Su enlace de referido dejará de funcionar y se desvinculará de sus clientes.`)) return
    // Desvincular negocios referidos (no se borran, solo pierden el asesor)
    await supabase.from('negocios').update({ asesor_id: null }).eq('asesor_id', asesor.id)
    // Eliminar comisiones del asesor
    await supabase.from('comisiones').delete().eq('asesor_id', asesor.id)
    await supabase.from('cortes_comisiones').delete().eq('asesor_id', asesor.id)
    // Eliminar el asesor
    await supabase.from('asesores').delete().eq('id', asesor.id)
    const { data: todosAsesores } = await supabase.from('asesores').select('*').order('created_at', { ascending: false })
    setAsesores(todosAsesores || [])
    const { data: todos } = await supabase.from('negocios').select('*, asesores(nombre, codigo)').order('created_at', { ascending: false })
    setClientes(todos || [])
  }

  async function eliminarCliente(cliente) {
    if (!confirm(`¿Eliminar el negocio "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return
    await supabase.from('conversaciones').delete().eq('negocio_id', cliente.id)
    await supabase.from('comisiones').delete().eq('negocio_id', cliente.id)
    await supabase.from('negocios').delete().eq('id', cliente.id)
    const { data: todos } = await supabase.from('negocios').select('*, asesores(nombre, codigo)').order('created_at', { ascending: false })
    setClientes(todos || [])
  }

  async function handlePago(plan) {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          plan,
          negocio_id: negocio.id,
          success_url: 'https://clienteai.site/dashboard',
          cancel_url: 'https://clienteai.site/dashboard',
        }
      })
      if (error) throw error
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert('Error al procesar el pago. Intenta de nuevo.')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <PageLoader />

  const LIMITES = { gratuito: 50, pro: 2000, negocio: 5000 }
  const plan = negocio?.plan || 'gratuito'
  const limite = LIMITES[plan] || 50
  const usadas = negocio?.conversaciones_mes || 0
  const porcentaje = Math.min(100, (usadas / limite) * 100)
  const restantes = Math.max(0, limite - usadas)

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
          {negocio && <div className={s.statusBadge}><span className={s.statusDot} /> Bot activo</div>}
        </div>

        {!negocio ? <EmptyState navigate={navigate} /> : (
          <>
            {plan === 'gratuito' && (
              <div style={{ background: '#16a34a', borderRadius: 14, padding: '20px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#fff' }}>Mejora tu plan y atiende mas clientes</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Plan Pro desde $299 MXN/mes - 2,000 conversaciones al mes</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handlePago('pro')} style={{ background: '#fff', color: '#16a34a', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Pro $299/mes
                  </button>
                  <button onClick={() => handlePago('negocio')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Negocio $599/mes
                  </button>
                </div>
              </div>
            )}

            <div className={s.statsGrid}>
              <StatCard label="Conversaciones hoy" value={stats.hoy} icon="💬" />
              <StatCard label="Esta semana" value={stats.semana} icon="📅" />
              <StatCard label="Total historico" value={stats.total} icon="📊" />
              <StatCard label="Plan actual" value={plan.charAt(0).toUpperCase() + plan.slice(1)} icon="⭐" isText />
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Conversaciones este mes</span>
                <span style={{ fontSize: 13, color: porcentaje >= 80 ? '#dc2626' : 'var(--text-muted)' }}>{usadas} / {limite}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 8, background: porcentaje >= 80 ? '#dc2626' : '#16a34a', width: `${porcentaje}%`, transition: 'width 0.3s' }} />
              </div>
              {porcentaje >= 80 && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>Te quedan {restantes} conversaciones este mes.</p>
              )}
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
              <ConversacionesRecientes negocioId={negocio.id} plan={negocio.plan} />
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
                  <ChatLink token={negocio.token} />
                </div>
              </div>
            </div>
          </>
        )}

        {isAdmin && (
          <div className={s.section}>
            <h2 className={s.sectionTitle} style={{ color: '#dc2626' }}>Panel de Administracion</h2>
            <div style={{ background: 'var(--bg-card)', border: '2px solid #dc2626', borderRadius: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#dc2626', color: '#fff' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Negocio</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Asesor</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Conv. mes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Plan actual</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cambiar plan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{c.nombre || 'Sin nombre'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {c.asesores ? (
                          <span>{c.asesores.nombre}<br /><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#7c3aed' }}>{c.asesores.codigo}</span></span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{c.conversaciones_mes || 0}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: c.plan === 'pro' ? '#dbeafe' : c.plan === 'negocio' ? '#fef9c3' : '#dcfce7', color: c.plan === 'pro' ? '#1d4ed8' : c.plan === 'negocio' ? '#854d0e' : '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {c.plan || 'gratuito'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <select value={c.plan || 'gratuito'} onChange={e => cambiarPlan(c.id, e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <option value="gratuito">Gratuito</option>
                          <option value="pro">Pro</option>
                          <option value="negocio">Negocio</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button onClick={() => eliminarCliente(c)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑 Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className={s.section}>
            <h2 className={s.sectionTitle} style={{ color: '#7c3aed' }}>Asesores</h2>

            {credencialesGeneradas && (
              <div style={{ background: '#faf5ff', border: '2px solid #7c3aed', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#6b21a8', marginBottom: 10 }}>
                  ✅ Asesor "{credencialesGeneradas.nombreCompleto}" registrado.
                  {credencialesGeneradas.correoEnviado
                    ? ' Se le envió un correo con su código y el enlace para activar su cuenta.'
                    : ' ⚠️ No se pudo confirmar el envío del correo — comparte estos datos manualmente:'}
                </p>
                <div style={{ background: '#fff', borderRadius: 10, padding: 14, fontSize: 14, fontFamily: 'monospace', lineHeight: 2 }}>
                  <p style={{ margin: 0 }}><strong>Código de asesor:</strong> {credencialesGeneradas.codigo}</p>
                  <p style={{ margin: 0 }}><strong>Enlace de activación:</strong> https://clienteai.site/activar-asesor?codigo={credencialesGeneradas.codigo}</p>
                  <p style={{ margin: 0 }}><strong>Estado:</strong> Pendiente (se activa cuando el asesor crea su contraseña)</p>
                </div>
                <button onClick={() => setCredencialesGeneradas(null)} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Entendido</button>
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Registrar nuevo asesor</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  placeholder="Nombre"
                  value={nuevoAsesor.nombre}
                  onChange={e => setNuevoAsesor({ ...nuevoAsesor, nombre: e.target.value })}
                  style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <input
                  placeholder="Apellido"
                  value={nuevoAsesor.apellido}
                  onChange={e => setNuevoAsesor({ ...nuevoAsesor, apellido: e.target.value })}
                  style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <input
                  placeholder="Correo electrónico"
                  type="email"
                  value={nuevoAsesor.email}
                  onChange={e => setNuevoAsesor({ ...nuevoAsesor, email: e.target.value })}
                  style={{ flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <input
                  placeholder="Teléfono"
                  value={nuevoAsesor.telefono}
                  onChange={e => setNuevoAsesor({ ...nuevoAsesor, telefono: e.target.value })}
                  style={{ flex: 1, minWidth: 140, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={nuevoAsesor.fechaNacimiento}
                    onChange={e => setNuevoAsesor({ ...nuevoAsesor, fechaNacimiento: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button onClick={crearAsesor} disabled={creandoAsesor} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer', height: 'fit-content', alignSelf: 'flex-end' }}>
                  {creandoAsesor ? 'Creando...' : 'Crear asesor'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>El código de acceso se genera automáticamente (formato CAI2026-XXNNNNNN). Se le enviará un correo con sus instrucciones de activación.</p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '2px solid #7c3aed', borderRadius: 14, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: '#7c3aed', color: '#fff' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Asesor</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Código</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Teléfono</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>F. Nacimiento</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Banco</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Titular</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>N° Cuenta</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>CLABE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Comisión 1er mes</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Comisión recurrente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asesores.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Aún no hay asesores registrados.</td></tr>
                  ) : asesores.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{a.nombre}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.email}</span></td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.codigo}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.telefono || '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.fecha_nacimiento ? new Date(a.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-MX') : '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.banco || '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.titular_cuenta || '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.numero_cuenta || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#7c3aed', fontFamily: 'monospace', fontWeight: 600 }}>{a.clabe || '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.comision_primer_mes}%</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{a.comision_recurrente}%</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: a.estado === 'activo' ? '#dcfce7' : '#fef3c7', color: a.estado === 'activo' ? '#15803d' : '#92400e', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {a.estado === 'activo' ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button onClick={() => eliminarAsesor(a)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑 Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
  const code = `<script src="https://clienteai.site/widget.js" data-token="${token}"></script>`
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

function ChatLink({ token }) {
  const [copied, setCopied] = useState(false)
  const url = `https://clienteai.site/chat/${token}`
  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      <pre style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)', overflowX: 'auto', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
        {url}
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

function ConversacionesRecientes({ negocioId, plan }) {
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)

  const limite = 1000

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('conversaciones').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }).limit(limite)
      setMensajes(data || [])
      setLoading(false)
    }
    load()
  }, [negocioId, limite])

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