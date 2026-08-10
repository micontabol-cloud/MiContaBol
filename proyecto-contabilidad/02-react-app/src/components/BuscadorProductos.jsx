import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

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

    return productos
      .filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(q) ||
          (p.codigo || '').toLowerCase().includes(q) ||
          (p.codigo_barras || '').toLowerCase().includes(q) ||
          (p.observaciones || '').toLowerCase().includes(q)
      )
      // Lo que tiene stock primero: de nada sirve ofrecer lo agotado
      .sort((a, b) => (Number(b.stock_actual) > 0) - (Number(a.stock_actual) > 0))
      .slice(0, 8)
  }, [productos, texto])

  useEffect(() => {
    setResaltado(0)
  }, [texto])

  function elegir(p) {
    onElegir(p)
    setTexto('')
    setAbierto(false)
  }

  function manejarTecla(e) {
    if (!abierto || resultados.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setResaltado((i) => Math.min(i + 1, resultados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setResaltado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      elegir(resultados[resaltado])
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
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {resultados.length === 0 ? (
            <p style={{ margin: 0, padding: '0.85rem', color: '#A3AFBF', fontSize: '0.9rem' }}>
              No encontré nada con "{texto.trim()}".
            </p>
          ) : (
            resultados.map((p, i) => {
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
                    <span style={{ display: 'block', color: '#A3AFBF', fontSize: '0.78rem' }}>
                      {p.codigo}
                      {p.observaciones && ` · ${p.observaciones}`}
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
        </div>
      )}
    </div>
  )
}
