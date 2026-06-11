import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { askClaude, buildSystemPrompt } from '../lib/claude'
import s from './Preview.module.css'

export default function Preview({ session }) {
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
  window.scrollTo(0, 0)
  loadNegocio()
}, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function loadNegocio() {
    const { data } = await supabase
      .from('negocios')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (data) {
      setNegocio(data)
      setMessages([{
        role: 'assistant',
        content: `¡Hola! Soy el asistente de ${data.nombre} 👋 ¿En qué te puedo ayudar?`
      }])
    }
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

    // Guardar conversación en Supabase
    await supabase.from('conversaciones').insert({
      negocio_id: negocio.id,
      mensaje: text,
      rol: 'user'
    })

    try {
      const systemPrompt = buildSystemPrompt(negocio)
      const reply = await askClaude({
        systemPrompt,
        messages: newMessages
      })

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])

      // Guardar respuesta
      await supabase.from('conversaciones').insert({
        negocio_id: negocio.id,
        mensaje: reply,
        rol: 'assistant'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function resetChat() {
    setMessages([{
      role: 'assistant',
      content: `¡Hola! Soy el asistente de ${negocio.nombre} 👋 ¿En qué te puedo ayudar?`
    }])
    setError('')
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className={s.page}>
      {/* Sidebar */}
      <aside className={s.sidebar}>
        <div className={s.sidebarLogo}>✦ ClienteAI</div>
        <nav className={s.sidebarNav}>
          <button className={s.navItem} onClick={() => navigate('/dashboard')}>⊞ Dashboard</button>
          <button className={s.navItem} onClick={() => navigate('/configurar')}>⚙ Mi asistente</button>
          <button className={`${s.navItem} ${s.navItemActive}`}>◉ Vista previa</button>
        </nav>
      </aside>

      {/* Main */}
      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Vista previa</h1>
            <p className={s.subtitle}>Así verán el chat tus clientes. Pruébalo antes de publicarlo.</p>
          </div>
          <div className={s.headerActions}>
            <button className={s.btnReset} onClick={resetChat}>↺ Reiniciar</button>
            <button className={s.btnConfig} onClick={() => navigate('/configurar')}>⚙ Editar info</button>
          </div>
        </div>

        {!negocio ? (
          <div className={s.emptyState}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚙</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Primero configura tu negocio</h2>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>Necesitas agregar la información de tu negocio antes de probar el bot.</p>
            <button onClick={() => navigate('/configurar')} className={s.btnConfig}>
              Configurar ahora →
            </button>
          </div>
        ) : (
          <div className={s.chatWrapper}>
            {/* Info del negocio */}
            <div className={s.negocioInfo}>
              <div className={s.negocioAvatar}>{negocio.nombre[0]}</div>
              <div>
                <p className={s.negocioNombre}>{negocio.nombre}</p>
                <p className={s.negocioDesc}>{negocio.descripcion || 'Tu asistente de IA'}</p>
              </div>
              <div className={s.activeBadge}>
                <span className={s.activeDot} />
                Activo
              </div>
            </div>

            {/* Chat */}
            <div className={s.chatBox}>
              {/* Messages */}
              <div className={s.messages}>
                {messages.map((m, i) => (
                  <div key={i} className={`${s.msgRow} ${m.role === 'user' ? s.msgRowUser : ''}`}>
                    {m.role === 'assistant' && (
                      <div className={s.botAvatar}>{negocio.nombre[0]}</div>
                    )}
                    <div className={`${s.bubble} ${m.role === 'user' ? s.bubbleUser : s.bubbleBot}`}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className={s.msgRow}>
                    <div className={s.botAvatar}>{negocio.nombre[0]}</div>
                    <div className={`${s.bubble} ${s.bubbleBot}`}>
                      <TypingDots />
                    </div>
                  </div>
                )}

                {error && (
                  <div className={s.errorBubble}>
                    ⚠️ {error}
                    {error.includes('API') && <span> — Revisa tu API key en el archivo .env</span>}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className={s.inputArea}>
                <input
                  ref={inputRef}
                  className={s.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escribe una pregunta..."
                  disabled={thinking}
                  maxLength={500}
                />
                <button
                  className={s.sendBtn}
                  onClick={sendMessage}
                  disabled={!input.trim() || thinking}
                  style={{ opacity: !input.trim() || thinking ? 0.4 : 1 }}
                >
                  ↑
                </button>
              </div>
              <p className={s.chatFooter}>Asistente con IA · ClienteAI</p>
            </div>

            {/* Tip */}
            <div className={s.tip}>
              <span className={s.tipIcon}>💡</span>
              <span>Esta es exactamente la experiencia que verán tus clientes. Si el bot no responde bien, <button className={s.tipLink} onClick={() => navigate('/configurar')}>actualiza la información de tu negocio</button>.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#d1d5db',
          animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`
        }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
    </span>
  )
}
