import { jsPDF } from "jspdf"

// Agrupa las filas crudas de "conversaciones" en: dia -> sesiones -> mensajes.
// Las filas viejas (antes de este feature) no tienen sesion_id ni datos del
// cliente, asi que se agrupan aparte como "Cliente sin identificar".
export function agruparPorDia(filas) {
  const porDia = new Map()

  for (const fila of filas) {
    const fecha = new Date(fila.created_at)
    const claveDia = fecha.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" })

    if (!porDia.has(claveDia)) porDia.set(claveDia, new Map())
    const sesiones = porDia.get(claveDia)

    const claveSesion = fila.sesion_id || "legacy"
    if (!sesiones.has(claveSesion)) {
      sesiones.set(claveSesion, {
        sesionId: claveSesion,
        clienteNombre: fila.cliente_nombre || "Cliente sin identificar",
        clienteTelefono: fila.cliente_telefono || "-",
        mensajes: [],
      })
    }
    sesiones.get(claveSesion).mensajes.push(fila)
  }

  // Convertir a array ordenado: dias mas recientes primero, sesiones por hora de inicio
  const dias = Array.from(porDia.entries()).map(([fecha, sesionesMap]) => {
    const sesiones = Array.from(sesionesMap.values())
      .map(s => ({ ...s, mensajes: s.mensajes.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) }))
      .sort((a, b) => new Date(a.mensajes[0].created_at) - new Date(b.mensajes[0].created_at))
    return { fecha, sesiones }
  })

  dias.sort((a, b) => {
    const da = a.sesiones[0]?.mensajes[0]?.created_at
    const db = b.sesiones[0]?.mensajes[0]?.created_at
    return new Date(db) - new Date(da)
  })

  return dias
}

const VERDE = [22, 163, 74]
const GRIS_TEXTO = [55, 65, 81]
const GRIS_CLARO = [156, 163, 175]

function dibujarMembrete(doc, negocio, fecha) {
  const anchoPagina = doc.internal.pageSize.getWidth()

  // Franja superior
  doc.setFillColor(...VERDE)
  doc.rect(0, 0, anchoPagina, 26, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("ClienteAI", 16, 16)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Asistente virtual de WhatsApp con Inteligencia Artificial", 16, 22)

  // Datos del negocio y del reporte
  doc.setTextColor(...GRIS_TEXTO)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(negocio.nombre || "Negocio", 16, 38)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...GRIS_CLARO)
  let yInfo = 44
  if (negocio.direccion) { doc.text(negocio.direccion, 16, yInfo); yInfo += 5 }
  if (negocio.telefono) { doc.text(`Tel: ${negocio.telefono}`, 16, yInfo); yInfo += 5 }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...VERDE)
  doc.text(`Reporte de conversaciones - ${fecha}`, anchoPagina - 16, 38, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...GRIS_CLARO)
  doc.text("Generado por ClienteAI", anchoPagina - 16, 44, { align: "right" })

  doc.setDrawColor(230, 230, 230)
  doc.line(16, 50, anchoPagina - 16, 50)

  return 58
}

function pieDePagina(doc) {
  const anchoPagina = doc.internal.pageSize.getWidth()
  const altoPagina = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(...GRIS_CLARO)
  doc.text("ClienteAI · clienteai.site", 16, altoPagina - 10)
  doc.text(`Pagina ${doc.internal.getCurrentPageInfo().pageNumber}`, anchoPagina - 16, altoPagina - 10, { align: "right" })
}

// Genera el PDF membretado para un dia completo (todas sus sesiones/clientes).
// Devuelve la instancia jsPDF, para que quien llame decida si la descarga,
// la imprime, o la convierte a blob para compartir/enviar por correo.
export function generarPDF(negocio, fecha, sesiones) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const anchoPagina = doc.internal.pageSize.getWidth()
  const altoPagina = doc.internal.pageSize.getHeight()
  const margenIzq = 16
  const anchoTexto = anchoPagina - margenIzq * 2

  let y = dibujarMembrete(doc, negocio, fecha)

  function saltoDePaginaSiHaceFalta(alturaNecesaria) {
    if (y + alturaNecesaria > altoPagina - 16) {
      pieDePagina(doc)
      doc.addPage()
      y = dibujarMembrete(doc, negocio, fecha)
    }
  }

  sesiones.forEach((sesion, idx) => {
    saltoDePaginaSiHaceFalta(20)

    doc.setFillColor(240, 253, 244)
    doc.roundedRect(margenIzq, y, anchoTexto, 14, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(...GRIS_TEXTO)
    doc.text(sesion.clienteNombre, margenIzq + 4, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...VERDE)
    doc.text(`Tel/WhatsApp: ${sesion.clienteTelefono}`, margenIzq + 4, y + 11)

    const horaInicio = new Date(sesion.mensajes[0].created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    doc.setTextColor(...GRIS_CLARO)
    doc.text(horaInicio, anchoPagina - margenIzq - 4, y + 6, { align: "right" })

    y += 20

    sesion.mensajes.forEach(m => {
      const esCliente = m.rol === "user"
      const etiqueta = esCliente ? sesion.clienteNombre : "Asistente"
      const hora = new Date(m.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      const lineas = doc.splitTextToSize(m.mensaje || "", anchoTexto - 4)
      const alturaBloque = 5 + lineas.length * 4.6 + 3

      saltoDePaginaSiHaceFalta(alturaBloque)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(esCliente ? 29 : 22, esCliente ? 78 : 163, esCliente ? 216 : 74)
      doc.text(`${etiqueta}  ·  ${hora}`, margenIzq + 2, y)
      y += 4.5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9.5)
      doc.setTextColor(...GRIS_TEXTO)
      doc.text(lineas, margenIzq + 2, y)
      y += lineas.length * 4.6 + 4
    })

    if (idx < sesiones.length - 1) {
      saltoDePaginaSiHaceFalta(8)
      doc.setDrawColor(230, 230, 230)
      doc.line(margenIzq, y, anchoPagina - margenIzq, y)
      y += 8
    }
  })

  pieDePagina(doc)
  return doc
}