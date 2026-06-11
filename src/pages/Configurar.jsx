import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import s from './Configurar.module.css'

const CAMPOS = [
  { key: 'nombre', label: 'Nombre del negocio', placeholder: 'Ej: Tacos El Gordo', required: true, type: 'input' },
  { key: 'descripcion', label: '¿A qué se dedica tu negocio?', placeholder: 'Ej: Taquería de comida mexicana en Puebla', type: 'input' },
  { key: 'menu', label: 'Menú o servicios con precios', placeholder: 'Ej:\nTaco de pastor: $25\nQuesadilla: $40\nAgua fresca: $20', type: 'textarea' },
  { key: 'horario', label: 'Horario de atención', placeholder: 'Ej: Lunes a domingo de 9am a 11pm', type: 'input' },
  { key: 'direccion', label: 'Dirección', placeholder: 'Ej: Blvd. Atlixcáyotl 2301, Puebla', type: 'input' },
  { key: 'telefono', label: 'Teléfono / WhatsApp', placeholder: 'Ej: 222-555-0134', type: 'input' },
  { key: 'extra', label: 'Información adicional (opcional)', placeholder: 'Ej: Aceptamos pedidos por WhatsApp, contamos con estacionamiento, etc.', type: 'textarea' },
]

function generateToken() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

export default function Configurar({ session }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', descripcion: '', menu: '', horario: '', direccion: '', telefono: '', extra: '' })
  const [negocioId, setNegocioId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNegocio()
  }, [])

  async function loadNegocio() {
    const { data } = await supabase
      .from('negocios')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

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

    const payload = {
      ...form,
      user_id: session.user.id,
      updated_at: new Date().toISOString(),
    }

    let result
    if (negocioId) {
      result = await supabase.from('negocios').update(payload).eq('id', negocioId).select().single()
    } else {
      result = await supabase.from('negocios').insert({ ...payload, token: generateToken() }).select().single()
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
        <div className={s.sidebarLogo}>✦ ClienteAI</div>
        <nav className={s.sidebarNav}>
          <button className={s.navItem} onClick={() => navigate('/dashboard')}>⊞ Dashboard</button>
          <button className={`${s.navItem} ${s.navItemActive}`}>⚙ Mi asistente</button>
          <button className={s.navItem} onClick={() => navigate('/preview')}>◉ Vista previa</button>
        </nav>
      </aside>

      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Configura tu asistente</h1>
            <p className={s.subtitle}>Cuéntanos sobre tu negocio y la IA aprenderá a responder por ti</p>
          </div>
          <button className={s.previewBtn} onClick={() => navigate('/preview')}>
            Vista previa →
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
                  <textarea
                    className={s.textarea}
                    placeholder={campo.placeholder}
                    value={form[campo.key]}
                    onChange={e => handleChange(campo.key, e.target.value)}
                    rows={5}
                  />
                ) : (
                  <input
                    className={s.input}
                    type="text"
                    placeholder={campo.placeholder}
                    value={form[campo.key]}
                    onChange={e => handleChange(campo.key, e.target.value)}
                    required={campo.required}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className={s.error}>{error}</div>}

          <div className={s.formActions}>
            {saved && <span className={s.savedMsg}>✓ Guardado correctamente</span>}
            <button type="submit" className={s.btnSave} disabled={saving}>
              {saving ? 'Guardando...' : negocioId ? 'Guardar cambios' : 'Crear asistente'}
            </button>
          </div>
        </form>

        {/* Info box */}
        <div className={s.infoBox}>
          <div className={s.infoIcon}>💡</div>
          <div>
            <p className={s.infoTitle}>¿Cómo funciona?</p>
            <p className={s.infoText}>La IA usa la información que escribas aquí para responder a tus clientes. Mientras más completa sea, mejor responderá. Puedes actualizar esto cuando quieras.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
