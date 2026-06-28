import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { askClaude, buildSystemPrompt, detectarIdioma } from '../lib/claude'

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

  useEffect(() => { loadNegocio() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  async function loadNegocio() {
    const { data } = await supabase.from('negocios').select('*').eq('token', token).single()
    if (!data) { setNotFound(true); setLoading(false); return }
    setNegocio(data)
    setMessages([{ role: 'assistant', content: `Hola! Soy el asistente de ${data.nombre}. En que te puedo ayudar?` }])
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
        systemPrompt: buildSystemPrompt(negocio, detectarIdioma()),
        messages: newMessages,
        negocio_id: negocio.id,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Límite') || msg.includes('limite') || msg.includes('429')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ Este asistente ha alcanzado el límite de conversaciones del mes. Por favor contacta al negocio para más información.`
        }])
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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <p style={{ color: '#6b7280' }}>Asistente no encontrado.</p>
      </div>
    </div>
  )

  const color = negocio.color || '#16a34a'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          {negocio.nombre[0]}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 16 }}>{negocio.nombre}</p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', display: 'inline-block' }} />
            En linea
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {negocio.nombre[0]}
              </div>
            )}
            <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.6, background: m.role === 'user' ? color : '#fff', color: m.role === 'user' ? '#fff' : '#111', border: m.role === 'assistant' ? '1px solid #e5e7eb' : 'none', borderBottomRightRadius: m.role === 'user' ? 4 : 16, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 16 }}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{negocio.nombre[0]}</div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, borderBottomLeftRadius: 4, padding: '10px 14px' }}>
              <span style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#d1d5db', animation: 'bounce 1.2s infinite', animationDelay: `${i*0.2}s` }} />)}
              </span>
            </div>
          </div>
        )}
        {error && <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>Error: {error}</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu mensaje..."
          disabled={thinking}
          maxLength={500}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#f9fafb' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || thinking}
          style={{ width: 40, height: 40, borderRadius: '50%', background: color, color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', opacity: !input.trim() || thinking ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >↑</button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#d1d5db', padding: '6px 0', margin: 0, background: '#fff' }}>
        Powered by ClienteAI
      </p>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
    </div>
  )
}