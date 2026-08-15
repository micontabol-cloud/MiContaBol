import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { obtenerTema } from '../lib/temasCatalogo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

const ETIQUETA_TIPO = {
  catalogo: null,
  oferta: 'Oferta por tiempo limitado',
  liquidacion: 'Liquidación',
  lista_precios: 'Lista de precios',
}

function diasRestantes(fechaFin) {
  if (!fechaFin) return null
  return Math.ceil((new Date(fechaFin) - new Date()) / (1000 * 60 * 60 * 24))
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
      if (data) supabase.rpc('registrar_visita_catalogo', { p_slug: slug, p_producto_id: null })
    }
    cargar()
  }, [slug])

  useEffect(() => {
    if (datos?.nombre) document.title = `${datos.nombre} — ${datos.empresa_nombre}`
  }, [datos])

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

  const t = obtenerTema(datos.tema)
  const marca = datos.color_marca || '#1F3A5F'
  const dias = diasRestantes(datos.fecha_fin)
  const etiqueta = ETIQUETA_TIPO[datos.tipo]
  const esLista = datos.tipo === 'lista_precios'
  const terminado = !datos.vigente
  const hayPortada = Boolean(datos.portada_url)

  return (
    <div style={{ minHeight: '100vh', background: t.fondo, color: t.texto, fontFamily: 'sans-serif' }}>
      {/* Portada: si hay foto va de fondo con un degradado del color de
          marca encima, para que el texto siempre se lea */}
      <header
        style={{
          position: 'relative',
          color: t.encabezadoTexto,
          padding: hayPortada ? '4.5rem 1.25rem 2.5rem' : '2.5rem 1.25rem',
          background: hayPortada
            ? `linear-gradient(180deg, ${marca}CC 0%, ${marca}E6 60%, ${marca} 100%), url(${datos.portada_url}) center/cover`
            : marca,
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {datos.logo_url && (
            <img
              src={datos.logo_url}
              alt={datos.empresa_nombre}
              style={{
                height: 66,
                width: 'auto',
                maxWidth: 200,
                objectFit: 'contain',
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '0.5rem 0.7rem',
                marginBottom: '1rem',
                display: 'block',
              }}
            />
          )}

          {etiqueta && (
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.35)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {etiqueta}
            </span>
          )}

          <h1 style={{ fontSize: '2rem', margin: '0.65rem 0 0.3rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {datos.nombre}
          </h1>
          <p style={{ opacity: 0.85, margin: 0, fontWeight: 500 }}>{datos.empresa_nombre}</p>

          {datos.descripcion && (
            <p style={{ opacity: 0.9, margin: '0.85rem 0 0', maxWidth: 560, lineHeight: 1.5 }}>{datos.descripcion}</p>
          )}

          {terminado ? (
            <p
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                background: 'rgba(255,255,255,0.15)',
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
                  background: '#FFFFFF',
                  color: marca,
                  padding: '0.5rem 0.9rem',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
              >
                {dias === 0 ? '¡Último día!' : `Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`}
              </p>
            )
          )}
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '1.75rem 1.25rem 3rem' }}>
        {datos.items.length === 0 ? (
          <p style={{ textAlign: 'center', color: t.textoSuave, padding: '3rem 0' }}>
            Por ahora no hay productos disponibles en este catálogo.
          </p>
        ) : esLista ? (
          <div style={{ background: t.superficie, borderRadius: 16, border: `1px solid ${t.borde}`, overflow: 'hidden' }}>
            {datos.items.map((item, i) => (
              <button
                key={i}
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
                  borderBottom: `1px solid ${t.borde}`,
                  borderRadius: 0,
                  textAlign: 'left',
                  fontSize: '0.95rem',
                  color: t.texto,
                  cursor: datos.whatsapp ? 'pointer' : 'default',
                }}
              >
                <span>{item.nombre}</span>
                {item.precio !== null && (
                  <span style={{ fontWeight: 700, color: marca, whiteSpace: 'nowrap' }}>{fmt(item.precio)}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {datos.items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => alTocarProducto(item)}
                style={{
                  background: t.superficie,
                  border: `1px solid ${t.borde}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  padding: 0,
                  textAlign: 'left',
                  cursor: datos.whatsapp ? 'pointer' : 'default',
                  color: t.texto,
                }}
              >
                <div
                  style={{
                    aspectRatio: '1',
                    background: item.imagen_url ? `url(${item.imagen_url}) center/cover` : t.fondo,
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
                        color: t.textoSuave,
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
                        background: marca,
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
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.3 }}>{item.nombre}</p>
                  {item.precio !== null && (
                    <p style={{ margin: '0.4rem 0 0', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      {item.precio_anterior && (
                        <span style={{ color: t.textoSuave, textDecoration: 'line-through', fontSize: '0.82rem' }}>
                          {fmt(item.precio_anterior)}
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: marca, fontSize: '1.05rem' }}>{fmt(item.precio)}</span>
                    </p>
                  )}
                  {!item.disponible && (
                    <p style={{ margin: '0.3rem 0 0', color: t.textoSuave, fontSize: '0.8rem' }}>Sin stock</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {datos.whatsapp && datos.items.length > 0 && (
          <p style={{ textAlign: 'center', color: t.textoSuave, fontSize: '0.88rem', marginTop: '1.5rem' }}>
            Toca cualquier producto para consultar por WhatsApp.
          </p>
        )}
      </main>

      {/* Quién atiende */}
      {datos.responsable_nombre && (
        <section style={{ background: t.superficie, borderTop: `1px solid ${t.borde}`, padding: '1.75rem 1.25rem' }}>
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {datos.responsable_foto ? (
              <img
                src={datos.responsable_foto}
                alt={datos.responsable_nombre}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${marca}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: marca,
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {datos.responsable_nombre.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: t.textoSuave }}>Te atiende</p>
              <p style={{ margin: '0.1rem 0 0', fontWeight: 700, fontSize: '1.05rem' }}>
                {datos.responsable_nombre}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Contacto */}
      {(datos.direccion || datos.horarios || datos.instagram || datos.facebook || datos.whatsapp) && (
        <section style={{ background: t.superficie, borderTop: `1px solid ${t.borde}`, padding: '2rem 1.25rem' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.9rem', color: marca }}>Visítanos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem' }}>
              {datos.direccion && (
                <p style={{ margin: 0 }}>
                  📍{' '}
                  {datos.maps_url ? (
                    <a href={datos.maps_url} target="_blank" rel="noopener noreferrer" style={{ color: marca }}>
                      {datos.direccion}
                    </a>
                  ) : (
                    datos.direccion
                  )}
                </p>
              )}
              {datos.horarios && <p style={{ margin: 0 }}>🕒 {datos.horarios}</p>}
              {datos.whatsapp && (
                <p style={{ margin: 0 }}>
                  💬{' '}
                  <a
                    href={`https://wa.me/${String(datos.whatsapp).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: marca }}
                  >
                    Escríbenos por WhatsApp
                  </a>
                </p>
              )}
              {datos.instagram && (
                <p style={{ margin: 0 }}>
                  📷{' '}
                  <a
                    href={`https://instagram.com/${String(datos.instagram).replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: marca }}
                  >
                    @{String(datos.instagram).replace('@', '')}
                  </a>
                </p>
              )}
              {datos.facebook && (
                <p style={{ margin: 0 }}>
                  👍{' '}
                  <a href={datos.facebook} target="_blank" rel="noopener noreferrer" style={{ color: marca }}>
                    Síguenos en Facebook
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '1.5rem', borderTop: `1px solid ${t.borde}` }}>
        <p style={{ color: t.textoSuave, fontSize: '0.8rem', margin: 0 }}>
          Catálogo hecho con{' '}
          <a href="/" style={{ color: marca, fontWeight: 600 }}>
            MiContaBol
          </a>
        </p>
      </footer>
    </div>
  )
}
