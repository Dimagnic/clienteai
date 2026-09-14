import { useState } from 'react'

export default function InstallGuide() {
  const [abierto, setAbierto] = useState(false)
  const plataformas = [
    { nombre: 'WordPress', pasos: 'Instala el plugin gratuito "Insert Headers and Footers" y pega el codigo en el Footer. O ve a Apariencia > Editor de temas y pegalo justo antes de </body>.' },
    { nombre: 'Wix', pasos: 'Ve a Configuracion > Avanzado > "Insertar codigo en todo el sitio" y pegalo en la seccion Body. Nota: esta funcion requiere un plan de pago de Wix, no esta disponible en el plan gratuito.' },
    { nombre: 'Squarespace', pasos: 'Ve a Configuracion > Avanzado > Inyeccion de codigo y pegalo en el campo Footer.' },
    { nombre: 'Shopify', pasos: 'Ve a Tienda online > Temas > Editar codigo, abre el archivo theme.liquid y pega el codigo justo antes de </body>.' },
    { nombre: 'Webflow', pasos: 'Ve a Configuracion del proyecto > Custom Code > Footer Code y pega el codigo ahi.' },
    { nombre: 'Carrd', pasos: 'Edita tu sitio, agrega una seccion de tipo "Embed" y pega el codigo dentro.' },
    { nombre: 'Google Sites / Notion sites', pasos: 'Estas plataformas no permiten codigo personalizado. Usa mejor el link directo de chat que aparece mas abajo y compartelo con tus clientes.' },
  ]
  return (
    <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setAbierto(!abierto)} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Como instalar el codigo en tu pagina web
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{abierto ? 'Ocultar' : 'Ver guia'}</span>
      </button>
      {abierto && (
        <div style={{ padding: '4px 16px 16px' }}>
          {plataformas.map(p => (
            <div key={p.nombre} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{p.nombre}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{p.pasos}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
