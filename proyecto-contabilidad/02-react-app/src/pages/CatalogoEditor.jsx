import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function CatalogoEditor() {
  const { id: empresaId, catalogoId } = useParams()

  const [catalogo, setCatalogo] = useState(null)
  const [items, setItems] = useState([])
  const [stock, setStock] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [guardandoWhatsapp, setGuardandoWhatsapp] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')

  async function cargar() {
    setCargando(true)
    const [cRes, iRes, sRes, eRes] = await Promise.all([
      supabase.from('catalogos').select('*').eq('id', catalogoId).single(),
      supabase.from('catalogo_items').select('*').eq('catalogo_id', catalogoId),
      supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre_completo'),
      supabase.from('empresas').select('nombre, whatsapp').eq('id', empresaId).single(),
    ])

    if (cRes.error) setError(cRes.error.message)
    setCatalogo(cRes.data)
    setItems(iRes.data || [])
    setStock(sRes.data || [])
    setEmpresa(eRes.data)
    setWhatsapp(eRes.data?.whatsapp || '')

    const { data: st } = await supabase.rpc('estadisticas_catalogo', { p_catalogo_id: catalogoId })
    setStats(st)

    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoId])

  const clave = (s) => `${s.producto_id}|${s.variante_id || ''}`
  const itemPorClave = useMemo(
    () => new Map(items.map((i) => [`${i.producto_id}|${i.variante_id || ''}`, i])),
    [items]
  )

  const incluidos = stock.filter((s) => itemPorClave.has(clave(s)))
  const sinFoto = incluidos.filter((s) => !s.imagen_url)

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return stock
    return stock.filter((s) => s.nombre_completo.toLowerCase().includes(q) || (s.codigo || '').toLowerCase().includes(q))
  }, [stock, busqueda])

  async function alternarProducto(s) {
    const k = clave(s)
    const existente = itemPorClave.get(k)

    if (existente) {
      setItems((prev) => prev.filter((i) => i.id !== existente.id))
      await supabase.from('catalogo_items').delete().eq('id', existente.id)
    } else {
      const { data, error } = await supabase
        .from('catalogo_items')
        .insert({
          catalogo_id: catalogoId,
          producto_id: s.producto_id,
          variante_id: s.variante_id || null,
          orden: items.length,
        })
        .select()
        .single()

      if (error) return setError(error.message)
      setItems((prev) => [...prev, data])
    }
  }

  async function ponerPrecioEspecial(s, valor) {
    const item = itemPorClave.get(clave(s))
    if (!item) return
    const precio = valor === '' ? null : parseFloat(valor)

    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, precio_especial: precio } : i)))
    await supabase.from('catalogo_items').update({ precio_especial: precio }).eq('id', item.id)
  }

  async function actualizarCatalogo(cambios) {
    setCatalogo((prev) => ({ ...prev, ...cambios }))
    const { error } = await supabase.from('catalogos').update(cambios).eq('id', catalogoId)
    if (error) setError(error.message)
  }

  async function guardarWhatsapp() {
    setGuardandoWhatsapp(true)
    await supabase.from('empresas').update({ whatsapp }).eq('id', empresaId)
    setGuardandoWhatsapp(false)
    setEmpresa((prev) => ({ ...prev, whatsapp }))
  }

  const enlace = catalogo ? `${window.location.origin}/c/${catalogo.slug}` : ''

  function copiarEnlace() {
    navigator.clipboard.writeText(enlace)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function compartirWhatsapp() {
    const texto = encodeURIComponent(`¡Mira nuestro catálogo! ${catalogo.nombre}\n${enlace}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank', 'noopener')
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!catalogo) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error || 'Catálogo no encontrado.'}</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/catalogos`}>&larr; Catálogos</Link>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{catalogo.nombre}</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>
            {incluidos.length} {incluidos.length === 1 ? 'producto elegido' : 'productos elegidos'}
            {catalogo.fecha_fin && ` · termina el ${catalogo.fecha_fin}`}
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
          <input
            type="checkbox"
            checked={catalogo.publicado}
            onChange={(e) => actualizarCatalogo({ publicado: e.target.checked })}
          />
          <strong style={{ color: catalogo.publicado ? '#22C55E' : '#64748B' }}>
            {catalogo.publicado ? 'Publicado' : 'Sin publicar'}
          </strong>
        </label>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {/* Enlace para compartir */}
      {catalogo.publicado && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 16,
            padding: '1.1rem',
            margin: '1.25rem 0',
          }}
        >
          <p style={{ margin: '0 0 0.6rem', fontWeight: 600, color: '#15803D' }}>Tu catálogo está en vivo</p>
          <code
            style={{
              display: 'block',
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 10,
              padding: '0.6rem 0.8rem',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              marginBottom: '0.75rem',
            }}
          >
            {enlace}
          </code>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-hero" type="button" onClick={compartirWhatsapp}>
              Compartir por WhatsApp
            </button>
            <button type="button" onClick={copiarEnlace} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {copiado ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.8} />}
              {copiado ? 'Copiado' : 'Copiar enlace'}
            </button>
            <a href={enlace} target="_blank" rel="noopener noreferrer">
              <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ExternalLink size={16} strokeWidth={1.8} />
                Ver como lo ve el cliente
              </button>
            </a>
          </div>
        </div>
      )}

      {/* Avisos */}
      {!empresa?.whatsapp && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 16,
            padding: '1rem 1.15rem',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{ margin: '0 0 0.6rem', color: '#8a5a00', fontSize: '0.92rem' }}>
            <strong>Falta tu WhatsApp.</strong> Es lo que convierte una visita en una venta: sin él, el cliente ve
            el producto pero no puede consultarte.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label>
              Número con código de país
              <br />
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="591 70000000"
                style={{ width: 180 }}
              />
            </label>
            <button type="button" onClick={guardarWhatsapp} disabled={guardandoWhatsapp || !whatsapp.trim()}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {sinFoto.length > 0 && (
        <p
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 12,
            padding: '0.7rem 0.9rem',
            fontSize: '0.9rem',
            color: '#1e40af',
          }}
        >
          <strong>{sinFoto.length}</strong> de los productos elegidos no tienen foto. Un catálogo sin fotos convence
          mucho menos —{' '}
          <Link to={`/empresas/${empresaId}/inventario/productos`}>súbelas desde Productos</Link>.
        </p>
      )}

      {/* Estadísticas */}
      {catalogo.publicado && stats && (
        <>
          <h2>Cómo va</h2>
          <div className="stat-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card destacada-ventas">
              <p className="stat-label">Visitas totales</p>
              <p className="stat-value">{stats.total_visitas}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Últimos 7 días</p>
              <p className="stat-value">{stats.visitas_semana}</p>
            </div>
          </div>

          {stats.productos_mas_vistos?.length > 0 && (
            <section className="panel-card" style={{ marginBottom: '1.5rem' }}>
              <h3>Lo que más miran</h3>
              <ul className="panel-lista">
                {stats.productos_mas_vistos.map((p, i) => (
                  <li key={i}>
                    <span>{p.nombre}</span>
                    <span style={{ color: '#64748B' }}>{p.vistas} {p.vistas === 1 ? 'vez' : 'veces'}</span>
                  </li>
                ))}
              </ul>
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                Cuenta cuántas veces alguien tocó el producto para consultarte.
              </p>
            </section>
          )}
        </>
      )}

      {/* Opciones */}
      <h2>Opciones</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={catalogo.ocultar_agotados}
            onChange={(e) => actualizarCatalogo({ ocultar_agotados: e.target.checked })}
          />
          Esconder los productos agotados
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={catalogo.mostrar_precios}
            onChange={(e) => actualizarCatalogo({ mostrar_precios: e.target.checked })}
          />
          Mostrar precios (desmárcalo si prefieres que te consulten)
        </label>
      </div>

      {/* Elegir productos */}
      <h2>Elige los productos</h2>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto..."
        style={{ width: '100%', maxWidth: 320, marginBottom: '0.75rem' }}
      />

      {stock.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <BoliMascot pose="pensando" size={110} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#64748B' }}>
            Todavía no tienes productos. <Link to={`/empresas/${empresaId}/inventario/productos`}>Agrégalos primero</Link>.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px', width: 40 }}></th>
                <th style={{ padding: '4px 8px' }}>Producto</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio normal</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio en el catálogo</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((s) => {
                const item = itemPorClave.get(clave(s))
                const incluido = Boolean(item)
                return (
                  <tr
                    key={clave(s)}
                    style={{
                      borderBottom: '1px solid #E6ECF3',
                      background: incluido ? 'rgba(242, 85, 90, 0.04)' : undefined,
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      <input type="checkbox" checked={incluido} onChange={() => alternarProducto(s)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {s.imagen_url ? (
                          <img
                            src={s.imagen_url}
                            alt=""
                            style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: '#F7F9FC',
                              border: '1px dashed #E6ECF3',
                            }}
                          />
                        )}
                        <span>{s.nombre_completo}</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748B' }}>
                      {fmt(s.precio_venta)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {incluido ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precio_especial ?? ''}
                          onChange={(e) => ponerPrecioEspecial(s, e.target.value)}
                          placeholder="igual"
                          style={{ width: 100, textAlign: 'right' }}
                        />
                      ) : (
                        <span style={{ color: '#A3AFBF' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.85rem', marginTop: '0.75rem' }}>
        Deja el precio del catálogo vacío para usar el precio normal. Si pones uno menor, el catálogo muestra el
        precio tachado y el porcentaje de descuento.
      </p>
    </main>
  )
}
