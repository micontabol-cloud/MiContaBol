"""
MiContaBol · Carga más rápida (paso 2b): las librerías pesadas se bajan SOLO cuando se usan.

  - xlsx            -> solo al tocar "Excel", al descargar la plantilla o al importar un archivo
  - jspdf + tabla   -> solo al tocar "PDF"
  - lector de códigos de barras (zxing) -> solo al abrir la cámara

Cómo se usa (dentro de 02-react-app, donde está package.json):

    python3 parche_carga.py

Se puede correr dos veces sin problema. No cambia cómo se ve nada.
"""
import pathlib
import sys

raiz = pathlib.Path(".").resolve()
src = raiz / "src"
if not (raiz / "package.json").exists() or not (src / "App.jsx").exists():
    sys.exit("No encuentro package.json ni src/App.jsx. Corré esto dentro de 02-react-app.")

avisos = []


def leer(r):
    return r.read_text(encoding="utf-8")


def guardar(r, t):
    r.write_text(t, encoding="utf-8")


def reemplazar(texto, viejo, nuevo, archivo):
    """Reemplaza exactamente una vez; si no encuentra el texto, avisa."""
    if texto.count(viejo) != 1:
        avisos.append(f"{archivo}: no encontré el texto esperado ({viejo.strip()[:50]}…). Revisar a mano.")
        return texto
    return texto.replace(viejo, nuevo)


# ── 1. lib/exportar.js ──────────────────────────────────────────────────────
r = src / "lib" / "exportar.js"
t = leer(r)
if "await import('xlsx')" in t:
    print("exportar.js: ya estaba aplicado.")
else:
    t = reemplazar(
        t,
        "import * as XLSX from 'xlsx'\nimport jsPDF from 'jspdf'\nimport autoTable from 'jspdf-autotable'\n",
        "// xlsx y jspdf pesan mucho: se descargan recién cuando alguien exporta.\n",
        "exportar.js",
    )
    t = reemplazar(
        t,
        "export function exportarExcel({ titulo, empresa, subtitulo, secciones }) {\n  const filas = []\n",
        "export async function exportarExcel({ titulo, empresa, subtitulo, secciones }) {\n"
        "  const XLSX = await import('xlsx')\n  const filas = []\n",
        "exportar.js",
    )
    t = reemplazar(
        t,
        "export function exportarPDF({ titulo, empresa, subtitulo, secciones }) {\n",
        "export async function exportarPDF({ titulo, empresa, subtitulo, secciones }) {\n"
        "  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([\n"
        "    import('jspdf'),\n    import('jspdf-autotable'),\n  ])\n",
        "exportar.js",
    )
    guardar(r, t)
    print("exportar.js: xlsx y jspdf ahora se cargan al exportar.")

# ── 2. components/BotonesExportar.jsx (avisa mientras prepara el archivo) ───
r = src / "components" / "BotonesExportar.jsx"
t = leer(r)
if "ocupado" in t:
    print("BotonesExportar.jsx: ya estaba aplicado.")
else:
    guardar(
        r,
        """import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { exportarExcel, exportarPDF } from '../lib/exportar'

/**
 * Par de botones para bajar un reporte. Recibe los datos ya armados
 * para que cada pantalla decida qué exportar y cómo agruparlo.
 *
 * La primera vez que se toca, el navegador descarga la librería de
 * Excel o de PDF; mientras tanto el botón dice "Preparando…".
 */
export default function BotonesExportar({ titulo, empresa, subtitulo, secciones, deshabilitado }) {
  const datos = { titulo, empresa, subtitulo, secciones }
  const [ocupado, setOcupado] = useState(null) // 'excel' | 'pdf' | null
  const [error, setError] = useState(null)

  async function exportar(tipo, funcion) {
    setError(null)
    setOcupado(tipo)
    try {
      await funcion(datos)
    } catch (e) {
      console.error(e)
      setError('No se pudo preparar el archivo. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => exportar('excel', exportarExcel)}
          disabled={deshabilitado || ocupado !== null}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileSpreadsheet size={16} strokeWidth={1.8} />
          {ocupado === 'excel' ? 'Preparando…' : 'Excel'}
        </button>
        <button
          type="button"
          onClick={() => exportar('pdf', exportarPDF)}
          disabled={deshabilitado || ocupado !== null}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FileText size={16} strokeWidth={1.8} />
          {ocupado === 'pdf' ? 'Preparando…' : 'PDF'}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#B91C1C' }}>
          {error}
        </p>
      )}
    </div>
  )
}
""",
    )
    print("BotonesExportar.jsx: reescrito (muestra 'Preparando…' mientras carga).")

# ── 3. pages/ImportarProductos.jsx ──────────────────────────────────────────
r = src / "pages" / "ImportarProductos.jsx"
t = leer(r)
if "await import('xlsx')" in t:
    print("ImportarProductos.jsx: ya estaba aplicado.")
else:
    t = reemplazar(t, "import * as XLSX from 'xlsx'\n", "", "ImportarProductos.jsx")
    t = reemplazar(
        t,
        "  function descargarPlantilla() {\n",
        "  async function descargarPlantilla() {\n    const XLSX = await import('xlsx')\n",
        "ImportarProductos.jsx",
    )
    t = reemplazar(
        t,
        "      const buffer = await archivo.arrayBuffer()\n      const libro = XLSX.read(buffer)\n",
        "      const XLSX = await import('xlsx')\n      const buffer = await archivo.arrayBuffer()\n      const libro = XLSX.read(buffer)\n",
        "ImportarProductos.jsx",
    )
    guardar(r, t)
    print("ImportarProductos.jsx: xlsx se carga al descargar la plantilla / leer un archivo.")

# ── 4. components/EscanerCodigo.jsx ─────────────────────────────────────────
r = src / "components" / "EscanerCodigo.jsx"
t = leer(r)
if "await import('@zxing/browser')" in t:
    print("EscanerCodigo.jsx: ya estaba aplicado.")
else:
    t = reemplazar(t, "import { BrowserMultiFormatReader } from '@zxing/browser'\n", "", "EscanerCodigo.jsx")
    t = reemplazar(t, "    const lector = new BrowserMultiFormatReader()\n\n", "\n", "EscanerCodigo.jsx")
    t = reemplazar(
        t,
        "      try {\n        const controls = await lector.decodeFromVideoDevice(",
        "      try {\n"
        "        // El lector de códigos pesa bastante: solo se baja al abrir la cámara\n"
        "        const { BrowserMultiFormatReader } = await import('@zxing/browser')\n"
        "        if (cancelado) return\n"
        "        const lector = new BrowserMultiFormatReader()\n"
        "        const controls = await lector.decodeFromVideoDevice(",
        "EscanerCodigo.jsx",
    )
    t = reemplazar(
        t,
        "        controlsRef.current = controls\n",
        "        controlsRef.current = controls\n        if (cancelado) controls.stop()\n",
        "EscanerCodigo.jsx",
    )
    guardar(r, t)
    print("EscanerCodigo.jsx: zxing se carga al abrir la cámara.")

# ── Comprobación final: ya no debe quedar ningún import estático ────────────
import re

for ruta in src.rglob("*.js*"):
    if re.search(r"^import .* from '(xlsx|jspdf|jspdf-autotable|@zxing/browser)'", leer(ruta), re.M):
        avisos.append(f"{ruta.relative_to(raiz)} todavía importa una librería pesada de forma estática.")

print()
if avisos:
    print("REVISAR A MANO:")
    for a in avisos:
        print("  -", a)
else:
    print("Listo. Ahora: npm run build")
