import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Ventas() {
  const { id: empresaId } = useParams()
  const [ventas, setVentas] = useState([])
  const [porCobrar, setPorCobrar] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)

      const [ventasRes, cxcRes, itemsRes] = await Promise.all([
        supabase
          .from('comprobantes')
          .select('*, comprobante_items(id)')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'venta')
          .order('fecha', { ascending: false })
          .order('numero_interno', { ascending: false }),
        supabase.from('vista_cuentas_por_cobrar').select('*').eq('empresa_id', empresaId),
        supabase
          .from('comprobante_items')
          .select('cantidad, precio_unitario, producto_id, productos(nombre), comprobantes!inner(fecha, tipo, empresa_id)')
          .eq('comprobantes.empresa_id', empresaId)
          .eq('comprobantes.tipo', 'venta')
          .gte('comprobantes.fecha', inicioMes),
      ])

      if (ventasRes.error) setError(ventasRes.error.message)
      setVentas(ventasRes.data || [])
      setPorCobrar((cxcRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005))

      // Producto más vendido del mes, por unidades
      const porProducto = new Map()
      ;(itemsRes.data || []).forEach((it) => {
        const prev = porProducto.get(it.producto_id) || { nombre: it.productos?.nombre || '—', unidades: 0, monto: 0 }
        prev.unidades += Number(it.cantidad)
        prev.monto += Number(it.cantidad) * Number(it.precio_unitario)
        porProducto.set(it.producto_id, prev)
      })
      setTopProductos([...porProducto.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5))

      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const hoyStr = new Date().toISOString().slice(0, 10)
  const inicioMesStr = (() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().slice(0, 10)
  })()

  const ventasHoy = ventas.filter((v) => v.fecha === hoyStr)
  const ventasMes = ventas.filter((v) => v.fecha >= inicioMesStr)
  const totalHoy = ventasHoy.reduce((s, v) => s + Number(v.monto_total), 0)
  const totalMes = ventasMes.reduce((s, v) => s + Number(v.monto_total), 0)
  const totalPorCobrar = porCobrar.reduce((s, c) => s + Number(c.saldo_pendiente), 0)
  const ticketPromedio = ventasMes.length > 0 ? totalMes / ventasMes.length : 0

  const hallazgos = []
  if (ventasHoy.length > 0) {
    hallazgos.push({
      color: '#22C55E',
      texto: (
        <>
          Hoy llevas <strong>{fmt(totalHoy)}</strong> en {ventasHoy.length}{' '}
          {ventasHoy.length === 1 ? 'venta' : 'ventas'}.
        </>
      ),
    })
  }
  if (topProductos.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Lo que más sale este mes: <strong>{topProductos[0].nombre}</strong> ({topProductos[0].unidades.toFixed(0)}{' '}
          unidades).
        </>
      ),
    })
  }
  if (porCobrar.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          Te deben <strong>{fmt(totalPorCobrar)}</strong> en {porCobrar.length}{' '}
          {porCobrar.length === 1 ? 'venta fiada' : 'ventas fiadas'}.
        </>
      ),
    })
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 1000, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: 1000,
        fontFamily: 'sans-serif',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
      }}
    >
      <PanelModulo
        titulo="Ventas"
        pregunta="¿Cómo vendiste hoy?"
        pose={ventasHoy.length > 0 ? 'celebrando' : 'hola'}
        hallazgos={hallazgos}
        mensajeVacio="Todavía no has vendido hoy. ¡A empezar!"
        acciones={
          <>
            <Link to={`/empresas/${empresaId}/inventario/venta`}>
              <button className="btn-hero">+ Nueva venta</button>
            </Link>
            <Link to={`/empresas/${empresaId}/ventas/nueva-simple`}>
              <button type="button">Venta sin inventario</button>
            </Link>
            {porCobrar.length > 0 && (
              <Link to={`/empresas/${empresaId}/cuentas-por-cobrar`}>
                <button type="button">Cobrar fiados</button>
              </Link>
            )}
          </>
        }
      />

      <div className="stat-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card">
          <p className="stat-label">Vendido hoy</p>
          <p className="stat-value">{fmt(totalHoy)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Vendido este mes</p>
          <p className="stat-value">{fmt(totalMes)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ventas del mes</p>
          <p className="stat-value">{ventasMes.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Venta promedio</p>
          <p className="stat-value">{fmt(ticketPromedio)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Por cobrar</p>
          <p className="stat-value" style={{ color: totalPorCobrar > 0 ? '#F59E0B' : undefined }}>
            {fmt(totalPorCobrar)}
          </p>
        </div>
      </div>

      {topProductos.length > 0 && (
        <div className="panel-cards" style={{ marginTop: '1.5rem' }}>
          <section className="panel-card">
            <h3>Lo más vendido este mes</h3>
            <ul className="panel-lista">
              {topProductos.map((p, i) => (
                <li key={i}>
                  <span>{p.nombre}</span>
                  <span style={{ color: '#64748B' }}>
                    {p.unidades.toFixed(0)} u · {fmt(p.monto)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-card">
            <h3>Quiénes te deben</h3>
            {porCobrar.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Nadie te debe nada. 🎉</p>
            ) : (
              <ul className="panel-lista">
                {porCobrar.slice(0, 5).map((c) => (
                  <li key={c.comprobante_id}>
                    <span>{c.cliente_proveedor || c.numero_interno}</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{fmt(c.saldo_pendiente)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Todas las ventas</h2>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {ventas.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no hay ventas registradas.</p>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E6ECF3', borderRadius: 16, padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>N°</th>
                <th style={{ padding: '4px 8px' }}>Fecha</th>
                <th style={{ padding: '4px 8px' }}>Cliente</th>
                <th style={{ padding: '4px 8px' }}>Tipo</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>{v.numero_interno}</td>
                  <td style={{ padding: '4px 8px' }}>{v.fecha}</td>
                  <td style={{ padding: '4px 8px' }}>{v.cliente_proveedor || '—'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {v.comprobante_items?.length > 0 ? 'Productos' : 'Simple'}
                    {v.es_credito && ' · Fiado'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(v.monto_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
