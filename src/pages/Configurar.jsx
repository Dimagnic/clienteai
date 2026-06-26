import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Configurar.module.css'

const CAMPOS = [
  { key: 'nombre', label: 'Nombre del negocio', placeholder: 'Ej: Tacos El Gordo', required: true, type: 'input' },
  { key: 'descripcion', label: 'A que se dedica tu negocio?', placeholder: 'Ej: Taqueria de comida mexicana en Puebla', type: 'input' },
  { key: 'menu', label: 'Menu o servicios con precios', placeholder: 'Ej:\nTaco de pastor: $25\nQuesadilla: $40\nAgua fresca: $20', type: 'textarea' },
  { key: 'horario', label: 'Horario de atencion', placeholder: 'Ej: Lunes a domingo de 9am a 11pm', type: 'input' },
  { key: 'direccion', label: 'Direccion', placeholder: 'Ej: Blvd. Atlixcayotl 2301, Puebla', type: 'input' },
  { key: 'telefono', label: 'Telefono / WhatsApp', placeholder: 'Ej: 222-555-0134', type: 'input' },
  { key: 'extra', label: 'Informacion adicional (opcional)', placeholder: 'Ej: Aceptamos pedidos por WhatsApp, contamos con estacionamiento, etc.', type: 'textarea' },
]

const COLORES = [
  { valor: '#16a34a', nombre: 'Verde' },
  { valor: '#2563eb', nombre: 'Azul' },
  { valor: '#dc2626', nombre: 'Rojo' },
  { valor: '#9333ea', nombre: 'Morado' },
  { valor: '#ea580c', nombre: 'Naranja' },
  { valor: '#0891b2', nombre: 'Cyan' },
  { valor: '#be185d', nombre: 'Rosa' },
  { valor: '#111827', nombre: 'Negro' },
]

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

export default function Configurar({ session }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const asistenteId = searchParams.get('id')
  const [form, setForm] = useState({ nombre: '', descripcion: '', menu: '', horario: '', direccion: '', telefono: '', extra: '', color: '#16a34a' })
  const [negocioId, setNegocioId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadNegocio() }, [asistenteId])

  async function loadNegocio() {
    let data
    if (asistenteId) {
      const res = await supabase.from('negocios').select('*').eq('id', asistenteId).eq('user_id', session.user.id).single()
      data = res.data
    } else {
      const res = await supabase.from('negocios').select('*').eq('user_id', session.user.id).order('asistente_num', { ascending: true }).limit(1).single()
      data = res.data
    }
    if (data) {
      setNegocioId(data.id)
      setForm({
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        menu: data.menu || '',
        horario: data.horario || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        extra: data.extra || '',
        color: data.color || '#16a34a',
      })
    }
    setLoading(false)
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre del negocio es obligatorio.'); return }
    setSaving(true)
    setError('')
    const payload = { ...form, user_id: session.user.id, updated_at: new Date().toISOString() }
    let result
    if (negocioId) {
      result = await supabase.from('negocios').update(payload).eq('id', negocioId).select().single()
    } else {
      // Si el usuario llegó con un enlace de referido (?ref=codigo), lo asociamos al asesor
      const refCodigo = localStorage.getItem('cai_ref')
      let asesorId = null
      if (refCodigo) {
        const { data: asesor } = await supabase.from('asesores').select('id').eq('codigo', refCodigo).eq('activo', true).maybeSingle()
        if (asesor) asesorId = asesor.id
      }
      result = await supabase.from('negocios').insert({
        ...payload,
        token: generateToken(),
        asesor_id: asesorId,
        referido_en: asesorId ? new Date().toISOString() : null,
      }).select().single()
      if (asesorId) localStorage.removeItem('cai_ref')
    }
    if (result.error) {
      setError(result.error.message)
    } else {
      if (!negocioId) setNegocioId(result.data.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className={s.page}>
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>ClienteAI</div>
        <nav className={s.sidebarNav}>
          <button className={s.navItem} onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className={`${s.navItem} ${s.navItemActive}`}>Mi asistente</button>
          <button className={s.navItem} onClick={() => navigate('/preview')}>Vista previa</button>
        </nav>
      </aside>

      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Configura tu asistente</h1>
            <p className={s.subtitle}>Cuentanos sobre tu negocio y la IA aprendera a responder por ti</p>
          </div>
          <button className={s.previewBtn} onClick={() => navigate('/preview')}>
            Vista previa
          </button>
        </div>

        <form onSubmit={handleSave} className={s.form}>
          <div className={s.formGrid}>
            {CAMPOS.map(campo => (
              <div key={campo.key} className={`${s.field} ${campo.type === 'textarea' ? s.fieldFull : ''}`}>
                <label className={s.label}>
                  {campo.label}
                  {campo.required && <span className={s.required}> *</span>}
                </label>
                {campo.type === 'textarea' ? (
                  <textarea className={s.textarea} placeholder={campo.placeholder} value={form[campo.key]} onChange={e => handleChange(campo.key, e.target.value)} rows={5} />
                ) : (
                  <input className={s.input} type="text" placeholder={campo.placeholder} value={form[campo.key]} onChange={e => handleChange(campo.key, e.target.value)} required={campo.required} />
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className={s.label} style={{ marginBottom: 12, display: 'block' }}>Color del widget</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLORES.map(c => (
                <button
                  key={c.valor}
                  type="button"
                  title={c.nombre}
                  onClick={() => handleChange('color', c.valor)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', background: c.valor, border: form.color === c.valor ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer', transition: 'transform 0.15s', transform: form.color === c.valor ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Color seleccionado: <span style={{ color: form.color, fontWeight: 700 }}>{COLORES.find(c => c.valor === form.color)?.nombre || 'Personalizado'}</span>
            </p>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <div className={s.formActions}>
            {saved && <span className={s.savedMsg}>Guardado correctamente</span>}
            <button type="submit" className={s.btnSave} disabled={saving}>
              {saving ? 'Guardando...' : negocioId ? 'Guardar cambios' : 'Crear asistente'}
            </button>
          </div>
        </form>

        <div className={s.infoBox}>
          <div className={s.infoIcon}>💡</div>
          <div>
            <p className={s.infoTitle}>Como funciona?</p>
            <p className={s.infoText}>La IA usa la informacion que escribas aqui para responder a tus clientes. Mientras mas completa sea, mejor respondera. Puedes actualizar esto cuando quieras.</p>
          </div>
        </div>
      </main>
    </div>
  )
}