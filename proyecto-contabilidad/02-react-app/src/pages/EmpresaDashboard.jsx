import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabaseClient'
import BoliIcon from '../components/BoliIcon'

export default function EmpresaDashboard() {
  const { id: empresaId } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState({ ventasMes: 0, utilidadMes: 0, productos: 0, clientes: 0, caja: 0 })
  const [cambioPorcentual, setCambioPorcentual] = useState(null)
  const [ultimasVentas, setUltimasVentas] = useState([])
  const [stockBajo, setStockBajo] = useState([])
  const [datosGrafico, setDatosGrafico] = useState([])

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)

      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
      const seisMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1).toISOString().slice(0, 10)

      const [
        empRes,
        cuentasRes,
        movMesRes,
        prodCountRes,
        ventasClientesRes,
        balanceRes,
        ultimasVRes,
        stockBajoRes,
        ventasHistoricasRes,
      ] = await Promise.all([
        supabase.from('empresas').select('*').eq('id', empresaId).single(),
        supabase.from('plan_cuentas').select('id, tipo').eq('empresa_id', empresaId),
        supabase
          .from('vista_libro_mayor')
          .select('cuenta_id, debe, haber')
          .eq('empresa_id', empresaId)
          .gte('fecha', inicioMes),
        supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .eq('activo', true),
        supabase
          .from('comprobantes')
          .select('cliente_proveedor')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'venta')
          .not('cliente_proveedor', 'is', null),
        supabase.from('vista_balance_comprobacion').select('nombre, saldo').eq('empresa_id', empresaId),
        supabase
          .from('comprobantes')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'venta')
          .order('fecha', { ascending: false })
          .order('numero_interno', { ascending: false })
          .limit(5),
        supabase.from('productos').select('*').eq('empresa_id', empresaId).eq('activo', true).gt('stock_minimo', 0),
        supabase
          .from('comprobantes')
          .select('fecha, monto_total')
          .eq('empresa_id', empresaId)
          .eq('tipo', 'venta')
          .gte('fecha', seisMesesAtras),
      ])

      if (empRes.error) {
        setError(empRes.error.message)
        setCargando(false)
        return
      }

      setEmpresa(empRes.data)

      const cuentaTipoPorId = new Map((cuentasRes.data || []).map((c) => [c.id, c.tipo]))
      let ingresosMes = 0
      let gastosMes = 0
      ;(movMesRes.data || []).forEach((m) => {
        const tipo = cuentaTipoPorId.get(m.cuenta_id)
        if (tipo === 'ingreso') ingresosMes += Number(m.haber) - Number(m.debe)
        if (tipo === 'gasto') gastosMes += Number(m.debe) - Number(m.haber)
      })

      const clientesUnicos = new Set(
        (ventasClientesRes.data || []).map((v) => (v.cliente_proveedor || '').trim().toLowerCase()).filter(Boolean)
      )

      const cajaBancos = (balanceRes.data || [])
        .filter((c) => /caja|banco/i.test(c.nombre))
        .reduce((sum, c) => sum + Number(c.saldo), 0)

      setKpis({
        ventasMes: ingresosMes,
        utilidadMes: ingresosMes - gastosMes,
        productos: prodCountRes.count || 0,
        clientes: clientesUnicos.size,
        caja: cajaBancos,
      })

      setUltimasVentas(ultimasVRes.data || [])
      setStockBajo((stockBajoRes.data || []).filter((p) => Number(p.stock_actual) <= Number(p.stock_minimo)))

      const porMes = {}
      ;(ventasHistoricasRes.data || []).forEach((v) => {
        const clave = v.fecha.slice(0, 7)
        porMes[clave] = (porMes[clave] || 0) + Number(v.monto_total)
      })

      const meses = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const clave = d.toISOString().slice(0, 7)
        meses.push({ mes: d.toLocaleDateString('es-BO', { month: 'short' }), ventas: porMes[clave] || 0 })
      }
      setDatosGrafico(meses)

      const mesActual = meses[meses.length - 1]?.ventas || 0
      const mesAnterior = meses[meses.length - 2]?.ventas || 0
      setCambioPorcentual(mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : null)

      setCargando(false)
    }
    cargar()
  }, [empresaId])

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BoliIcon size={40} />
        <div>
          <h1 style={{ margin: 0 }}>Hola 👋</h1>
          <p style={{ color: '#64748B', margin: 0 }}>
            Boli está listo para ayudarte — así va <strong>{empresa?.nombre || 'tu negocio'}</strong> hoy.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', margin: '1.25rem 0 1.75rem', flexWrap: 'wrap' }}>
        <Link to={`/empresas/${empresaId}/ventas/nueva-simple`}>
          <button>+ Venta</button>
        </Link>
        <Link to={`/empresas/${empresaId}/compras/nueva-simple`}>
          <button type="button">+ Compra</button>
        </Link>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>
          <button type="button">+ Producto</button>
        </Link>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <p className="stat-label">Ventas del mes</p>
              <p className="stat-value">Bs {kpis.ventasMes.toFixed(2)}</p>
              {cambioPorcentual !== null && (
                <p className={cambioPorcentual >= 0 ? 'stat-delta-up' : 'stat-delta-down'}>
                  {cambioPorcentual >= 0 ? '▲' : '▼'} {Math.abs(cambioPorcentual).toFixed(0)}% vs. mes anterior
                </p>
              )}
            </div>
            <div className="stat-card">
              <p className="stat-label">Utilidad del mes</p>
              <p className="stat-value">Bs {kpis.utilidadMes.toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Productos</p>
              <p className="stat-value">{kpis.productos}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Clientes</p>
              <p className="stat-value">{kpis.clientes}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Caja + Bancos</p>
              <p className="stat-value">Bs {kpis.caja.toFixed(2)}</p>
            </div>
          </div>

          <section style={{ marginTop: '2rem' }}>
            <h2>Ventas — últimos 6 meses</h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF3" />
                  <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip formatter={(value) => `Bs ${Number(value).toFixed(2)}`} />
                  <Bar dataKey="ventas" fill="#F2555A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="dashboard-two-col" style={{ marginTop: '2rem' }}>
            <section>
              <h2>Últimas ventas</h2>
              {ultimasVentas.length === 0 ? (
                <p style={{ color: '#64748B' }}>Todavía no hay ventas.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {ultimasVentas.map((v) => (
                    <li
                      key={v.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #E6ECF3',
                      }}
                    >
                      <span>{v.cliente_proveedor || v.numero_interno}</span>
                      <span style={{ fontWeight: 600 }}>Bs {Number(v.monto_total).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ marginTop: '0.75rem' }}>
                <Link to={`/empresas/${empresaId}/ventas`}>Ver todas &rarr;</Link>
              </p>
            </section>

            <section>
              <h2>Productos con poco stock</h2>
              {stockBajo.length === 0 ? (
                <p style={{ color: '#64748B' }}>Todo en orden — nada por debajo de su mínimo.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {stockBajo.map((p) => (
                    <li
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #E6ECF3',
                      }}
                    >
                      <span>{p.nombre}</span>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>
                        {Number(p.stock_actual).toFixed(0)} {p.unidad_medida}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ marginTop: '0.75rem' }}>
                <Link to={`/empresas/${empresaId}/inventario/productos`}>Ver productos &rarr;</Link>
              </p>
            </section>
          </div>
        </>
      )}
    </main>
  )
}
