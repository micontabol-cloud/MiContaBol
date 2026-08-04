import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Comprobantes() {
  const { id: empresaId } = useParams()
  const [comprobantes, setComprobantes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('comprobantes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('fecha', { ascending: false })

      if (!error) setComprobantes(data)
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Ventas y compras</h1>
        <Link to={`/empresas/${empresaId}/comprobantes/nuevo`}>
          <button>+ Nuevo</button>
        </Link>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : comprobantes.length === 0 ? (
        <p>Todavía no hay ventas ni compras registradas.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '4px 8px' }}>N°</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Cliente / proveedor</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {comprobantes.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>{c.numero_interno}</td>
                <td style={{ padding: '4px 8px' }}>{c.tipo === 'venta' ? 'Venta' : 'Compra'}</td>
                <td style={{ padding: '4px 8px' }}>{c.fecha}</td>
                <td style={{ padding: '4px 8px' }}>{c.cliente_proveedor || '—'}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(c.monto_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
