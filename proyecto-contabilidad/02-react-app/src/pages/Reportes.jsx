import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Reportes() {
  const { id: empresaId } = useParams()
  const [meses, setMeses] = useState([])
  const [topProductos, setTopProductos] = useState([])
  const [campanas, setCampanas] = useState([])
  const [inventario, setInventario] = useState({ costo: 0, venta: 0 })
  const [anulaciones, setAnulaciones] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const hoy = new Date()
      const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1).toISOString().slice(0, 10)

      const [cuentasRes, movRes, actRes] = await Promise.all([
        supabase.from('plan_cuentas').select('id, tipo').eq('empresa_id', empresaId),
        supabase.from('vista_libro_mayor').select('cuenta_id, debe, haber, fecha').eq('empresa_id', empresaId).gte('fecha', desde),
        supabase.from('vista_producto_actividad').select('*').eq('empresa_id', empresaId),
      ])

      supabase.rpc('resumen_campanas', { p_empresa_id: empresaId }).then(({ data }) => setCampanas(data || []))

      // Últimos 90 días: suficiente para ver un patrón sin ruido viejo
      const hace90 = new Date()
      hace90.setDate(hace90.getDate() - 90)
      supabase
        .rpc('reporte_anulaciones', {
          p_empresa_id: empresaId,
          p_desde: hace90.toISOString().slice(0, 10),
          p_hasta: new Date().toISOString().slice(0, 10),
        })
        .then(({ data }) => setAnulaciones(data))

      supabase
        .from('vista_stock')
        .select('stock_actual, costo_fijo, precio_venta')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .then(({ data }) => {
          const filas = data || []
          setInventario({
            costo: filas.reduce((t, f) => t + Number(f.stock_actual) * Number(f.costo_fijo), 0),
            venta: filas.reduce((t, f) => t + Number(f.stock_actual) * Number(f.precio_venta), 0),
          })
        })

      if (movRes.error) setError(movRes.error.message)

      const tipoPorCuenta = new Map((cuentasRes.data || []).map((c) => [c.id, c.tipo]))

      // Ingresos y gastos mes a mes, para ver la tendencia real del
      // negocio en vez de un solo número suelto.
      const porMes = {}
      ;(movRes.data || []).forEach((m) => {
        const clave = m.fecha.slice(0, 7)
        if (!porMes[clave]) porMes[clave] = { ingresos: 0, gastos: 0 }
        const tipo = tipoPorCuenta.get(m.cuenta_id)
        if (tipo === 'ingreso') porMes[clave].ingresos += Number(m.haber) - Number(m.debe)
        if (tipo === 'gasto') porMes[clave].gastos += Number(m.debe) - Number(m.haber)
      })

      const lista = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const clave = d.toISOString().slice(0, 7)
        const datos = porMes[clave] || { ingresos: 0, gastos: 0 }
        lista.push({
          mes: d.toLocaleDateString('es-BO', { month: 'short' }),
          ingresos: Number(datos.ingresos.toFixed(2)),
          gastos: Number(datos.gastos.toFixed(2)),
          utilidad: Number((datos.ingresos - datos.gastos).toFixed(2)),
        })
      }
      setMeses(lista)

      setTopProductos(
        (actRes.data || [])
          .filter((a) => Number(a.utilidad_generada) > 0)
          .sort((a, b) => Number(b.utilidad_generada) - Number(a.utilidad_generada))
          .slice(0, 5)
      )

      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const mesActual = meses[meses.length - 1]
  const mesAnterior = meses[meses.length - 2]

  const variacion =
    mesAnterior && mesAnterior.ingresos > 0
      ? ((mesActual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100
      : null

  const margen = mesActual && mesActual.ingresos > 0 ? (mesActual.utilidad / mesActual.ingresos) * 100 : null

  const mesesConVentas = meses.filter((m) => m.ingresos > 0)
  const promedioIngresos =
    mesesConVentas.length > 0 ? mesesConVentas.reduce((s, m) => s + m.ingresos, 0) / mesesConVentas.length : 0

  const hallazgos = []
  if (variacion !== null) {
    hallazgos.push({
      color: variacion >= 0 ? '#22C55E' : '#EF4444',
      texto: (
        <>
          Este mes vendiste <strong>{Math.abs(variacion).toFixed(0)}% {variacion >= 0 ? 'más' : 'menos'}</strong> que
          el mes pasado.
        </>
      ),
    })
  }
  if (margen !== null) {
    hallazgos.push({
      color: margen >= 20 ? '#22C55E' : margen >= 10 ? '#F59E0B' : '#EF4444',
      texto: (
        <>
          De cada Bs 100 que vendes, te quedan <strong>Bs {margen.toFixed(0)}</strong> de ganancia.
        </>
      ),
    })
  }
  if (mesActual && mesActual.utilidad < 0) {
    hallazgos.push({
      color: '#EF4444',
      texto: 'Este mes gastaste más de lo que vendiste. Revisa tus gastos.',
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
        titulo="Reportes"
        pregunta="¿Cómo va creciendo tu negocio?"
        pose={variacion !== null && variacion >= 0 ? 'exito' : 'consejo'}
        hallazgos={hallazgos}
        mensajeVacio="Cuando registres ventas, aquí verás cómo evoluciona tu negocio mes a mes."
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      <div className="stat-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card destacada-ventas">
          <p className="stat-label">Vendido este mes</p>
          <p className="stat-value">{fmt(mesActual?.ingresos)}</p>
          {variacion !== null && (
            <p className={variacion >= 0 ? 'stat-delta-up' : 'stat-delta-down'}>
              {variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion).toFixed(0)}% vs. mes anterior
            </p>
          )}
        </div>
        <div className="stat-card destacada-utilidad">
          <p className="stat-label">Ganancia este mes</p>
          <p className="stat-value" style={{ color: (mesActual?.utilidad || 0) >= 0 ? '#22C55E' : '#EF4444' }}>
            {fmt(mesActual?.utilidad)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Gastos del mes</p>
          <p className="stat-value">{fmt(mesActual?.gastos)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Promedio mensual</p>
          <p className="stat-value">{fmt(promedioIngresos)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Plata en inventario</p>
          <p className="stat-value">{fmt(inventario.costo)}</p>
          {inventario.venta > 0 && (
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#22C55E', fontWeight: 600 }}>
              Vale {fmt(inventario.venta)} vendido
            </p>
          )}
        </div>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2>Cómo vienes mes a mes</h2>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6ECF3',
            borderRadius: 16,
            padding: '1.25rem 1rem 0.5rem',
            height: 300,
          }}
        >
          <ResponsiveContainer>
            <LineChart data={meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF3" />
              <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Line type="monotone" dataKey="ingresos" name="Ventas" stroke="#F2555A" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="utilidad" name="Ganancia" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="panel-cards" style={{ marginTop: '1.5rem' }}>
        <section className="panel-card">
          <h3>Los que más ganancia te dejan</h3>
          {topProductos.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              Cuando vendas productos, aquí verás cuáles te dejan más.
            </p>
          ) : (
            <ul className="panel-lista">
              {topProductos.map((p) => (
                <li key={p.producto_id}>
                  <span>{p.unidades_vendidas} u vendidas</span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{fmt(p.utilidad_generada)}</span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <Link to={`/empresas/${empresaId}/inventario`}>Ver inventario &rarr;</Link>
          </p>
        </section>

        <section className="panel-card">
          <h3>Cómo van tus campañas</h3>
          {campanas.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: 0 }}>
              Cuando publiques un catálogo, aquí verás cuánta gente lo vio.{' '}
              <Link to={`/empresas/${empresaId}/catalogos`}>Crear uno</Link>
            </p>
          ) : (
            <>
              <ul className="panel-lista">
                {campanas.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <span>
                      {c.nombre}
                      {!c.publicado && <span style={{ color: '#A3AFBF', fontSize: '0.8rem' }}> · borrador</span>}
                    </span>
                    <span style={{ color: c.visitas > 0 ? '#1F3A5F' : '#A3AFBF', fontWeight: c.visitas > 0 ? 600 : 400 }}>
                      {c.visitas} {c.visitas === 1 ? 'visita' : 'visitas'}
                      {c.consultas > 0 && (
                        <span style={{ color: '#22C55E' }}> · {c.consultas} consultas</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                "Consultas" son las veces que alguien tocó un producto para escribirte.
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <Link to={`/empresas/${empresaId}/catalogos`}>Ver catálogos &rarr;</Link>
              </p>
            </>
          )}
        </section>

        {anulaciones?.cantidad > 0 && (
          <section className="panel-card">
            <h3>Ventas anuladas (últimos 90 días)</h3>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
              <div>
                <p className="stat-label">Anuladas</p>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1F3A5F' }}>
                  {anulaciones.cantidad}
                </p>
              </div>
              <div>
                <p className="stat-label">Monto</p>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1F3A5F' }}>
                  {fmt(anulaciones.monto)}
                </p>
              </div>
              <div>
                <p className="stat-label">Del total de ventas</p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: anulaciones.porcentaje > 10 ? '#EF4444' : '#1F3A5F',
                  }}
                >
                  {anulaciones.porcentaje}%
                </p>
              </div>
            </div>

            {anulaciones.porcentaje > 10 && (
              <p
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 10,
                  padding: '0.7rem 0.85rem',
                  fontSize: '0.88rem',
                  color: '#8a5a00',
                  margin: '0 0 0.9rem',
                  lineHeight: 1.5,
                }}
              >
                Más de una de cada diez ventas se anuló. Vale la pena revisar los motivos: puede ser falta de
                práctica con el sistema, o algo que conviene mirar de cerca.
              </p>
            )}

            {anulaciones.por_persona.length > 1 && (
              <>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}>
                  Quién anuló
                </p>
                <ul className="panel-lista" style={{ marginBottom: '0.9rem' }}>
                  {anulaciones.por_persona.map((p, i) => (
                    <li key={i}>
                      <span>{p.persona}</span>
                      <span>
                        {p.cantidad} {p.cantidad === 1 ? 'venta' : 'ventas'} · {fmt(p.monto)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}>
              Últimas anulaciones
            </p>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  {anulaciones.detalle.slice(0, 15).map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F7F9FC' }}>
                      <td style={{ padding: '5px 4px', whiteSpace: 'nowrap' }}>{a.numero}</td>
                      <td style={{ padding: '5px 4px' }}>
                        {a.motivo}
                        <span style={{ display: 'block', color: '#A3AFBF', fontSize: '0.78rem' }}>
                          {a.anulado_por} ·{' '}
                          {a.dias_despues === 0
                            ? 'el mismo día'
                            : `${a.dias_despues} ${a.dias_despues === 1 ? 'día' : 'días'} después`}
                        </span>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fmt(a.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="panel-card">
          <h3>Reportes contables</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: 0 }}>
            Los formales, por si tu contador te los pide.
          </p>
          <ul className="panel-lista">
            <li>
              <Link to={`/empresas/${empresaId}/estados-financieros`}>Estados financieros</Link>
            </li>
            <li>
              <Link to={`/empresas/${empresaId}/balance-comprobacion`}>Balance de comprobación</Link>
            </li>
            <li>
              <Link to={`/empresas/${empresaId}/libro-mayor`}>Libro mayor</Link>
            </li>
            <li>
              <Link to={`/empresas/${empresaId}/asientos`}>Asientos contables</Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
