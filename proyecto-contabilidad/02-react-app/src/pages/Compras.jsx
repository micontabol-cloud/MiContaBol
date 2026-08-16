import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Compras() {
  const { id: empresaId } = useParams()
  const [compras, setCompras] = useState([])
  const [porPagar, setPorPagar] = useState([])
  const [stock, setStock] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const [comprasRes, cxpRes, stockRes] = await Promise.all([
        supabase
          .from('comprobantes')
          .select('*, comprobante_items(id)')
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'compra')
          .order('fecha', { ascending: false })
          .order('numero_interno', { ascending: false }),
        supabase.from('vista_cuentas_por_pagar').select('*').eq('empresa_id', empresaId),
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true),
      ])

      if (comprasRes.error) setError(comprasRes.error.message)
      setCompras(comprasRes.data || [])
      setPorPagar((cxpRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005))
      setStock(stockRes.data || [])
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const inicioMesStr = (() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().slice(0, 10)
  })()

  const comprasMes = compras.filter((c) => c.fecha >= inicioMesStr)
  const totalMes = comprasMes.reduce((s, c) => s + Number(c.monto_total), 0)
  const totalPorPagar = porPagar.reduce((s, c) => s + Number(c.saldo_pendiente), 0)

  const agotados = stock.filter((s) => Number(s.stock_actual) <= 0)
  const porAcabarse = stock.filter(
    (s) => Number(s.stock_actual) > 0 && Number(s.stock_minimo) > 0 && Number(s.stock_actual) <= Number(s.stock_minimo)
  )
  const reponer = [...agotados, ...porAcabarse]

  const hallazgos = []
  if (agotados.length > 0) {
    hallazgos.push({
      color: '#EF4444',
      texto: (
        <>
          <strong>{agotados.length}</strong> {agotados.length === 1 ? 'producto agotado' : 'productos agotados'} — cada
          día sin reponer es una venta que pierdes.
        </>
      ),
    })
  }
  if (porAcabarse.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          <strong>{porAcabarse.length}</strong> {porAcabarse.length === 1 ? 'está' : 'están'} por acabarse.
        </>
      ),
    })
  }
  if (porPagar.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Le debes <strong>{fmt(totalPorPagar)}</strong> a tus proveedores.
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
        titulo="Compras"
        pregunta="¿Qué necesitas comprar?"
        pose={agotados.length > 0 ? 'alerta' : 'exito'}
        hallazgos={hallazgos}
        mensajeVacio="No necesitas reponer nada por ahora."
        acciones={
          <>
            <Link to={`/empresas/${empresaId}/inventario/compra`}>
              <button className="btn-hero">+ Comprar mercadería</button>
            </Link>
            <Link to={`/empresas/${empresaId}/compras/nueva-simple`}>
              <button type="button">Registrar un gasto</button>
            </Link>
            {porPagar.length > 0 && (
              <Link to={`/empresas/${empresaId}/cuentas-por-pagar`}>
                <button type="button">Pagar a proveedores</button>
              </Link>
            )}
          </>
        }
      />

      <div className="stat-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card">
          <p className="stat-label">Comprado este mes</p>
          <p className="stat-value">{fmt(totalMes)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Compras del mes</p>
          <p className="stat-value">{comprasMes.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Por reponer</p>
          <p className="stat-value" style={{ color: reponer.length > 0 ? '#F59E0B' : undefined }}>
            {reponer.length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Le debes a proveedores</p>
          <p className="stat-value" style={{ color: totalPorPagar > 0 ? '#EF4444' : undefined }}>
            {fmt(totalPorPagar)}
          </p>
        </div>
      </div>

      <div className="panel-cards" style={{ marginTop: '1.5rem' }}>
        <section className="panel-card">
          <h3>Lista de reposición</h3>
          {reponer.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Tu stock está bien por ahora.</p>
          ) : (
            <>
              <ul className="panel-lista">
                {reponer.slice(0, 6).map((s) => (
                  <li key={`${s.producto_id}-${s.variante_id || ''}`}>
                    <span>{s.nombre_completo}</span>
                    <span
                      style={{
                        color: Number(s.stock_actual) <= 0 ? '#EF4444' : '#F59E0B',
                        fontWeight: 600,
                      }}
                    >
                      {Number(s.stock_actual) <= 0 ? 'Agotado' : `Quedan ${Number(s.stock_actual).toFixed(0)}`}
                    </span>
                  </li>
                ))}
              </ul>
              {reponer.length > 6 && (
                <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                  y {reponer.length - 6} más...
                </p>
              )}
            </>
          )}
        </section>

        <section className="panel-card">
          <h3>A quiénes les debes</h3>
          {porPagar.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>No le debes nada a nadie. 🎉</p>
          ) : (
            <ul className="panel-lista">
              {porPagar.slice(0, 5).map((c) => (
                <li key={c.comprobante_id}>
                  <span>{c.cliente_proveedor || c.numero_interno}</span>
                  <span style={{ color: '#EF4444', fontWeight: 600 }}>{fmt(c.saldo_pendiente)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Todas las compras</h2>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {compras.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no hay compras registradas.</p>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E6ECF3', borderRadius: 16, padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>N°</th>
                <th style={{ padding: '4px 8px' }}>Fecha</th>
                <th style={{ padding: '4px 8px' }}>Proveedor</th>
                <th style={{ padding: '4px 8px' }}>Tipo</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>{c.numero_interno}</td>
                  <td style={{ padding: '4px 8px' }}>{c.fecha}</td>
                  <td style={{ padding: '4px 8px' }}>{c.cliente_proveedor || '—'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {c.comprobante_items?.length > 0 ? 'Mercadería' : 'Gasto'}
                    {c.es_credito && ' · Fiado'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(c.monto_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
