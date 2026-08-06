import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

// Encabezados que aceptamos, en varias formas de escribirlos: el
// comerciante no tiene por qué usar exactamente nuestras palabras.
const ALIAS = {
  codigo: ['codigo', 'código', 'code', 'sku', 'clave'],
  nombre: ['nombre', 'producto', 'descripcion', 'descripción', 'detalle'],
  categoria: ['categoria', 'categoría', 'rubro', 'linea', 'línea', 'familia'],
  unidad: ['unidad', 'unidad_medida', 'medida', 'um'],
  costo: ['costo', 'costo_unitario', 'precio_costo', 'compra'],
  precio: ['precio', 'precio_venta', 'venta', 'pvp'],
  stock: ['stock', 'cantidad', 'existencia', 'stock_actual', 'inicial'],
  stock_minimo: ['stock_minimo', 'stock_mínimo', 'minimo', 'mínimo', 'alerta'],
}

function normalizarClave(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function detectarCampo(encabezado) {
  const clave = normalizarClave(encabezado)
  for (const [campo, alias] of Object.entries(ALIAS)) {
    if (alias.map(normalizarClave).includes(clave)) return campo
  }
  return null
}

function aNumero(v) {
  if (v === undefined || v === null || v === '') return null
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export default function ImportarProductos() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [filas, setFilas] = useState(null)
  const [columnasNoReconocidas, setColumnasNoReconocidas] = useState([])
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [error, setError] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function descargarPlantilla() {
    const ejemplo = [
      {
        codigo: 'ZAP-001',
        nombre: 'Zapatilla Runner Negra',
        categoria: 'Deportivos',
        unidad: 'par',
        costo: 180,
        precio: 320,
        stock: 12,
        stock_minimo: 3,
      },
      {
        codigo: 'ZAP-002',
        nombre: 'Sandalia Cuero Café',
        categoria: 'Sandalias',
        unidad: 'par',
        costo: 95,
        precio: 175,
        stock: 8,
        stock_minimo: 2,
      },
    ]
    const hoja = XLSX.utils.json_to_sheet(ejemplo)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Productos')
    XLSX.writeFile(libro, 'plantilla-productos-micontabol.xlsx')
  }

  async function leerArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setResultado(null)
    setNombreArchivo(archivo.name)

    try {
      const buffer = await archivo.arrayBuffer()
      const libro = XLSX.read(buffer)
      const hoja = libro.Sheets[libro.SheetNames[0]]
      const crudo = XLSX.utils.sheet_to_json(hoja, { defval: '' })

      if (crudo.length === 0) {
        setError('El archivo no tiene filas de datos.')
        setFilas(null)
        return
      }

      const encabezados = Object.keys(crudo[0])
      const mapa = {}
      const noReconocidas = []
      encabezados.forEach((h) => {
        const campo = detectarCampo(h)
        if (campo) mapa[campo] = h
        else noReconocidas.push(h)
      })
      setColumnasNoReconocidas(noReconocidas)

      if (!mapa.codigo || !mapa.nombre) {
        setError(
          'El archivo debe tener al menos una columna de código y una de nombre. Descarga la plantilla para ver el formato.'
        )
        setFilas(null)
        return
      }

      const procesadas = crudo.map((f, i) => {
        const codigo = String(f[mapa.codigo] ?? '').trim()
        const nombre = String(f[mapa.nombre] ?? '').trim()
        const problemas = []
        if (!codigo) problemas.push('sin código')
        if (!nombre) problemas.push('sin nombre')

        const costo = mapa.costo ? aNumero(f[mapa.costo]) : null
        const precio = mapa.precio ? aNumero(f[mapa.precio]) : null
        if (costo !== null && precio !== null && precio > 0 && precio < costo) {
          problemas.push('el precio es menor al costo')
        }

        return {
          _fila: i + 2, // +2: la fila 1 son los encabezados
          _problemas: problemas,
          codigo,
          nombre,
          categoria: mapa.categoria ? String(f[mapa.categoria] ?? '').trim() : '',
          unidad: mapa.unidad ? String(f[mapa.unidad] ?? '').trim() : '',
          costo,
          precio,
          stock: mapa.stock ? aNumero(f[mapa.stock]) : null,
          stock_minimo: mapa.stock_minimo ? aNumero(f[mapa.stock_minimo]) : null,
        }
      })

      setFilas(procesadas)
    } catch (err) {
      setError(`No se pudo leer el archivo: ${err.message}`)
      setFilas(null)
    }
  }

  async function importar() {
    setError(null)
    setImportando(true)

    const validas = filas.filter((f) => f._problemas.length === 0)

    const { data, error } = await supabase.rpc('importar_productos', {
      p_empresa_id: empresaId,
      p_filas: validas.map(({ _fila, _problemas, ...resto }) => resto),
    })

    setImportando(false)

    if (error) {
      setError(error.message)
      return
    }

    setResultado(data?.[0] || null)
    setFilas(null)
  }

  const validas = filas ? filas.filter((f) => f._problemas.length === 0) : []
  const conProblemas = filas ? filas.filter((f) => f._problemas.length > 0) : []

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>&larr; Productos</Link>
      </p>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <BoliMascot pose="revisando" size={78} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ margin: 0 }}>Importar productos</h1>
          <p style={{ color: '#64748B', margin: '0.3rem 0 0' }}>
            Sube tu lista desde Excel y carga todo tu catálogo de una vez, en lugar de escribirlo producto por
            producto.
          </p>
        </div>
      </div>

      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          padding: '1.15rem',
          margin: '1.5rem 0',
        }}
      >
        <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#1F3A5F' }}>¿Primera vez?</p>
        <p style={{ margin: '0 0 0.9rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
          Descarga la plantilla, llénala con tus productos y súbela. Si ya tienes tu propia lista en Excel, también
          sirve: reconocemos las columnas aunque las hayas nombrado distinto (código/sku/clave, precio/pvp, etc.).
        </p>
        <button type="button" onClick={descargarPlantilla}>
          Descargar plantilla de Excel
        </button>
      </div>

      <h2>Sube tu archivo</h2>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={leerArchivo} />
      {nombreArchivo && <p style={{ color: '#64748B', fontSize: '0.88rem' }}>Archivo: {nombreArchivo}</p>}

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {resultado && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 16,
            padding: '1.15rem',
            marginTop: '1.25rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: '#15803D' }}>
            ✓ Listo: {resultado.creados} productos creados y {resultado.actualizados} actualizados.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/empresas/${empresaId}/inventario/productos`)}
            style={{ marginTop: '0.9rem' }}
          >
            Ver mis productos
          </button>
        </div>
      )}

      {filas && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="stat-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <p className="stat-label">Filas leídas</p>
              <p className="stat-value">{filas.length}</p>
            </div>
            <div className="stat-card destacada-utilidad">
              <p className="stat-label">Se van a importar</p>
              <p className="stat-value" style={{ color: '#22C55E' }}>
                {validas.length}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Con problemas</p>
              <p className="stat-value" style={{ color: conProblemas.length > 0 ? '#EF4444' : undefined }}>
                {conProblemas.length}
              </p>
            </div>
          </div>

          {columnasNoReconocidas.length > 0 && (
            <p
              style={{
                padding: '0.6rem 0.8rem',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 12,
                fontSize: '0.88rem',
                color: '#1e40af',
              }}
            >
              Estas columnas de tu archivo no las reconocimos y se van a ignorar:{' '}
              <strong>{columnasNoReconocidas.join(', ')}</strong>. El resto se importa igual.
            </p>
          )}

          {conProblemas.length > 0 && (
            <div
              style={{
                padding: '0.8rem',
                background: 'rgba(239, 68, 68, 0.07)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                marginBottom: '1rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#B91C1C' }}>
                Estas filas se van a saltar:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#B91C1C' }}>
                {conProblemas.slice(0, 8).map((f) => (
                  <li key={f._fila}>
                    Fila {f._fila}: {f._problemas.join(', ')}
                  </li>
                ))}
                {conProblemas.length > 8 && <li>y {conProblemas.length - 8} más...</li>}
              </ul>
            </div>
          )}

          <h3>Vista previa</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                  <th style={{ padding: '4px 8px' }}>Código</th>
                  <th style={{ padding: '4px 8px' }}>Nombre</th>
                  <th style={{ padding: '4px 8px' }}>Categoría</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 15).map((f) => (
                  <tr
                    key={f._fila}
                    style={{
                      borderBottom: '1px solid #E6ECF3',
                      opacity: f._problemas.length > 0 ? 0.45 : 1,
                    }}
                  >
                    <td style={{ padding: '4px 8px' }}>{f.codigo || '—'}</td>
                    <td style={{ padding: '4px 8px' }}>{f.nombre || '—'}</td>
                    <td style={{ padding: '4px 8px', color: '#64748B' }}>{f.categoria || '—'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.costo ?? '—'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.precio ?? '—'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.stock ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length > 15 && (
            <p style={{ color: '#A3AFBF', fontSize: '0.85rem' }}>Mostrando las primeras 15 de {filas.length}.</p>
          )}

          <p
            style={{
              marginTop: '1rem',
              padding: '0.7rem 0.85rem',
              background: '#F7F9FC',
              borderRadius: 12,
              fontSize: '0.88rem',
              lineHeight: 1.5,
            }}
          >
            Si un código ya existe en tu catálogo, se <strong>actualizan</strong> sus datos (nombre, precios,
            categoría) pero <strong>no se toca su stock</strong> — cambiar inventario en silencio desde una
            importación sería riesgoso. Para ajustar stock, usa el ajuste de inventario en la ficha del producto.
          </p>

          <button
            className="btn-hero"
            type="button"
            onClick={importar}
            disabled={importando || validas.length === 0}
            style={{ marginTop: '1rem' }}
          >
            Importar {validas.length} productos
          </button>
        </div>
      )}
    </main>
  )
}
