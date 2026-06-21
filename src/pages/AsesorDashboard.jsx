import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Dashboard.module.css'

export default function AsesorDashboard({ session }) {
  const navigate = useNavigate()
  const [asesor, setAsesor] = useState(null)
  const [comisiones, setComisiones] = useState([])
  const [cortes, setCortes] = useState([])
  const [referidos, setReferidos] = useState([])
  const [tieneNegocioPropio, setTieneNegocioPropio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editandoCuenta, setEditandoCuenta] = useState(false)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [cuentaForm, setCuentaForm] = useState({ cuenta_banco: '', titular_cuenta: '', banco: '' })
  const [perfilForm, setPerfilForm] = useState({ nombre: '', telefono: '' })
  const [guardando, setGuardando] = useState(false)
  const [tabActivo, setTabActivo] = useState('resumen')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: asesorData } = await supabase
      .from('asesores')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!asesorData) { setLoading(false); return }
    setAsesor(asesorData)
    setCuentaForm({
      cuenta_banco: asesorData.cuenta_banco || '',
      titular_cuenta: asesorData.titular_cuenta || '',
      banco: asesorData.banco || '',
    })
    setPerfilForm({
      nombre: asesorData.nombre || '',
      telefono: asesorData.telefono || '',
    })

    const { data: comisionesData } = await supabase
      .from('comisiones')
      .select('*, negocios(nombre)')
      .eq('asesor_id', asesorData.id)
      .order('created_at', { ascending: false })
    setComisiones(comisionesData || [])

    const { data: cortesData } = await supabase
      .from('cortes_comisiones')
      .select('*')
      .eq('asesor_id', asesorData.id)
      .order('periodo', { ascending: false })
    setCortes(cortesData || [])

    const { data: referidosData } = await supabase
      .from('negocios')
      .select('id, nombre, plan, created_at, referido_en, plan_renueva_en, activo')
      .eq('asesor_id', asesorData.id)
      .order('created_at', { ascending: false })
    setReferidos(referidosData || [])

    const { data: negocioPropio } = await supabase
      .from('negocios')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    setTieneNegocioPropio(!!negocioPropio)

    setLoading(false)
  }

  async function guardarCuenta() {
    setGuardando(true)
    await supabase.from('asesores').update(cuentaForm).eq('id', asesor.id)
    setGuardando(false)
    setEditandoCuenta(false)
    loadData()
  }

  async function guardarPerfil() {
    setGuardando(true)
    await supabase.from('asesores').update(perfilForm).eq('id', asesor.id)
    setGuardando(false)
    setEditandoPerfil(false)
    loadData()
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!asesor) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 18, fontWeight: 700 }}>No tienes acceso de asesor</p>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Contacta al administrador para que te dé de alta.</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}>Ir al inicio</button>
    </div>
  )

  const mesActual = new Date().toISOString().slice(0, 7)
  const comisionesMesActual = comisiones.filter(c => c.periodo === mesActual)
  const totalMesActual = comisionesMesActual.reduce((acc, c) => acc + Number(c.monto_comision), 0)
  const totalPagado = cortes.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + Number(c.total_comision), 0)
  const totalPendiente = cortes.filter(c => c.estado === 'abierto').reduce((acc, c) => acc + Number(c.total_comision), 0)
  const referidosActivos = referidos.filter(r => r.plan !== 'gratuito').length
  const referidosGratuitos = referidos.filter(r => r.plan === 'gratuito').length

  // Próximos vencimientos (30 días)
  const hoy = new Date()
  const en30dias = new Date(hoy.getTime() + 30 * 86400000)
  const proximosVencimientos = referidos
    .filter(r => r.plan_renueva_en && new Date(r.plan_renueva_en) <= en30dias && new Date(r.plan_renueva_en) >= hoy)
    .sort((a, b) => new Date(a.plan_renueva_en) - new Date(b.plan_renueva_en))

  const enlaceReferido = `${window.location.origin}/?ref=${asesor.codigo}`

  function copiarEnlace() {
    navigator.clipboard.writeText(enlaceReferido)
    alert('¡Enlace copiado!')
  }

  function diasParaVencer(fecha) {
    const dias = Math.ceil((new Date(fecha) - hoy) / 86400000)
    return dias
  }

  return (
    <div className={s.page}>
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>ClienteAI</div>
        <p style={{ padding: '0 20px', fontSize: 11, color: '#9ca3af', marginTop: -8, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Panel de Asesor</p>
        <nav className={s.sidebarNav}>
          <button className={`${s.navItem} ${tabActivo === 'resumen' ? s.navItemActive : ''}`} onClick={() => setTabActivo('resumen')}>Resumen</button>
          <button className={`${s.navItem} ${tabActivo === 'referidos' ? s.navItemActive : ''}`} onClick={() => setTabActivo('referidos')}>Mis referidos</button>
          <button className={`${s.navItem} ${tabActivo === 'comisiones' ? s.navItemActive : ''}`} onClick={() => setTabActivo('comisiones')}>Comisiones</button>
          <button className={`${s.navItem} ${tabActivo === 'marketing' ? s.navItemActive : ''}`} onClick={() => setTabActivo('marketing')}>Material publicitario</button>
          <button className={`${s.navItem} ${tabActivo === 'perfil' ? s.navItemActive : ''}`} onClick={() => setTabActivo('perfil')}>Mi perfil</button>
          {!tieneNegocioPropio && (
            <button className={s.navItem} onClick={() => navigate('/configurar')} style={{ color: '#16a34a', fontWeight: 700 }}>+ Crear mi propio bot</button>
          )}
        </nav>
        <div style={{ marginTop: 'auto', padding: 20 }}>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cerrar sesión</button>
        </div>
      </aside>

      <main className={s.main}>
        {/* Header con datos personales */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>
              {asesor.nombre?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{asesor.nombre}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{asesor.email}{asesor.telefono ? ` · ${asesor.telefono}` : ''}</p>
              <p style={{ fontSize: 12, color: '#7c3aed', margin: '2px 0 0', fontFamily: 'monospace', fontWeight: 700 }}>Código: {asesor.codigo}</p>
            </div>
          </div>
        </div>

        {/* Enlace de referido — siempre visible */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', borderRadius: 16, padding: 24, marginBottom: 24, color: '#fff' }}>
          <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Tu enlace de referido</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: 8, fontSize: 14, flex: 1, minWidth: 200, wordBreak: 'break-all' }}>{enlaceReferido}</code>
            <button onClick={copiarEnlace} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>Copiar</button>
          </div>
          <p style={{ fontSize: 12, opacity: 0.85, marginTop: 12 }}>Ganas {asesor.comision_primer_mes}% el primer mes y {asesor.comision_recurrente}% en cada renovación de los clientes que se registren con tu enlace.</p>
        </div>

        {tabActivo === 'resumen' && (
          <>
            {/* Stats principales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard label="Comisión este mes" value={`$${totalMesActual.toFixed(2)}`} sub="MXN" color="#7c3aed" />
              <StatCard label="Total pagado" value={`$${totalPagado.toFixed(2)}`} sub="MXN histórico" color="#2563eb" />
              <StatCard label="Pendiente de pago" value={`$${totalPendiente.toFixed(2)}`} sub="MXN" color="#d97706" />
              <StatCard label="Clientes de pago" value={referidosActivos} sub={`+ ${referidosGratuitos} en gratuito`} color="#16a34a" />
            </div>

            {/* Próximos vencimientos */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>⏰ Próximos vencimientos (30 días)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Da seguimiento a estos clientes antes de que venza su plan, para asegurar la renovación.</p>
              {proximosVencimientos.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay vencimientos próximos en los siguientes 30 días.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proximosVencimientos.map(r => {
                    const dias = diasParaVencer(r.plan_renueva_en)
                    const urgente = dias <= 5
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: urgente ? '#fef2f2' : '#fafaf9', border: `1px solid ${urgente ? '#fecaca' : '#e5e7eb'}` }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#111' }}>{r.nombre}</p>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, textTransform: 'capitalize' }}>Plan {r.plan}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: urgente ? '#dc2626' : '#d97706', background: urgente ? '#fee2e2' : '#fef3c7', padding: '4px 10px', borderRadius: 20 }}>
                          {dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tabActivo === 'referidos' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Mis referidos ({referidos.length})</h3>
            {referidos.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aún no tienes clientes referidos. Comparte tu enlace para empezar a ganar comisiones.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 0' }}>Negocio</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Cliente desde</th>
                      <th>Próxima renovación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referidos.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-primary)', fontWeight: 600 }}>{r.nombre}</td>
                        <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{r.plan}</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.activo ? '#dcfce7' : '#fee2e2', color: r.activo ? '#15803d' : '#dc2626' }}>
                            {r.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString('es-MX')}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.plan_renueva_en ? new Date(r.plan_renueva_en).toLocaleDateString('es-MX') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tabActivo === 'comisiones' && (
          <>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Historial de cortes mensuales</h3>
              {cortes.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aún no hay cortes generados. Se generan automáticamente el día 1 de cada mes.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 0' }}>Periodo</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cortes.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{c.periodo}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>${Number(c.total_comision).toFixed(2)} MXN</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.estado === 'pagado' ? '#dcfce7' : '#fef3c7', color: c.estado === 'pagado' ? '#15803d' : '#92400e' }}>
                            {c.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Detalle de comisiones generadas</h3>
              {comisiones.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aún no tienes comisiones registradas.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '8px 0' }}>Cliente</th>
                        <th>Tipo</th>
                        <th>Monto pago</th>
                        <th>%</th>
                        <th>Comisión</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comisiones.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{c.negocios?.nombre || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.tipo === 'primer_mes' ? '1er mes' : 'Renovación'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>${Number(c.monto_pago).toFixed(2)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.porcentaje}%</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${Number(c.monto_comision).toFixed(2)}</td>
                          <td>
                            <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: c.elegible ? '#dcfce7' : '#f3f4f6', color: c.elegible ? '#15803d' : '#6b7280' }}>
                              {c.elegible ? 'Elegible' : 'En espera (7 días)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Datos bancarios */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Datos para transferencia</h3>
                {!editandoCuenta && <button onClick={() => setEditandoCuenta(true)} style={{ fontSize: 13, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Editar</button>}
              </div>
              {editandoCuenta ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input placeholder="Banco" value={cuentaForm.banco} onChange={e => setCuentaForm({ ...cuentaForm, banco: e.target.value })} style={inputStyle} />
                  <input placeholder="Titular de la cuenta" value={cuentaForm.titular_cuenta} onChange={e => setCuentaForm({ ...cuentaForm, titular_cuenta: e.target.value })} style={inputStyle} />
                  <input placeholder="CLABE interbancaria" value={cuentaForm.cuenta_banco} onChange={e => setCuentaForm({ ...cuentaForm, cuenta_banco: e.target.value })} style={inputStyle} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={guardarCuenta} disabled={guardando} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                    <button onClick={() => setEditandoCuenta(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                asesor.cuenta_banco ? (
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <p><strong>Banco:</strong> {asesor.banco}</p>
                    <p><strong>Titular:</strong> {asesor.titular_cuenta}</p>
                    <p><strong>CLABE:</strong> {asesor.cuenta_banco}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aún no has registrado tus datos bancarios. Agrégalos para recibir tus pagos por transferencia.</p>
                )
              )}
            </div>
          </>
        )}

        {tabActivo === 'marketing' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>📣 Material publicitario</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Usa estos banners para promocionar tu enlace en Facebook, Instagram y WhatsApp. Cada uno ya incluye tu código de referido.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <BannerCard titulo="Historia (9:16)" desc="Para Instagram/Facebook Stories" color="#7c3aed" codigo={asesor.codigo} formato="story" />
              <BannerCard titulo="Post cuadrado (1:1)" desc="Para feed de Instagram/Facebook" color="#2563eb" codigo={asesor.codigo} formato="post" />
              <BannerCard titulo="WhatsApp (4:3)" desc="Para enviar directo por WhatsApp" color="#16a34a" codigo={asesor.codigo} formato="whatsapp" />
            </div>

            <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6b21a8', marginBottom: 8 }}>💬 Textos sugeridos para acompañar tus publicaciones</p>
              <TextoSugerido texto={`¿Tu negocio pierde clientes por no contestar rápido? 🤖 Crea tu asistente de WhatsApp con IA en minutos. Pruébalo gratis 👉 ${enlaceReferido}`} />
              <TextoSugerido texto={`Deja de contestar lo mismo todo el día. Automatiza horarios, precios y dudas frecuentes con IA. Empieza gratis aquí: ${enlaceReferido}`} />
            </div>
          </div>
        )}

        {tabActivo === 'perfil' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Mi perfil</h3>
              {!editandoPerfil && <button onClick={() => setEditandoPerfil(true)} style={{ fontSize: 13, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Editar</button>}
            </div>
            {editandoPerfil ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nombre completo</label>
                <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} style={inputStyle} />
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Teléfono</label>
                <input value={perfilForm.telefono} onChange={e => setPerfilForm({ ...perfilForm, telefono: e.target.value })} placeholder="10 dígitos" style={inputStyle} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button onClick={guardarPerfil} disabled={guardando} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                  <button onClick={() => setEditandoPerfil(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <p><strong>Nombre:</strong> {asesor.nombre}</p>
                <p><strong>Correo:</strong> {asesor.email}</p>
                <p><strong>Teléfono:</strong> {asesor.telefono || 'No registrado'}</p>
                <p><strong>Código de referido:</strong> <span style={{ fontFamily: 'monospace', color: '#7c3aed', fontWeight: 700 }}>{asesor.codigo}</span></p>
                <p><strong>Comisión 1er mes:</strong> {asesor.comision_primer_mes}%</p>
                <p><strong>Comisión renovación:</strong> {asesor.comision_recurrente}%</p>
                <p><strong>Asesor desde:</strong> {new Date(asesor.created_at).toLocaleDateString('es-MX')}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function TextoSugerido({ texto }) {
  function copiar() {
    navigator.clipboard.writeText(texto)
    alert('Texto copiado')
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #e9d5ff' }}>
      <p style={{ fontSize: 12, color: '#374151', flex: 1, margin: 0 }}>{texto}</p>
      <button onClick={copiar} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Copiar</button>
    </div>
  )
}

function BannerCard({ titulo, desc, color, codigo, formato }) {
  const dims = formato === 'story' ? { w: 270, h: 480 } : formato === 'post' ? { w: 320, h: 320 } : { w: 320, h: 240 }

  function descargar() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${dims.w * 3}" height="${dims.h * 3}" viewBox="0 0 ${dims.w * 3} ${dims.h * 3}">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${color}" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" rx="24" />
        <text x="50%" y="35%" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#fff">ClienteAI</text>
        <text x="50%" y="48%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#fff" opacity="0.95">Asistente de WhatsApp</text>
        <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#fff" opacity="0.95">con Inteligencia Artificial</text>
        <rect x="15%" y="68%" width="70%" height="60" rx="30" fill="#fff" />
        <text x="50%" y="73%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${color}">Pruébalo GRATIS</text>
        <text x="50%" y="88%" text-anchor="middle" font-family="monospace" font-size="22" fill="#fff" opacity="0.85">Código: ${codigo}</text>
      </svg>
    `
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clienteai-banner-${formato}-${codigo}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ width: '100%', aspectRatio: `${dims.w}/${dims.h}`, background: `linear-gradient(135deg, ${color}, #1e1b4b)`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 10, padding: 12 }}>
        <p style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>ClienteAI</p>
        <p style={{ fontSize: 11, opacity: 0.9, margin: '4px 0 12px', textAlign: 'center' }}>Asistente de WhatsApp con IA</p>
        <div style={{ background: '#fff', color, borderRadius: 14, padding: '5px 12px', fontSize: 11, fontWeight: 700 }}>Pruébalo GRATIS</div>
        <p style={{ fontSize: 9, opacity: 0.8, marginTop: 8, fontFamily: 'monospace' }}>Código: {codigo}</p>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{titulo}</p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>{desc}</p>
      <button onClick={descargar} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Descargar</button>
    </div>
  )
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }
