export default function EmptyState({ navigate }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '56px 32px', textAlign: 'center', maxWidth: 500 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>Configura tu primer asistente</h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
        Solo necesitas 10 minutos para tener un bot respondiendo por ti.
      </p>
      <button onClick={() => navigate('/configurar')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
        Configurar ahora
      </button>
    </div>
  )
}
