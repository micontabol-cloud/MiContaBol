import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Ventas() {
  const { id: empresaId } = useParams()
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('comprobantes')
        .select('*, comprobante_items(id)')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'venta')
        .order('fecha', { ascending: false })
        .order('numero_interno', { ascending: false })

      if (error) setError(error.message)
      setVentas(data || [])
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.monto_total), 0)

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <h1>Ventas</h1>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <Link to={`/empresas/${empresaId}/ventas/nueva-simple`}>
          <button>+ Venta simple</button>
        </Link>
        <Link to={`/empresas/${empresaId}/inventario/venta`}>
          <button>+ Venta de productos</button>
        </Link>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : ventas.length === 0 ? (
        <p>Todavía no hay ventas registradas.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>N°</th>
                <th style={{ padding: '4px 8px' }}>Fecha</th>
                <th style={{ padding: '4px 8px' }}>Cliente</th>
                <th style={{ padding: '4px 8px' }}>Tipo</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Monto</th>
                <th></th>
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
                    {v.es_credito && ' · Crédito'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(v.monto_total).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {v.es_credito && <Link to={`/empresas/${empresaId}/cuentas-por-cobrar`}>Ver cobro</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>Total vendido: {totalVentas.toFixed(2)}</p>
        </>
      )}
    </main>
  )
}
