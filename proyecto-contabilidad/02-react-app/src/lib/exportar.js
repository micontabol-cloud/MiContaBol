import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const NAVY = [31, 58, 95]
const CORAL = [242, 85, 90]
const GRIS = [100, 116, 139]

function nombreArchivo(titulo, empresa) {
  const fecha = new Date().toISOString().slice(0, 10)
  const limpio = `${empresa || 'empresa'}-${titulo}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${limpio}-${fecha}`
}

/**
 * Exporta a Excel. `secciones` permite poner varias tablas en la misma
 * hoja (ej. Estado de Resultados: ingresos, gastos y el total).
 */
export function exportarExcel({ titulo, empresa, subtitulo, secciones }) {
  const filas = []

  filas.push([empresa || ''])
  filas.push([titulo])
  if (subtitulo) filas.push([subtitulo])
  filas.push([])

  secciones.forEach((sec) => {
    if (sec.titulo) filas.push([sec.titulo])
    if (sec.columnas) filas.push(sec.columnas)
    sec.filas.forEach((f) => filas.push(f))
    if (sec.total) filas.push(sec.total)
    filas.push([])
  })

  const hoja = XLSX.utils.aoa_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte')
  XLSX.writeFile(libro, `${nombreArchivo(titulo, empresa)}.xlsx`)
}

/**
 * Exporta a PDF con encabezado de marca. Cada sección se dibuja como
 * una tabla, una debajo de otra.
 */
export function exportarPDF({ titulo, empresa, subtitulo, secciones }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()

  // Encabezado
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, ancho, 64, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('MiContaBol', 40, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 212, 228)
  doc.text('Mi contabilidad en el bolsillo', 40, 42)

  doc.setFontSize(9)
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    ancho - 40,
    42,
    { align: 'right' }
  )

  // Título del reporte
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(titulo, 40, 96)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRIS)
  let y = 112
  if (empresa) {
    doc.text(empresa, 40, y)
    y += 14
  }
  if (subtitulo) {
    doc.text(subtitulo, 40, y)
    y += 14
  }

  let cursorY = y + 8

  secciones.forEach((sec) => {
    if (sec.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...NAVY)
      doc.text(sec.titulo, 40, cursorY + 14)
      cursorY += 22
    }

    const cuerpo = [...sec.filas]
    if (sec.total) cuerpo.push(sec.total)

    autoTable(doc, {
      startY: cursorY,
      head: sec.columnas ? [sec.columnas] : undefined,
      body: cuerpo,
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 5, textColor: [37, 48, 70] },
      headStyles: { fillColor: [247, 249, 252], textColor: NAVY, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 253, 255] },
      columnStyles: sec.alineacionDerecha
        ? Object.fromEntries(sec.alineacionDerecha.map((i) => [i, { halign: 'right' }]))
        : undefined,
      didParseCell: (data) => {
        // La última fila, cuando es el total, va en negrita
        if (sec.total && data.row.index === cuerpo.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [247, 249, 252]
        }
      },
    })

    cursorY = doc.lastAutoTable.finalY + 18
  })

  // Pie de página en todas las hojas
  const paginas = doc.internal.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    const alto = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text('Generado con MiContaBol', 40, alto - 24)
    doc.setTextColor(...CORAL)
    doc.text(`${i} de ${paginas}`, ancho - 40, alto - 24, { align: 'right' })
  }

  doc.save(`${nombreArchivo(titulo, empresa)}.pdf`)
}
