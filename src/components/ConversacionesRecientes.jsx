import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ConversacionesRecientes({ negocioId }) {
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
