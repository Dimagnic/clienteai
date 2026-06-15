import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      style={{
        background: dark ? '#334155' : '#f3f4f6',
        border: 'none',
        borderRadius: 20,
        width: 44,
        height: 24,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: dark ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: dark ? '#16a34a' : '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
      }}>
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}