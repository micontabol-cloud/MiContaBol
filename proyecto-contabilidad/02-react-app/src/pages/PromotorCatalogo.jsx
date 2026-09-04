import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotorCatalogo() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase.rpc('catalogo_promotor')
      if (err) setError(err.message)
      setDatos(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const productos = datos?.productos || []

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productos

    const palabras = q.split(/\s+/).filter(Boolean)
    return productos.filter((p) => {
      const todo = [p.nombre, p.categoria, p.observaciones].filter(Boolean).join(' ').toLowerCase()
      return palabras.every((w) => todo.includes(w))
    })
  }, [productos, busqueda])

  if (cargando) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error}</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: 0 }}>Qué puedo vender</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>
        {datos?.tipo_acceso === 'total'
          ? 'Todo el inventario de la tienda.'
          : 'La mercadería que te entregaron.'}
      </p>

      <div
        style={{
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.28)',
          borderRadius: 12,
          padding: '0.85rem 1rem',
          margin: '1.25rem 0',
          fontSize: '0.92rem',
          color: '#253046',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: '#15803D' }}>Precio sugerido</strong> es a cuánto se vende en la tienda.{' '}
        <strong style={{ color: '#15803D' }}>Le pagas</strong> es lo que le entregas al negocio. La diferencia es
        tuya, y puedes cobrar más si quieres.
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, color o talla..."
        style={{ width: '100%', maxWidth: 360, marginBottom: '1.25rem' }}
      />

      {productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <Package size={44} strokeWidth={1.4} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
            Todavía no tienes mercadería asignada. Pídele al dueño del negocio que te entregue productos para
            vender.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {visibles.map((p) => (
              <div
                key={`${p.producto_id}-${p.variante_id || ''}`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    aspectRatio: '1',
                    background: p.imagen_url ? `url(${p.imagen_url}) center/cover` : '#F7F9FC',
                    position: 'relative',
                  }}
                >
                  {!p.imagen_url && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        color: '#A3AFBF',
                        fontSize: '0.82rem',
                      }}
                    >
                      Sin foto
                    </span>
                  )}

                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #E6ECF3',
                      borderRadius: 999,
                      padding: '0.15rem 0.6rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#1F3A5F',
                    }}
                  >
                    {p.disponible}
                  </span>
                </div>

                <div style={{ padding: '0.75rem 0.85rem 0.9rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>{p.nombre}</p>

                  {(p.categoria || p.observaciones) && (
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#A3AFBF' }}>
                      {[p.categoria, p.observaciones].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: '0.6rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid #F7F9FC',
                      fontSize: '0.85rem',
                    }}
                  >
                    <p style={{ margin: 0, color: '#64748B' }}>
                      Precio sugerido: <strong style={{ color: '#1F3A5F' }}>{fmt(p.precio_publico)}</strong>
                    </p>
                    <p style={{ margin: '0.15rem 0 0', color: '#64748B' }}>
                      Le pagas: <strong>{fmt(p.precio_mayorista)}</strong>
                    </p>
                    <p style={{ margin: '0.25rem 0 0', color: '#22C55E', fontWeight: 700 }}>
                      Ganas {fmt(p.tu_ganancia)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {visibles.length === 0 && (
            <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem 0' }}>
              No encontré nada con "{busqueda}".
            </p>
          )}

          <Link to={`/empresas/${empresaId}/promotor/vender`}>
            <button
              className="btn-hero"
              type="button"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Plus size={19} strokeWidth={2.5} />
              Registrar una venta
            </button>
          </Link>
        </>
      )}
    </main>
  )
}
