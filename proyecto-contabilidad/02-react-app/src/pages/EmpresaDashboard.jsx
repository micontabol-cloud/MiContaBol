import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'
import { saludoDeBoli } from '../lib/saludos'
import OnboardingChecklist from '../components/OnboardingChecklist'
import { cargarInicio, conteosInicio } from '../lib/inicioPaquete'
import AvisoSuscripcion from '../components/AvisoSuscripcion'

const GraficoVentas = lazy(() => import('../components/GraficoVentas'))

// Lo último que vio cada negocio en Inicio. Al volver se muestra al instante y se actualiza detrás.
const CACHE_INICIO = new Map()
supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') CACHE_INICIO.clear()
})

export default function EmpresaDashboard() {
  const { id: empresaId } = useParams()
  const inicial = CACHE_INICIO.get(empresaId)
  const [empresa, setEmpresa] = useState(inicial?.empresa ?? null)
  const [cargando, setCargando] = useState(!inicial)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState(inicial?.kpis ?? { ventasMes: 0, utilidadMes: 0, productos: 0, clientes: 0, caja: 0 })
  const [cambioPorcentual, setCambioPorcentual] = useState(inicial?.cambioPorcentual ?? null)
  const [ultimasVentas, setUltimasVentas] = useState(inicial?.ultimasVentas ?? [])
  const [stockBajo, setStockBajo] = useState(inicial?.stockBajo ?? [])
  const [datosGrafico, setDatosGrafico] = useState(inicial?.datosGrafico ?? [])
  const [porVencer, setPorVencer] = useState(inicial?.porVencer ?? [])
  const [ventasHoy, setVentasHoy] = useState(inicial?.ventasHoy ?? { cantidad: 0, monto: 0 })
  const [totalVentasHistorico, setTotalVentasHistorico] = useState(inicial?.totalVentasHistorico ?? 0)
  const [onboardingOculto, setOnboardingOculto] = useState(inicial?.onboardingOculto ?? false)
  const [perfil, setPerfil] = useState(inicial?.perfil ?? null)
  const [suscripcion, setSuscripcion] = useState(inicial?.suscripcion ?? null)

  useEffect(() => {
    async function cargar() {
      if (!CACHE_INICIO.has(empresaId)) setCargando(true)
      setError(null)

      // perfil y plan salen a la vez que lo demás
      supabase.rpc('mi_perfil').then(({ data }) => setPerfil(data))
      supabase.rpc('mi_suscripcion').then(({ data }) => setSuscripcion(data))

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
        lotesRes,
        ventasHoyRes,
        totalVentasRes,
      ] = await cargarInicio(empresaId, { inicioMes, seisMesesAtras, hoy: hoy.toISOString().slice(0, 10) }, () => Promise.all([
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
          .eq('activo', true)
          .is('eliminado_at', null),
        supabase
          .from('comprobantes')
          .select('cliente_proveedor')
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta')
          .not('cliente_proveedor', 'is', null),
        supabase.from('vista_balance_comprobacion').select('nombre, saldo').eq('empresa_id', empresaId),
        supabase
          .from('comprobantes')
          .select('*')
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta')
          .order('fecha', { ascending: false })
          .order('numero_interno', { ascending: false })
          .limit(5),
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true).gt('stock_minimo', 0),
        supabase
          .from('comprobantes')
          .select('fecha, monto_total')
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta')
          .gte('fecha', seisMesesAtras),
        supabase
          .from('vista_lotes')
          .select('*')
          .eq('empresa_id', empresaId)
          .not('fecha_vencimiento', 'is', null)
          .order('fecha_vencimiento', { ascending: true })
          .limit(8),
        supabase
          .from('comprobantes')
          .select('monto_total')
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta')
          .eq('fecha', hoy.toISOString().slice(0, 10)),
        supabase
          .from('comprobantes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta'),
      ]))

      if (empRes.error) {
        setError(empRes.error.message)
        setCargando(false)
        return
      }

      setEmpresa(empRes.data)
      setOnboardingOculto(!!empRes.data?.onboarding_oculto)


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
      setVentasHoy({
        cantidad: (ventasHoyRes.data || []).length,
        monto: (ventasHoyRes.data || []).reduce((s, v) => s + Number(v.monto_total), 0),
      })
      setTotalVentasHistorico(totalVentasRes.count || 0)
      // Solo alertamos de lo que vence dentro de 60 días (o ya venció)
      setPorVencer((lotesRes.data || []).filter((l) => l.dias_para_vencer !== null && l.dias_para_vencer <= 60))
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

  // Guarda lo que se ve para la próxima vez que se abra Inicio
  useEffect(() => {
    if (cargando || error) return
    CACHE_INICIO.set(empresaId, {
      empresa, kpis, cambioPorcentual, ultimasVentas, stockBajo, datosGrafico, porVencer,
      ventasHoy, totalVentasHistorico, onboardingOculto, perfil, suscripcion,
    })
  }, [cargando, error, empresaId, empresa, kpis, cambioPorcentual, ultimasVentas, stockBajo, datosGrafico, porVencer, ventasHoy, totalVentasHistorico, onboardingOculto, perfil, suscripcion])

  const saludo = saludoDeBoli({
    nombre: perfil?.nombre,
    fechaNacimiento: perfil?.fecha_nacimiento,
    ventasHoy: ventasHoy.cantidad,
    montoHoy: ventasHoy.monto,
    totalVentasHistorico,
    hayStockBajo: stockBajo.length > 0,
    hayAgotados: stockBajo.some((s) => Number(s.stock_actual) <= 0),
  })

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <BoliMascot pose={saludo.pose} size={72} />
        <div>
          <h1 style={{ margin: 0 }}>{empresa?.nombre || 'Tu negocio'}</h1>
          <p style={{ color: '#64748B', margin: '0.2rem 0 0', fontSize: '1rem' }}>{saludo.mensaje}</p>
        </div>
      </div>

      <div className="barra-hoy" style={{ marginTop: '1.25rem' }}>
        <span style={{ fontWeight: 700, color: '#1F3A5F' }}>Hoy</span>
        <div className="barra-hoy-sep" />
        <span className="barra-hoy-item">
          <span>Ventas</span>
          <strong>{ventasHoy.cantidad}</strong>
        </span>
        <div className="barra-hoy-sep" />
        <span className="barra-hoy-item">
          <span>Ingresado</span>
          <strong>Bs {ventasHoy.monto.toFixed(2)}</strong>
        </span>
        <div className="barra-hoy-sep" />
        <span className="barra-hoy-item">
          <span>Caja</span>
          <strong>Bs {kpis.caja.toFixed(2)}</strong>
        </span>
        <div className="barra-hoy-sep" />
        <span className="barra-hoy-item">
          <span>Productos</span>
          <strong>{kpis.productos}</strong>
        </span>
      </div>

      <AvisoSuscripcion suscripcion={suscripcion} />

      {!onboardingOculto && (
        <OnboardingChecklist empresa={empresa} conteos={conteosInicio.get(empresaId)} onOcultar={() => setOnboardingOculto(true)} />
      )}

      <div style={{ display: 'flex', gap: '0.6rem', margin: '1.25rem 0 1.75rem', flexWrap: 'wrap' }}>
        <Link to={`/empresas/${empresaId}/ventas/nueva-simple`}>
          <button className="btn-hero">+ Venta</button>
        </Link>
        <Link to={`/empresas/${empresaId}/compras/nueva-simple`}>
          <button type="button">+ Compra</button>
        </Link>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>
          <button type="button">+ Producto</button>
        </Link>
      </div>

      {error && <p style={{ color: '#DC2626' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card destacada-ventas">
              <p className="stat-label">Ventas del mes</p>
              <p className="stat-value">Bs {kpis.ventasMes.toFixed(2)}</p>
              {cambioPorcentual !== null && (
                <p className={cambioPorcentual >= 0 ? 'stat-delta-up' : 'stat-delta-down'}>
                  {cambioPorcentual >= 0 ? '▲' : '▼'} {Math.abs(cambioPorcentual).toFixed(0)}% vs. mes anterior
                </p>
              )}
            </div>
            <div className="stat-card destacada-utilidad">
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
              <Suspense fallback={<div style={{ height: 220 }} />}>
                <GraficoVentas data={datosGrafico} />
              </Suspense>
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
                      key={`${p.producto_id}-${p.variante_id || ''}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #E6ECF3',
                      }}
                    >
                      <span>{p.nombre_completo}</span>
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>
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

          {empresa?.usa_vencimiento && porVencer.length > 0 && (
            <section style={{ marginTop: '2rem' }}>
              <h2>Por vencer</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {porVencer.map((l) => {
                  const dias = l.dias_para_vencer
                  const color = dias < 0 ? '#EF4444' : dias <= 15 ? '#EF4444' : '#F59E0B'
                  return (
                    <li
                      key={l.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #E6ECF3',
                      }}
                    >
                      <span>
                        {l.producto_nombre}
                        {l.variante_nombre ? ` — ${l.variante_nombre}` : ''}
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>
                          {' '}
                          · {Number(l.stock_actual).toFixed(0)} {l.unidad_medida}
                        </span>
                      </span>
                      <span style={{ color, fontWeight: 600 }}>
                        {dias < 0 ? `Vencido hace ${Math.abs(dias)} d` : `${dias} días`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}
