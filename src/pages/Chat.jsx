import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { askClaude, detectarIdioma } from '../lib/claude'

// Genera una variante "vivida" (más saturada y luminosa) de un color hex,
// para que el chat se vea con vida aunque la marca use un color apagado.
function toVivid(hex) {
  try {
    let c = (hex || '').replace('#', '')
    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('')
    if (c.length !== 6) return '#22c55e'
    const r = parseInt(c.substr(0, 2), 16) / 255
    const g = parseInt(c.substr(2, 2), 16) / 255
    const b = parseInt(c.substr(4, 2), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    if (max === min) { h = s = 0 } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        default: h = (r - g) / d + 4
      }
      h /= 6
    }
    s = Math.max(s, 0.58)
    l = Math.min(Math.max(l, 0.46), 0.58)
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    let r2, g2, b2
    if (s === 0) { r2 = g2 = b2 = l } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r2 = hue2rgb(p, q, h + 1 / 3)
      g2 = hue2rgb(p, q, h)
      b2 = hue2rgb(p, q, h - 1 / 3)
    }
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0')
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`
  } catch {
    return '#22c55e'
  }
}

export default function Chat() {
  const { token } = useParams()
  const [negocio, setNegocio] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Se ejecuta solo al montar, para cargar los datos del negocio.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadNegocio() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  async function loadNegocio() {
    const { data } = await supabase.rpc('obtener_negocio_widget', { p_token: token })
    const negocioData = data?.[0]
    if (!negocioData) { setNotFound(true); setLoading(false); return }
    setNegocio(negocioData)
    const nombreBot = negocioData.nombre_bot || negocioData.nombre || 'Asistente'
    setMessages([{ role: 'assistant', content: `Hola! Soy ${nombreBot}${negocioData.nombre_bot ? `, el asistente de ${negocioData.nombre}` : ''}. ¿En qué te puedo ayudar?` }])
    setLoading(false)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || thinking || !negocio) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setThinking(true)
    setError('')

    // La Edge Function guarda las conversaciones y controla los límites
    try {
      const reply = await askClaude({
        messages: newMessages,
        negocio_id: negocio.id,
        idioma: detectarIdioma(),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.message || ''
      let botMsg = ''
      if (msg.includes('trial_vencido') || msg.includes('prueba')) {
        botMsg = '⏰ El período de prueba de este asistente ha vencido. Contacta al negocio para más información.'
      } else if (msg.includes('plan_vencido')) {
        botMsg = '🔴 El plan de este asistente ha vencido. Contacta al negocio para más información.'
      } else if (msg.includes('limite_alcanzado') || msg.includes('Límite') || msg.includes('429')) {
        botMsg = '⚠️ Este asistente ha alcanzado el límite de conversaciones del mes. Contacta al negocio para más información.'
      }
      if (botMsg) {
        setMessages(prev => [...prev, { role: 'assistant', content: botMsg }])
      } else {
        setError(msg)
      }
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '40px 32px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', maxWidth: 340 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>🔍</div>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: '0 0 6px' }}>Asistente no encontrado</p>
        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Verifica el enlace o contacta al negocio.</p>
      </div>
    </div>
  )

  const color = negocio.color || '#16a34a'
  const vivid = toVivid(color)

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#eef1f0', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', maxWidth: 600, margin: '0 auto', boxShadow: '0 0 40px rgba(0,0,0,0.08)' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}, ${vivid})`,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        position: 'relative',
        zIndex: 2,
        overflow: 'hidden',
      }}>
        {/* Blobs decorativos difuminados, dan profundidad sin depender del color de marca */}
        <div style={{ position: 'absolute', top: -40, right: -20, width: 130, height: 130, borderRadius: '50%', background: vivid, opacity: 0.35, filter: 'blur(28px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '30%', width: 100, height: 100, borderRadius: '50%', background: '#fff', opacity: 0.08, filter: 'blur(24px)', pointerEvents: 'none' }} />

        <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {negocio.nombre[0].toUpperCase()}
        </div>
        <div style={{ minWidth: 0, position: 'relative' }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 16, letterSpacing: -0.2, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{negocio.nombre}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Responde al instante
          </p>
        </div>
      </div>

      {/* Franja de acento debajo del header */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${vivid}, ${color}, ${vivid})`, backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite', flexShrink: 0 }} />

      {/* Mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        backgroundColor: '#eef1f0',
        backgroundImage: `radial-gradient(${vivid}33 1.5px, transparent 1.5px)`,
        backgroundSize: '20px 20px',
      }}>
        {messages.map((m, i) => (
          <div key={i} className="msgIn" style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: vivid, border: `1.5px solid ${vivid}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {negocio.nombre[0].toUpperCase()}
              </div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '11px 15px',
              borderRadius: 18,
              fontSize: 14.5,
              lineHeight: 1.55,
              background: m.role === 'user' ? `linear-gradient(135deg, ${vivid}, ${color})` : '#fff',
              color: m.role === 'user' ? '#fff' : '#1f2937',
              boxShadow: m.role === 'user' ? `0 3px 10px ${vivid}55` : '0 1px 4px rgba(0,0,0,0.08)',
              borderBottomRightRadius: m.role === 'user' ? 4 : 18,
              borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: vivid, border: `1.5px solid ${vivid}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {negocio.nombre[0].toUpperCase()}
            </div>
            <div style={{ background: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, padding: '13px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: vivid, opacity: 0.6, animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', fontSize: 13, color: '#dc2626', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            No se pudo enviar tu mensaje. Intenta de nuevo en unos segundos.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #eef0f2', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu mensaje..."
          disabled={thinking}
          maxLength={500}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 999,
            border: '1px solid #e5e7eb',
            fontSize: 14.5,
            outline: 'none',
            background: '#f7f8fa',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = vivid; e.target.style.boxShadow = `0 0 0 3px ${vivid}22` }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || thinking}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${vivid}, ${color})`,
            color: '#fff',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            opacity: !input.trim() || thinking ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: !input.trim() || thinking ? 'none' : `0 3px 12px ${vivid}66`,
            transition: 'transform 0.1s, box-shadow 0.15s',
          }}
          onMouseDown={e => { if (input.trim() && !thinking) e.currentTarget.style.transform = 'scale(0.92)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >↑</button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10.5, color: '#c1c5cb', padding: '7px 0', margin: 0, background: '#fff', letterSpacing: 0.2 }}>
        Powered by ClienteAI
      </p>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(134,239,172,0.55)} 70%{box-shadow:0 0 0 6px rgba(134,239,172,0)} 100%{box-shadow:0 0 0 0 rgba(134,239,172,0)} }
        @keyframes msgIn { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:0% 0} 100%{background-position:200% 0} }
        .msgIn { animation: msgIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
