import { FileSpreadsheet, FileText } from 'lucide-react'
import { exportarExcel, exportarPDF } from '../lib/exportar'

/**
 * Par de botones para bajar un reporte. Recibe los datos ya armados
 * para que cada pantalla decida qué exportar y cómo agruparlo.
 */
export default function BotonesExportar({ titulo, empresa, subtitulo, secciones, deshabilitado }) {
  const datos = { titulo, empresa, subtitulo, secciones }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => exportarExcel(datos)}
        disabled={deshabilitado}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <FileSpreadsheet size={16} strokeWidth={1.8} />
        Excel
      </button>
      <button
        type="button"
        onClick={() => exportarPDF(datos)}
        disabled={deshabilitado}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <FileText size={16} strokeWidth={1.8} />
        PDF
      </button>
    </div>
  )
}
