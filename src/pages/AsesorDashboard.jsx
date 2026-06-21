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
  const [loading, setLoading] = useState(true)
  const [editandoCuenta, setEditandoCuenta] = useState(false)
  const [cuentaForm, setCuentaForm] = useState({ cuenta_banco: '', titular_cuenta: '', banco: '' })
  const [guardando, setGuardando] = useState(false)

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
      .select('nombre, plan, created_at, referido_en')
      .eq('asesor_id', asesorData.id)
      .order('created_at', { ascending: false })
    setReferidos(referidosData || [])

    setLoading(false)
  }

  async function guardarCuenta() {
    setGuardando(true)
    await supabase
      .from('asesores')
      .update(cuentaForm)
      .eq('id', asesor.id)
    setGuardando(false)
    setEditandoCuenta(false)
    loadData()
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!asesor) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 18, fontWeight: 700 }}>No tienes acceso de asesor</p>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Contacta al administrador para que te dé de alta.</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}>Ir al inicio</button>
    </div>
  )

  const mesActual = new Date().toISOString().slice(0, 7)
  const comisionesMesActual = comisiones.filter(c => c.periodo === mesActual)
  const totalMesActual = comisionesMesActual.reduce((acc, c) => acc + Number(c.monto_comision), 0)
  const totalPagado = cortes.filter(c => c.estado === 'pagado').reduce((acc, c) => acc + Number(c.total_comision), 0)
  const totalPendiente = cortes.filter(c => c.estado === 'abierto').reduce((acc, c) => acc + Number(c.total_comision), 0)
  const referidosActivos = referidos.filter(r => r.plan !== 'gratuito').length

  const enlaceReferido = `${window.location.origin}/?ref=${asesor.codigo}`

  function copiarEnlace() {
    navigator.clipboard.writeText(enlaceReferido)
    alert('¡Enlace copiado!')
  }

  return (
    <div className={s.page}>
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>ClienteAI</div>
        <p style={{ padding: '0 20px', fontSize: 12, color: '#9ca3af', marginTop: -8, marginBottom: 16 }}>Panel de Asesor</p>
        <nav className={s.sidebarNav}>
          <button className={`${s.navItem} ${s.navItemActive}`}>Mi Dashboard</button>
        </nav>
        <div style={{ marginTop: 'auto', padding: 20 }}>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cerrar sesión</button>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.greeting}>Hola, {asesor.nombre}</h1>
            <p className={s.subGreeting}>Aquí está el resumen de tus comisiones y referidos</p>
          </div>
        </div>

        {/* Enlace de referido */}
        <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 16, padding: 24, marginBottom: 24, color: '#fff' }}>
          <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Tu enlace de referido</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: 8, fontSize: 14, flex: 1, minWidth: 200, wordBreak: 'break-all' }}>{enlaceReferido}</code>
            <button onClick={copiarEnlace} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#fff', color: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>Copiar</button>
          </div>
          <p style={{ fontSize: 12, opacity: 0.85, marginTop: 12 }}>Ganas {asesor.comision_primer_mes}% el primer mes y {asesor.comision_recurrente}% en renovaciones de cada cliente que se registre con tu enlace.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="Comisión este mes" value={`$${totalMesActual.toFixed(2)} MXN`} color="#16a34a" />
          <StatCard label="Total pagado" value={`$${totalPagado.toFixed(2)} MXN`} color="#2563eb" />
          <StatCard label="Pendiente de pago" value={`$${totalPendiente.toFixed(2)} MXN`} color="#d97706" />
          <StatCard label="Clientes activos" value={referidosActivos} color="#7c3aed" />
        </div>

        {/* Datos bancarios */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Datos para transferencia</h3>
            {!editandoCuenta && <button onClick={() => setEditandoCuenta(true)} style={{ fontSize: 13, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Editar</button>}
          </div>
          {editandoCuenta ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Banco" value={cuentaForm.banco} onChange={e => setCuentaForm({ ...cuentaForm, banco: e.target.value })} style={inputStyle} />
              <input placeholder="Titular de la cuenta" value={cuentaForm.titular_cuenta} onChange={e => setCuentaForm({ ...cuentaForm, titular_cuenta: e.target.value })} style={inputStyle} />
              <input placeholder="CLABE interbancaria" value={cuentaForm.cuenta_banco} onChange={e => setCuentaForm({ ...cuentaForm, cuenta_banco: e.target.value })} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={guardarCuenta} disabled={guardando} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                <button onClick={() => setEditandoCuenta(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            asesor.cuenta_banco ? (
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
                <p><strong>Banco:</strong> {asesor.banco}</p>
                <p><strong>Titular:</strong> {asesor.titular_cuenta}</p>
                <p><strong>CLABE:</strong> {asesor.cuenta_banco}</p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Aún no has registrado tus datos bancarios. Agrégalos para recibir tus pagos por transferencia.</p>
            )
          )}
        </div>

        {/* Historial de cortes */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historial de cortes mensuales</h3>
          {cortes.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Aún no hay cortes generados.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 0' }}>Periodo</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cortes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 0' }}>{c.periodo}</td>
                    <td>${Number(c.total_comision).toFixed(2)} MXN</td>
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

        {/* Referidos */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Mis referidos ({referidos.length})</h3>
          {referidos.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Aún no tienes clientes referidos. Comparte tu enlace para empezar a ganar comisiones.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 0' }}>Negocio</th>
                  <th>Plan</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {referidos.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 0' }}>{r.nombre}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.plan}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 }}>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
    </div>
  )
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }
