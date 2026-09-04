import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Plus, Eye, EyeOff, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotorCatalogo() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // Si le muestra la pantalla a un cliente, no debería ver
  // cuánto gana. Arranca oculto por eso mismo.
  const [verGanancias, setVerGanancias] = useState(false)

  const [detalle, setDetalle] = useState(null)
  const [fotoGrande, setFotoGrande] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase.rpc('catalogo_promotor')
      if (err) setError(err.message)
      setDatos(data)
      setCargando(false)
    }
    cargar()
  }, [])

  // Escape cierra lo que esté abierto
  useEffect(() => {
    function alPresionar(e) {
      if (e.key !== 'Escape') return
      if (fotoGrande) setFotoGrande(null)
      else if (detalle) setDetalle(null)
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [detalle, fotoGrande])

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Qué puedo vender</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>
            {datos?.tipo_acceso === 'total'
              ? 'Todo el inventario de la tienda.'
              : 'La mercadería que te entregaron.'}
          </p>
        </div>

        {/* El ojito: para poder mostrar la pantalla sin exponer
            lo que gana */}
        <button
          type="button"
          onClick={() => setVerGanancias(!verGanancias)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.88rem',
            background: verGanancias ? 'rgba(34,197,94,0.08)' : '#FFFFFF',
            borderColor: verGanancias ? 'rgba(34,197,94,0.4)' : undefined,
            color: verGanancias ? '#15803D' : '#64748B',
          }}
        >
          {verGanancias ? <Eye size={16} strokeWidth={1.9} /> : <EyeOff size={16} strokeWidth={1.9} />}
          {verGanancias ? 'Ocultar mis ganancias' : 'Ver mis ganancias'}
        </button>
      </div>

      {verGanancias ? (
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
      ) : (
        <p
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            padding: '0.8rem 1rem',
            margin: '1.25rem 0',
            fontSize: '0.9rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Tus ganancias están ocultas: así puedes mostrarle esta pantalla a un cliente sin que vea tus números.
        </p>
      )}

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
              <button
                key={`${p.producto_id}-${p.variante_id || ''}`}
                type="button"
                onClick={() => setDetalle(p)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 14,
                  overflow: 'hidden',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#253046',
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

                  <p style={{ margin: '0.5rem 0 0', fontWeight: 700, color: '#1F3A5F', fontSize: '1rem' }}>
                    {fmt(p.precio_publico)}
                  </p>

                  {verGanancias && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #F7F9FC',
                        fontSize: '0.82rem',
                      }}
                    >
                      <p style={{ margin: 0, color: '#64748B' }}>
                        Le pagas: <strong>{fmt(p.precio_mayorista)}</strong>
                      </p>
                      <p style={{ margin: '0.2rem 0 0', color: '#22C55E', fontWeight: 700 }}>
                        Ganas {fmt(p.tu_ganancia)}
                      </p>
                    </div>
                  )}
                </div>
              </button>
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

      {/* Detalle del producto */}
      {detalle && (
        <div
          onClick={() => setDetalle(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 26, 41, 0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
            zIndex: 80,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 460,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setDetalle(null)}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1,
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid #E6ECF3',
                borderRadius: '50%',
                width: 34,
                height: 34,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <X size={17} strokeWidth={2} />
            </button>

            {/* La foto, tocable para agrandar */}
            {detalle.imagen_url ? (
              <button
                type="button"
                onClick={() => setFotoGrande(detalle.imagen_url)}
                title="Toca para ver más grande"
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '1',
                  background: `url(${detalle.imagen_url}) center/cover`,
                  border: 'none',
                  borderRadius: '18px 18px 0 0',
                  padding: 0,
                  cursor: 'zoom-in',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: '#F7F9FC',
                  borderRadius: '18px 18px 0 0',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#A3AFBF',
                }}
              >
                Sin foto
              </div>
            )}

            <div style={{ padding: '1.25rem 1.4rem 1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{detalle.nombre}</h2>

              {(detalle.categoria || detalle.observaciones) && (
                <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.92rem' }}>
                  {[detalle.categoria, detalle.observaciones].filter(Boolean).join(' · ')}
                </p>
              )}

              <p style={{ margin: '1rem 0 0', fontSize: '1.7rem', fontWeight: 800, color: '#1F3A5F' }}>
                {fmt(detalle.precio_publico)}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#A3AFBF' }}>Precio sugerido</p>

              <div
                style={{
                  background: '#F7F9FC',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  marginTop: '1rem',
                  fontSize: '0.92rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Tienes disponibles</span>
                  <strong>{detalle.disponible}</strong>
                </div>

                {verGanancias && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <span style={{ color: '#64748B' }}>Le pagas al negocio</span>
                      <strong>{fmt(detalle.precio_mayorista)}</strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #E6ECF3',
                      }}
                    >
                      <strong style={{ color: '#15803D' }}>Tu ganancia</strong>
                      <strong style={{ color: '#22C55E', fontSize: '1.1rem' }}>{fmt(detalle.tu_ganancia)}</strong>
                    </div>
                  </>
                )}
              </div>

              {!verGanancias && (
                <button
                  type="button"
                  onClick={() => setVerGanancias(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    padding: 0,
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Eye size={14} strokeWidth={1.9} />
                  Ver cuánto gano con este
                </button>
              )}

              <Link to={`/empresas/${empresaId}/promotor/vender`} style={{ display: 'block', marginTop: '1.25rem' }}>
                <button className="btn-hero" type="button" style={{ width: '100%' }}>
                  Vender este producto
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Foto ampliada */}
      {fotoGrande && (
        <div
          onClick={() => setFotoGrande(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 26, 41, 0.92)',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
            zIndex: 90,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={fotoGrande}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10 }}
          />

          <button
            type="button"
            onClick={() => setFotoGrande(null)}
            aria-label="Cerrar"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              padding: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF',
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
      )}
    </main>
  )
}
