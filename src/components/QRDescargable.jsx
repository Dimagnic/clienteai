export default function QRDescargable({ token, nombre }) {
  function descargarQR() {
    const url = `https://clienteai.site/chat/${token}`
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 700
    const ctx = canvas.getContext('2d')

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 600, 700)

    // Header verde
    ctx.fillStyle = '#16a34a'
    ctx.fillRect(0, 0, 600, 80)
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ClienteAI', 300, 40)

    // Texto escanea
    ctx.fillStyle = '#111111'
    ctx.font = '700 22px Arial'
    ctx.fillText('¡Escanéame!', 300, 115)
    ctx.font = '400 16px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Chatea con nuestro asistente virtual', 300, 145)

    // QR usando API pública
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 125, 170, 350, 350)

      // Nombre del negocio
      ctx.fillStyle = '#111111'
      ctx.font = '700 18px Arial'
      ctx.fillText(nombre || 'Mi Negocio', 300, 570)

      // URL pequeña
      ctx.fillStyle = '#9ca3af'
      ctx.font = '400 12px Arial'
      ctx.fillText(url, 300, 595)

      // Footer
      ctx.fillStyle = '#f9fafb'
      ctx.fillRect(0, 620, 600, 80)
      ctx.fillStyle = '#6b7280'
      ctx.font = '400 12px Arial'
      ctx.fillText('Desarrollado por Cero+ Software · clienteai.site', 300, 660)

      // Descargar
      canvas.toBlob(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `qr-${nombre || 'bot'}.png`
        a.click()
        URL.revokeObjectURL(a.href)
      }, 'image/png')
    }
    img.onerror = () => {
      // Fallback sin QR visual
      ctx.fillStyle = '#374151'
      ctx.font = '400 14px Arial'
      ctx.fillText('Error al generar QR. Intenta de nuevo.', 300, 400)
      canvas.toBlob(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `qr-${nombre || 'bot'}.png`
        a.click()
      }, 'image/png')
    }
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&margin=10`
  }

  return (
    <button onClick={descargarQR} style={{ padding: '10px 20px', borderRadius: 8, border: '2px solid #16a34a', background: '#fff', color: '#16a34a', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
      ⬇ Descargar QR
    </button>
  )
}
