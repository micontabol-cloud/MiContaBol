import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`
const hoy = () => new Date()

function diasDesde(fecha) {
  if (!fecha) return null
  return Math.floor((hoy() - new Date(fecha)) / (1000 * 60 * 60 * 24))
}

function Metrica({ etiqueta, valor, color }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{etiqueta}</p>
      <p className="stat-value" style={color ? { color } : undefined}>
        {valor}
      </p>
    </div>
  )
}

export default function Inventario() {
  const { id: empresaId } = useParams()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [stock, setStock] = useState([])
  const [actividad, setActividad] = useState(new Map())
  const [numCategorias, setNumCategorias] = useState(0)
  const [recientes, setRecientes] = useState([])

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const [stockRes, actRes, catRes, recRes] = await Promise.all([
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true),
        supabase.from('vista_producto_actividad').select('*').eq('empresa_id', empresaId),
        supabase
          .from('categorias_producto')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .eq('activo', true),
        supabase
          .from('productos')
          .select('id, nombre, codigo, created_at')
          .eq('empresa_id', empresaId)
          .is('eliminado_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      if (stockRes.error) setError(stockRes.error.message)

      setStock(stockRes.data || [])
      setActividad(new Map((actRes.data || []).map((a) => [a.producto_id, a])))
      setNumCategorias(catRes.count || 0)
      setRecientes(recRes.data || [])
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  // Una fila de vista_stock es una "cosa vendible": el producto, o
  // cada variante si las tiene.
  const sinStock = stock.filter((s) => Number(s.stock_actual) <= 0)
  const pocoStock = stock.filter(
    (s) => Number(s.stock_actual) > 0 && Number(s.stock_minimo) > 0 && Number(s.stock_actual) <= Number(s.stock_minimo)
  )
  // Tres números que responden preguntas distintas:
  //   costo   → cuánta plata tengo inmovilizada
  //   venta   → cuánto entraría si vendo todo
  //   ganancia→ cuánto de eso es utilidad
  const valorInventario = stock.reduce((sum, s) => sum + Number(s.stock_actual) * Number(s.costo_fijo), 0)
  const valorVenta = stock.reduce((sum, s) => sum + Number(s.stock_actual) * Number(s.precio_venta), 0)
  const gananciaPotencial = valorVenta - valorInventario
  const margenPromedio = valorVenta > 0 ? (gananciaPotencial / valorVenta) * 100 : 0
  const productosUnicos = new Set(stock.map((s) => s.producto_id))

  const nuncaVendidos = [...productosUnicos].filter((pid) => {
    const a = actividad.get(pid)
    return !a || Number(a.unidades_vendidas) === 0
  })

  const sinMovimiento = [...productosUnicos]
    .map((pid) => {
      const a = actividad.get(pid)
      const fila = stock.find((s) => s.producto_id === pid)
      return { pid, nombre: fila?.producto_nombre, dias: diasDesde(a?.ultima_venta), vendidas: Number(a?.unidades_vendidas || 0) }
    })
    .filter((p) => p.vendidas > 0 && p.dias !== null && p.dias >= 60)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5)

  const masRentables = [...actividad.values()]
    .filter((a) => Number(a.utilidad_generada) > 0)
    .sort((a, b) => Number(b.utilidad_generada) - Number(a.utilidad_generada))
    .slice(0, 5)
    .map((a) => ({
      ...a,
      nombre: stock.find((s) => s.producto_id === a.producto_id)?.producto_nombre || '—',
    }))

  const hayAlgoQueRevisar = pocoStock.length > 0 || sinStock.length > 0 || nuncaVendidos.length > 0

  if (cargando) {
    return (
      <main style={{ maxWidth: 1000, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  // Sin productos todavía: mejor una invitación que una tabla vacía.
  if (stock.length === 0) {
    return (
      <main style={{ maxWidth: 620, fontFamily: 'sans-serif', textAlign: 'center' }}>
        <BoliMascot pose="hola" size={140} style={{ margin: '0 auto 1rem' }} />
        <h1>Todavía no tienes productos</h1>
        <p style={{ color: '#64748B' }}>Registra el primero y empieza a vender. Toma menos de un minuto.</p>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>
          <button className="btn-hero btn-lg" style={{ marginTop: '1rem' }}>
            Crear mi primer producto
          </button>
        </Link>
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
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <BoliMascot pose={hayAlgoQueRevisar ? 'alerta' : 'exito'} size={78} />
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ margin: 0 }}>Inventario</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>¿Qué necesita tu atención hoy?</p>

          {hayAlgoQueRevisar ? (
            <ul className="lista-check" style={{ marginTop: '0.9rem' }}>
              {pocoStock.length > 0 && (
                <li>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>●</span>
                  <span>
                    <strong>{pocoStock.length}</strong> {pocoStock.length === 1 ? 'producto está' : 'productos están'}{' '}
                    por acabarse.
                  </span>
                </li>
              )}
              {sinStock.length > 0 && (
                <li>
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>●</span>
                  <span>
                    <strong>{sinStock.length}</strong> {sinStock.length === 1 ? 'está agotado' : 'están agotados'} — no
                    puedes venderlos.
                  </span>
                </li>
              )}
              {nuncaVendidos.length > 0 && (
                <li>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>●</span>
                  <span>
                    <strong>{nuncaVendidos.length}</strong>{' '}
                    {nuncaVendidos.length === 1 ? 'nunca se ha vendido' : 'nunca se han vendido'}.
                  </span>
                </li>
              )}
            </ul>
          ) : (
            <p style={{ marginTop: '0.9rem', color: '#22C55E', fontWeight: 600 }}>
              Todo en orden — nada por acabarse ni agotado.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
            <Link to={`/empresas/${empresaId}/inventario/productos`}>
              <button className="btn-hero">Ver productos</button>
            </Link>
            <Link to={`/empresas/${empresaId}/compras`}>
              <button type="button">Comprar mercadería</button>
            </Link>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: '2rem' }}>
        <Metrica etiqueta="Productos" valor={productosUnicos.size} />
        <Metrica etiqueta="Por acabarse" valor={pocoStock.length} color={pocoStock.length > 0 ? '#F59E0B' : undefined} />
        <Metrica etiqueta="Agotados" valor={sinStock.length} color={sinStock.length > 0 ? '#EF4444' : undefined} />
        <Metrica etiqueta="Categorías" valor={numCategorias} />
      </div>

      {/* Cuánta plata hay en el estante */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: '1.25rem 1.4rem',
          marginTop: '1rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Cuánta plata tienes en el estante</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <div>
            <p className="stat-label">Te costó</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '1.55rem', fontWeight: 800, color: '#1F3A5F' }}>
              {fmt(valorInventario)}
            </p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#A3AFBF' }}>
              Lo que pagaste por lo que tienes
            </p>
          </div>

          <div>
            <p className="stat-label">Si vendes todo</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '1.55rem', fontWeight: 800, color: '#1F3A5F' }}>
              {fmt(valorVenta)}
            </p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#A3AFBF' }}>
              A tus precios de venta actuales
            </p>
          </div>

          <div
            style={{
              background: 'rgba(34, 197, 94, 0.07)',
              border: '1px solid rgba(34, 197, 94, 0.28)',
              borderRadius: 12,
              padding: '0.7rem 0.9rem',
              margin: '-0.7rem -0.4rem',
            }}
          >
            <p className="stat-label">Ganarías</p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '1.55rem', fontWeight: 800, color: '#22C55E' }}>
              {fmt(gananciaPotencial)}
            </p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              Margen promedio de {margenPromedio.toFixed(0)}%
            </p>
          </div>
        </div>

        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
          Los <strong>{fmt(valorInventario)}</strong> son plata tuya que está quieta en el estante: no la puedes usar
          hasta vender. Por eso conviene que rote, no que crezca.
        </p>
      </section>

      <div className="panel-cards" style={{ marginTop: '1.5rem' }}>
        <section className="panel-card">
          <h3>Próximamente sin stock</h3>
          {pocoStock.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Nada por acabarse.</p>
          ) : (
            <ul className="panel-lista">
              {pocoStock.slice(0, 5).map((s) => (
                <li key={`${s.producto_id}-${s.variante_id || ''}`}>
                  <span>{s.nombre_completo}</span>
                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                    {Number(s.stock_actual).toFixed(0)} {s.unidad_medida}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-card">
          <h3>Sin venderse hace tiempo</h3>
          {sinMovimiento.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              Todos tus productos han tenido movimiento reciente.
            </p>
          ) : (
            <ul className="panel-lista">
              {sinMovimiento.map((p) => (
                <li key={p.pid}>
                  <span>{p.nombre}</span>
                  <span style={{ color: '#64748B' }}>hace {p.dias} días</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-card">
          <h3>Los que más plata te dejan</h3>
          {masRentables.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              Cuando registres ventas, aquí verás cuáles te dejan más ganancia.
            </p>
          ) : (
            <ul className="panel-lista">
              {masRentables.map((a) => (
                <li key={a.producto_id}>
                  <span>{a.nombre}</span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{fmt(a.utilidad_generada)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-card">
          <h3>Agregados recientemente</h3>
          {recientes.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Sin productos nuevos.</p>
          ) : (
            <ul className="panel-lista">
              {recientes.map((p) => (
                <li key={p.id}>
                  <Link to={`/empresas/${empresaId}/inventario/productos/${p.id}`}>{p.nombre}</Link>
                  <span style={{ color: '#A3AFBF', fontSize: '0.82rem' }}>{p.codigo}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p style={{ marginTop: '1.5rem' }}>
        <Link to={`/empresas/${empresaId}/analisis-costo`}>Análisis: costo fijo vs. costo promedio &rarr;</Link>
      </p>
    </main>
  )
}
