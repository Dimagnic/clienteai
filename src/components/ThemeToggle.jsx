import { useState } from 'react'
import { getTheme, toggleTheme } from '../lib/theme'

export default function ThemeToggle({ style }) {
  const [theme, setTheme] = useState(getTheme())

  function handleClick() {
    setTheme(toggleTheme())
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '9px 12px', borderRadius: 8, marginBottom: 8,
        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        ...style,
      }}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span style={{ fontSize: 15 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
      {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  )
}
