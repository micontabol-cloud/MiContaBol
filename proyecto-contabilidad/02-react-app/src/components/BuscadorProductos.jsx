import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

// Suficientes para no tener que afinar la búsqueda, pocos para no
// convertir la lista en un catálogo por el que hay que desplazarse.
const LIMITE = 25

/**
 * Buscador para agregar productos a una venta. Muestra el stock de
 * cada uno porque es lo que el vendedor necesita saber antes de
 * prometerle algo a un cliente que está esperando.
 *
 * productos: filas de vista_stock
 */
export default function BuscadorProductos({ productos, onElegir, placeholder = 'Buscar producto por nombre o código...' }) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [resaltado, setResaltado] = useState(0)
  const contenedorRef = useRef(null)

  useEffect(() => {
    function alTocarFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alTocarFuera)
    return () => document.removeEventListener('mousedown', alTocarFuera)
  }, [])

  const resultados = useMemo(() => {
    const q = texto.trim().toLowerCase()
    if (!q) return []

    // Se busca por palabras sueltas, no por la frase completa: quien
    // escribe "rojo 38" espera los rojos de talla 38, y esas dos
    // palabras viven en campos distintos (categoría y observación).
    const palabras = q.split(/\s+/).filter(Boolean)

    const puntaje = (p) => {
      const campos = {
        nombre: (p.nombre_completo || '').toLowerCase(),
        codigo: (p.codigo || '').toLowerCase(),
        barras: (p.codigo_barras || '').toLowerCase(),
        categoria: (p.categoria_nombre || '').toLowerCase(),
        observacion: (p.observaciones || '').toLowerCase(),
      }
      const todo = Object.values(campos).join(' ')

      // Cada palabra tiene que aparecer en algún lado
      if (!palabras.every((w) => todo.includes(w))) return -1

      let pts = 0
      for (const w of palabras) {
        if (campos.codigo === w || campos.barras === w) pts += 100
        else if (campos.nombre.startsWith(w)) pts += 40
        else if (campos.nombre.includes(w)) pts += 25
        else if (campos.categoria.includes(w)) pts += 15
        else if (campos.observacion.includes(w)) pts += 15
        else pts += 5
      }
      return pts
    }

    return productos
      .map((p) => ({ p, pts: puntaje(p) }))
      .filter((x) => x.pts >= 0)
      .sort((a, b) => {
        // Lo que hay en stock primero: no sirve ofrecer lo agotado
        const stockA = Number(a.p.stock_actual) > 0
        const stockB = Number(b.p.stock_actual) > 0
        if (stockA !== stockB) return stockB - stockA
        if (b.pts !== a.pts) return b.pts - a.pts
        return (a.p.nombre_completo || '').localeCompare(b.p.nombre_completo || '')
      })
      .map((x) => x.p)
  }, [productos, texto])

  const visibles = resultados.slice(0, LIMITE)

  useEffect(() => {
    setResaltado(0)
  }, [texto])

  function elegir(p) {
    onElegir(p)
    setTexto('')
    setAbierto(false)
  }

  function manejarTecla(e) {
    if (!abierto || visibles.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setResaltado((i) => Math.min(i + 1, visibles.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setResaltado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      elegir(visibles[resaltado])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={17}
          strokeWidth={1.8}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3AFBF' }}
        />
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={manejarTecla}
          placeholder={placeholder}
          style={{ width: '100%', fontSize: '1rem', padding: '0.7rem 0.9rem 0.7rem 2.3rem' }}
        />
      </div>

      {abierto && texto.trim() && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: '#FFFFFF',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(31, 58, 95, 0.12)',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {visibles.length === 0 ? (
            <p style={{ margin: 0, padding: '0.85rem', color: '#A3AFBF', fontSize: '0.9rem' }}>
              No encontré nada con "{texto.trim()}".
            </p>
          ) : (
            visibles.map((p, i) => {
              const stock = Number(p.stock_actual)
              const agotado = stock <= 0
              const bajo = !agotado && Number(p.stock_minimo) > 0 && stock <= Number(p.stock_minimo)

              return (
                <button
                  key={`${p.producto_id}-${p.variante_id || ''}`}
                  type="button"
                  onClick={() => elegir(p)}
                  onMouseEnter={() => setResaltado(i)}
                  disabled={agotado}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '0.7rem',
                    textAlign: 'left',
                    background: i === resaltado && !agotado ? '#F7F9FC' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #F7F9FC',
                    borderRadius: 0,
                    padding: '0.6rem 0.8rem',
                    opacity: agotado ? 0.5 : 1,
                    cursor: agotado ? 'not-allowed' : 'pointer',
                  }}
                >
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt=""
                      style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: '#F7F9FC',
                        border: '1px solid #E6ECF3',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, color: '#253046', fontSize: '0.92rem' }}>
                      {p.nombre_completo}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        color: '#A3AFBF',
                        fontSize: '0.78rem',
                        marginTop: '0.1rem',
                      }}
                    >
                      {p.categoria_nombre && (
                        <span
                          style={{
                            background: '#F7F9FC',
                            border: '1px solid #E6ECF3',
                            borderRadius: 999,
                            padding: '0.05rem 0.45rem',
                            color: '#64748B',
                            fontWeight: 600,
                          }}
                        >
                          {p.categoria_nombre}
                        </span>
                      )}
                      <span>
                        {p.codigo}
                        {p.observaciones && ` · ${p.observaciones}`}
                      </span>
                    </span>
                  </span>

                  <span style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: '#1F3A5F', fontSize: '0.92rem' }}>
                      {fmt(p.precio_venta)}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: agotado ? '#EF4444' : bajo ? '#F59E0B' : '#22C55E',
                      }}
                    >
                      {agotado ? 'Agotado' : `${stock.toFixed(0)} ${p.unidad_medida}`}
                    </span>
                  </span>
                </button>
              )
            })
          )}

          {resultados.length > LIMITE && (
            <p
              style={{
                margin: 0,
                padding: '0.6rem 0.8rem',
                background: '#F7F9FC',
                color: '#64748B',
                fontSize: '0.82rem',
                textAlign: 'center',
              }}
            >
              Hay {resultados.length - LIMITE} más. Agrega otra palabra para acotar — por ejemplo el color o la talla.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
