import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Compras() {
  const { id: empresaId } = useParams()
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('comprobantes')
        .select('*, comprobante_items(id)')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'compra')
        .order('fecha', { ascending: false })
        .order('numero_interno', { ascending: false })

      if (error) setError(error.message)
      setCompras(data || [])
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const totalCompras = compras.reduce((sum, c) => sum + Number(c.monto_total), 0)

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <h1>Compras</h1>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <Link to={`/empresas/${empresaId}/compras/nueva-simple`}>
          <button>+ Compra simple</button>
        </Link>
        <Link to={`/empresas/${empresaId}/inventario/compra`}>
          <button>+ Compra de inventario</button>
        </Link>
        <Link to={`/empresas/${empresaId}/cuentas-por-pagar`}>
          <button type="button">Cuentas por pagar</button>
        </Link>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : compras.length === 0 ? (
        <p>Todavía no hay compras registradas.</p>
      ) : (
        <>
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
                    {c.comprobante_items?.length > 0 ? 'Inventario' : 'Simple'}
                    {c.es_credito && ' · Crédito'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(c.monto_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>Total comprado: {totalCompras.toFixed(2)}</p>
        </>
      )}
    </main>
  )
}
