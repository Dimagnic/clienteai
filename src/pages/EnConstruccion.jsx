export default function EnConstruccion() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
      padding: '24px', fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ fontSize: 48, fontWeight: 900, color: '#16a34a', marginBottom: 8 }}>ClienteAI</div>
      <div style={{ fontSize: 42, marginBottom: 16 }}>🚧</div>
      <h1 style={{ fontSize: 24, color: '#111', margin: '0 0 12px' }}>Estamos mejorando el sitio</h1>
      <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 420, lineHeight: 1.6 }}>
        Volvemos muy pronto. Gracias por tu paciencia.
      </p>
    </div>
  )
}
