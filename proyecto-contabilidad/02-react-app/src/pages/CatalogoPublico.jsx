import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

const ETIQUETA_TIPO = {
  catalogo: null,
  oferta: 'Oferta por tiempo limitado',
  liquidacion: 'Liquidación',
  lista_precios: 'Lista de precios',
}

function diasRestantes(fechaFin) {
  if (!fechaFin) return null
  const dias = Math.ceil((new Date(fechaFin) - new Date()) / (1000 * 60 * 60 * 24))
  return dias
}

export default function CatalogoPublico() {
  const { slug } = useParams()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.rpc('ver_catalogo_publico', { p_slug: slug })
      setDatos(data)
      setCargando(false)

      if (data) {
        // Registra que alguien abrió el catálogo
        supabase.rpc('registrar_visita_catalogo', { p_slug: slug, p_producto_id: null })
      }
    }
    cargar()
  }, [slug])

  function alTocarProducto(item) {
    supabase.rpc('registrar_visita_catalogo', { p_slug: slug, p_producto_id: item.producto_id })

    if (datos?.whatsapp) {
      const numero = String(datos.whatsapp).replace(/\D/g, '')
      const mensaje = encodeURIComponent(
        `Hola, vi "${item.nombre}" en su catálogo${item.precio ? ` a ${fmt(item.precio)}` : ''} y me interesa.`
      )
      window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank', 'noopener')
    }
  }

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748B' }}>Cargando catálogo...</p>
      </div>
    )
  }

  if (!datos) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <img src="/boli/boli-triste.png" alt="" width={120} style={{ height: 'auto' }} />
          <h1 style={{ fontSize: '1.4rem' }}>Este catálogo ya no está disponible</h1>
          <p style={{ color: '#64748B' }}>Puede que haya terminado o que el enlace esté mal escrito.</p>
        </div>
      </div>
    )
  }

  const dias = diasRestantes(datos.fecha_fin)
  const etiqueta = ETIQUETA_TIPO[datos.tipo]
  const esLista = datos.tipo === 'lista_precios'
  const terminado = !datos.vigente

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: 'sans-serif' }}>
      {/* Encabezado */}
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {etiqueta && (
            <span
              style={{
                display: 'inline-block',
                background: '#F2555A',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {etiqueta}
            </span>
          )}
          <h1 style={{ fontSize: '1.9rem', margin: '0.6rem 0 0.25rem', letterSpacing: '-0.01em' }}>{datos.nombre}</h1>
          <p style={{ color: '#C7D2E0', margin: 0 }}>{datos.empresa_nombre}</p>
          {datos.descripcion && (
            <p style={{ color: '#D5DEEA', margin: '0.75rem 0 0', maxWidth: 560, lineHeight: 1.5 }}>
              {datos.descripcion}
            </p>
          )}

          {terminado ? (
            <p
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                background: 'rgba(255,255,255,0.12)',
                padding: '0.5rem 0.9rem',
                borderRadius: 10,
                fontSize: '0.9rem',
              }}
            >
              Esta promoción ya terminó — consulta por precios actuales.
            </p>
          ) : (
            dias !== null &&
            dias >= 0 && (
              <p
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  background: '#F2555A',
                  padding: '0.5rem 0.9rem',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {dias === 0 ? '¡Último día!' : `Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`}
              </p>
            )
          )}
        </div>
      </header>

      {/* Productos */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>
        {datos.items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748B', padding: '3rem 0' }}>
            Por ahora no hay productos disponibles en este catálogo.
          </p>
        ) : esLista ? (
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E6ECF3', overflow: 'hidden' }}>
            {datos.items.map((item) => (
              <button
                key={`${item.producto_id}-${item.nombre}`}
                type="button"
                onClick={() => alTocarProducto(item)}
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1.1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #F7F9FC',
                  borderRadius: 0,
                  textAlign: 'left',
                  fontSize: '0.95rem',
                  color: '#253046',
                  cursor: datos.whatsapp ? 'pointer' : 'default',
                }}
              >
                <span>{item.nombre}</span>
                {item.precio !== null && (
                  <span style={{ fontWeight: 700, color: '#1F3A5F', whiteSpace: 'nowrap' }}>{fmt(item.precio)}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1rem',
            }}
          >
            {datos.items.map((item) => (
              <button
                key={`${item.producto_id}-${item.nombre}`}
                type="button"
                onClick={() => alTocarProducto(item)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 16,
                  overflow: 'hidden',
                  padding: 0,
                  textAlign: 'left',
                  cursor: datos.whatsapp ? 'pointer' : 'default',
                  boxShadow: '0 1px 2px rgba(31,58,95,0.05), 0 4px 12px rgba(31,58,95,0.04)',
                }}
              >
                <div
                  style={{
                    aspectRatio: '1',
                    background: item.imagen_url ? `url(${item.imagen_url}) center/cover` : '#F7F9FC',
                    position: 'relative',
                  }}
                >
                  {!item.imagen_url && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        color: '#A3AFBF',
                        fontSize: '0.8rem',
                      }}
                    >
                      Sin foto
                    </span>
                  )}
                  {item.precio_anterior && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: '#F2555A',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 999,
                      }}
                    >
                      -{Math.round((1 - item.precio / item.precio_anterior) * 100)}%
                    </span>
                  )}
                </div>

                <div style={{ padding: '0.75rem 0.85rem 0.9rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#253046', fontSize: '0.92rem', lineHeight: 1.3 }}>
                    {item.nombre}
                  </p>
                  {item.precio !== null && (
                    <p style={{ margin: '0.4rem 0 0', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      {item.precio_anterior && (
                        <span style={{ color: '#A3AFBF', textDecoration: 'line-through', fontSize: '0.82rem' }}>
                          {fmt(item.precio_anterior)}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: '#1F3A5F', fontSize: '1.05rem' }}>
                        {fmt(item.precio)}
                      </span>
                    </p>
                  )}
                  {!item.disponible && (
                    <p style={{ margin: '0.3rem 0 0', color: '#A3AFBF', fontSize: '0.8rem' }}>Sin stock</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {datos.whatsapp && datos.items.length > 0 && (
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.88rem', marginTop: '1.5rem' }}>
            Toca cualquier producto para consultar por WhatsApp.
          </p>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid #E6ECF3' }}>
        <p style={{ color: '#A3AFBF', fontSize: '0.8rem', margin: 0 }}>
          Catálogo hecho con{' '}
          <a href="/" style={{ color: '#F2555A', fontWeight: 600 }}>
            MiContaBol
          </a>
        </p>
      </footer>
    </div>
  )
}
