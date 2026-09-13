import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { agruparPorDia, generarPDF } from "../lib/reportes"

export default function ReporteConversaciones({ negocio }) {
  const [cargando, setCargando] = useState(true)
  const [dias, setDias] = useState([])
  const [diaAbierto, setDiaAbierto] = useState(null)
  const [sesionAbierta, setSesionAbierta] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("negocio_id", negocio.id)
        .order("created_at", { ascending: true })
        .limit(5000)
      setDias(agruparPorDia(data || []))
      setCargando(false)
    }
    cargar()
  }, [negocio.id])

  function descargarPDF(dia) {
    const doc = generarPDF(negocio, dia.fecha, dia.sesiones)
    doc.save(`ClienteAI-reporte-${dia.fecha.replace(/\//g, "-")}.pdf`)
  }

  function imprimirPDF(dia) {
    const doc = generarPDF(negocio, dia.fecha, dia.sesiones)
    doc.autoPrint()
    window.open(doc.output("bloburl"), "_blank")
  }

  async function compartirPDF(dia) {
    const doc = generarPDF(negocio, dia.fecha, dia.sesiones)
    const blob = doc.output("blob")
    const nombreArchivo = `ClienteAI-reporte-${dia.fecha.replace(/\//g, "-")}.pdf`
    const archivo = new File([blob], nombreArchivo, { type: "application/pdf" })
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: `Reporte ${dia.fecha}`, text: `Reporte de conversaciones de ${negocio.nombre} - ${dia.fecha}` })
      } catch {}
    } else {
      doc.save(nombreArchivo)
      alert("Tu navegador no soporta compartir directamente. Se descargo el PDF, puedes adjuntarlo manualmente.")
    }
  }

  function enviarPorCorreo(dia) {
    const asunto = encodeURIComponent(`Reporte de conversaciones - ${negocio.nombre} - ${dia.fecha}`)
    const cuerpo = encodeURIComponent(`Hola,\n\nAdjunto el reporte de conversaciones del ${dia.fecha} para ${negocio.nombre}.\n\nNota: primero descarga el PDF con el boton "Descargar PDF" y adjuntalo manualmente a este correo.\n\nSaludos,\nClienteAI`)
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`
  }

  if (cargando) return <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Cargando reportes...</div>

  if (!dias.length) return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
      Aun no hay conversaciones para generar reportes.
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {dias.map(dia => {
        const abierto = diaAbierto === dia.fecha
        return (
          <div key={dia.fecha} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div
              onClick={() => setDiaAbierto(abierto ? null : dia.fecha)}
              style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: abierto ? "var(--bg-secondary)" : "transparent" }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{dia.fecha}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{dia.sesiones.length} conversacion{dia.sesiones.length !== 1 ? "es" : ""}</p>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={e => { e.stopPropagation(); descargarPDF(dia) }} style={btnAccion}>Descargar PDF</button>
                <button onClick={e => { e.stopPropagation(); imprimirPDF(dia) }} style={btnAccion}>Imprimir</button>
                <button onClick={e => { e.stopPropagation(); compartirPDF(dia) }} style={btnAccion}>Compartir</button>
                <button onClick={e => { e.stopPropagation(); enviarPorCorreo(dia) }} style={btnAccion}>Correo</button>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>{abierto ? "▲" : "▼"}</span>
              </div>
            </div>

            {abierto && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {dia.sesiones.map(sesion => {
                  const claveSesion = dia.fecha + "-" + sesion.sesionId
                  const sesionVisible = sesionAbierta === claveSesion
                  return (
                    <div key={sesion.sesionId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <div
                        onClick={() => setSesionAbierta(sesionVisible ? null : claveSesion)}
                        style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: sesionVisible ? "var(--bg-secondary)" : "transparent" }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{sesion.clienteNombre}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{sesion.clienteTelefono} · {sesion.mensajes.length} mensajes</p>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(sesion.mensajes[0].created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                          {sesionVisible ? " ▲" : " ▼"}
                        </span>
                      </div>
                      {sesionVisible && (
                        <div style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-secondary)" }}>
                          {sesion.mensajes.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: m.rol === "user" ? "#dbeafe" : "#dcfce7", color: m.rol === "user" ? "#1d4ed8" : "#16a34a", whiteSpace: "nowrap", marginTop: 2 }}>
                                {m.rol === "user" ? sesion.clienteNombre : "Asistente"}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.5 }}>{m.mensaje}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{new Date(m.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const btnAccion = {
  padding: "5px 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
}
