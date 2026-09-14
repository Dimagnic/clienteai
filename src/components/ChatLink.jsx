import { useState } from 'react'

export default function ChatLink({ token }) {
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
