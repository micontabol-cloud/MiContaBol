import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Undo2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ConsignacionPromotor() {
  const { id: empresaId, promotorId } = useParams()
  const navigate = useNavigate()

  const [promotor, setPromotor] = useState(null)
  const [stock, setStock] = useState([])
  const [enMano, setEnMano] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState({})
  const [nota, setNota] = useState('')
  const [entregando, setEntregando] = useState(false)

  const [devolviendo, setDevolviendo] = useState(null)
  const [cantidadDev, setCantidadDev] = useState('')

  async function cargar() {
    setCargando(true)

    const [{ data: p }, { data: s }, { data: c }] = await Promise.all([
      supabase.from('promotores').select('*').eq('id', promotorId).single(),
      supabase
        .from('vista_stock')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .gt('stock_actual', 0)
        .order('nombre_completo'),
      supabase.rpc('consignado_promotor', { p_promotor_id: promotorId }),
    ])

    setPromotor(p)
    setStock(s || [])
    setEnMano(c?.productos || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotorId])

  const clave = (p) => `${p.producto_id}|${p.variante_id || ''}`

  // Lo que ya está con este promotor, para no ofrecerlo de nuevo
  const yaTiene = useMemo(() => {
    const m = new Map()
    enMano.forEach((p) => m.set(`${p.producto_id}|${p.variante_id || ''}`, Number(p.en_mano)))
    return m
  }, [enMano])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return stock
    const palabras = q.split(/\s+/).filter(Boolean)

    return stock.filter((s) => {
      const todo = [s.nombre_completo, s.codigo, s.categoria_nombre, s.observaciones]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return palabras.every((w) => todo.includes(w))
    })
  }, [stock, busqueda])

  const totalElegido = Object.values(seleccion).reduce((s, v) => s + (Number(v) || 0), 0)

  async function entregar() {
    const lineas = Object.entries(seleccion)
      .filter(([, cant]) => Number(cant) > 0)
      .map(([k, cant]) => {
        const [producto_id, variante_id] = k.split('|')
        return {
          producto_id,
          variante_id: variante_id || null,
          cantidad: Number(cant),
        }
      })

    if (lineas.length === 0) {
      setError('Elige al menos un producto.')
      return
    }

    setError(null)
    setEntregando(true)

    const { data, error } = await supabase.rpc('entregar_mercaderia', {
      p_promotor_id: promotorId,
      p_lineas: lineas,
      p_nota: nota || null,
    })

    setEntregando(false)
    if (error) return setError(error.message)

    setSeleccion({})
    setNota('')
    setAviso(`Le entregaste ${data.productos} ${data.productos === 1 ? 'producto' : 'productos'}.`)
    setTimeout(() => setAviso(null), 6000)
    cargar()
  }

  async function devolver(p) {
    setError(null)

    const { error } = await supabase.rpc('recibir_devolucion', {
      p_promotor_id: promotorId,
      p_producto_id: p.producto_id,
      p_variante_id: p.variante_id || null,
      p_cantidad: Number(cantidadDev),
    })

    if (error) return setError(error.message)

    setDevolviendo(null)
    setCantidadDev('')
    setAviso('Devolución registrada.')
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!promotor) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>No encontré ese promotor.</p>
      </main>
    )
  }

  const totalEnMano = enMano.reduce((s, p) => s + Number(p.en_mano || 0), 0)

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <p>
        <Link
          to={`/empresas/${empresaId}/promotores`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Promotores
        </Link>
      </p>

      <h1 style={{ margin: 0 }}>Mercadería de {promotor.nombre}</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 1.5rem' }}>
        {promotor.descuento_mayorista}% de descuento ·{' '}
        {promotor.tipo_acceso === 'total'
          ? 've todo tu inventario'
          : 'solo puede vender lo que le entregues'}
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && (
        <p
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: '0.75rem 0.95rem',
            color: '#15803D',
            fontSize: '0.92rem',
          }}
        >
          {aviso}
        </p>
      )}

      {promotor.tipo_acceso === 'total' && (
        <p
          style={{
            background: 'rgba(59, 130, 246, 0.07)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 12,
            padding: '0.85rem 1rem',
            fontSize: '0.9rem',
            color: '#1e40af',
            lineHeight: 1.55,
            marginBottom: '1.25rem',
          }}
        >
          Este promotor puede vender cualquier cosa de tu stock, así que no necesita que le entregues mercadería.
          Aun así puedes hacerlo si quiere llevarse productos consigo.
        </p>
      )}

      {/* Lo que ya tiene */}
      {enMano.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>
            Lo que tiene ahora <span style={{ color: '#A3AFBF', fontWeight: 400 }}>({totalEnMano} unidades)</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {enMano.map((p) => (
              <div
                key={clave(p)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 12,
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 220 }}>
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt=""
                        style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          background: '#F7F9FC',
                          border: '1px dashed #E6ECF3',
                        }}
                      />
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem' }}>{p.nombre}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#A3AFBF' }}>
                        {[p.categoria, p.observaciones].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span>
                      Tiene: <strong style={{ color: '#1F3A5F' }}>{p.en_mano}</strong>
                    </span>
                    {Number(p.vendido) > 0 && (
                      <span style={{ color: '#22C55E' }}>Vendió: {p.vendido}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDevolviendo(devolviendo === clave(p) ? null : clave(p))
                        setCantidadDev(String(p.en_mano))
                      }}
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.3rem 0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Undo2 size={14} strokeWidth={1.9} />
                      Devolvió
                    </button>
                  </div>
                </div>

                {devolviendo === clave(p) && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #E6ECF3',
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'flex-end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <label style={{ fontSize: '0.85rem' }}>
                      ¿Cuántas te devolvió?
                      <br />
                      <input
                        type="number"
                        min="1"
                        max={p.en_mano}
                        value={cantidadDev}
                        onChange={(e) => setCantidadDev(e.target.value)}
                        style={{ width: 90 }}
                      />
                    </label>
                    <button type="button" className="btn-hero" onClick={() => devolver(p)}>
                      Registrar
                    </button>
                    <button type="button" onClick={() => setDevolviendo(null)}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Entregar */}
      <h2>Entregarle mercadería</h2>
      <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '-0.4rem', lineHeight: 1.55 }}>
        La mercadería <strong>sigue siendo tuya</strong> hasta que él la venda. No sale de tu inventario, solo
        cambia de lugar.
      </p>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto..."
        style={{ width: '100%', maxWidth: 340, margin: '1rem 0' }}
      />

      {stock.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <Package size={40} strokeWidth={1.4} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem' }}>No tienes productos con stock disponible.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                  <th style={{ padding: '6px 8px' }}>Producto</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Tienes</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Ya tiene él</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Precio para él</th>
                  <th style={{ padding: '6px 8px', width: 110 }}>Entregar</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => {
                  const k = clave(s)
                  const tiene = yaTiene.get(k) || 0
                  const mayorista = Number(s.precio_venta) * (1 - promotor.descuento_mayorista / 100)

                  return (
                    <tr
                      key={k}
                      style={{
                        borderBottom: '1px solid #E6ECF3',
                        background: seleccion[k] > 0 ? 'rgba(34, 197, 94, 0.04)' : undefined,
                      }}
                    >
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
                          <span>
                            {s.nombre_completo}
                            {(s.categoria_nombre || s.observaciones) && (
                              <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF' }}>
                                {[s.categoria_nombre, s.observaciones].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.stock_actual}</td>

                      <td style={{ padding: '6px 8px', textAlign: 'right', color: tiene > 0 ? '#1F3A5F' : '#A3AFBF' }}>
                        {tiene || '—'}
                      </td>

                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: '#1F3A5F' }}>{fmt(mayorista)}</span>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF' }}>
                          público {fmt(s.precio_venta)}
                        </span>
                      </td>

                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          min="0"
                          max={s.stock_actual}
                          value={seleccion[k] || ''}
                          onChange={(e) =>
                            setSeleccion({ ...seleccion, [k]: e.target.value })
                          }
                          placeholder="0"
                          style={{ width: 80, textAlign: 'right' }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Confirmar */}
          <div
            style={{
              background: totalElegido > 0 ? 'rgba(34, 197, 94, 0.06)' : '#F7F9FC',
              border: `1px solid ${totalElegido > 0 ? 'rgba(34, 197, 94, 0.3)' : '#E6ECF3'}`,
              borderRadius: 16,
              padding: '1.15rem 1.3rem',
              marginTop: '1.5rem',
            }}
          >
            {totalElegido > 0 ? (
              <>
                <p style={{ margin: '0 0 0.85rem', fontWeight: 700, color: '#1F3A5F' }}>
                  Le vas a entregar {totalElegido} {totalElegido === 1 ? 'unidad' : 'unidades'}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <label style={{ flex: 1, minWidth: 220 }}>
                    Nota (opcional)
                    <br />
                    <input
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="ej. Para la feria del domingo"
                      style={{ width: '100%' }}
                    />
                  </label>

                  <button type="button" className="btn-hero" onClick={entregar} disabled={entregando}>
                    {entregando ? 'Entregando...' : 'Confirmar entrega'}
                  </button>
                  <button type="button" onClick={() => setSeleccion({})}>
                    Limpiar
                  </button>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.92rem' }}>
                Pon cuántas unidades le entregas de cada producto.
              </p>
            )}
          </div>
        </>
      )}
    </main>
  )
}
