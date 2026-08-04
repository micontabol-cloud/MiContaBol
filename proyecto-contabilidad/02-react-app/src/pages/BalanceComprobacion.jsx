import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function BalanceComprobacion() {
  const { id: empresaId } = useParams()
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('vista_balance_comprobacion')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('codigo')

      if (error) {
        setError(error.message)
      } else {
        setFilas(data)
      }
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const totalDebe = filas.reduce((sum, f) => sum + Number(f.total_debe), 0)
  const totalHaber = filas.reduce((sum, f) => sum + Number(f.total_haber), 0)

  return (
    <main style={{ maxWidth: 800, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Balance de comprobación</h1>
      <p style={{ color: '#666' }}>Solo incluye asientos confirmados.</p>

      {error && <p style={{ color: '#a33' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : filas.length === 0 ? (
        <p>Todavía no hay cuentas con movimientos.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '4px 8px' }}>Código</th>
                <th style={{ padding: '4px 8px' }}>Cuenta</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total debe</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total haber</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.cuenta_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '4px 8px' }}>{f.codigo}</td>
                  <td style={{ padding: '4px 8px' }}>{f.nombre}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.total_debe).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.total_haber).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.saldo).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
                <td style={{ padding: '4px 8px' }} colSpan={2}>
                  Totales
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{totalDebe.toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{totalHaber.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <p style={{ marginTop: '1rem' }}>
            {Math.abs(totalDebe - totalHaber) < 0.005 ? (
              <span style={{ color: '#2a7' }}>✅ El total debe y el total haber cuadran.</span>
            ) : (
              <span style={{ color: '#a33' }}>
                ⚠️ No cuadran (diferencia: {(totalDebe - totalHaber).toFixed(2)}). Esto no debería pasar si todos
                los asientos están balanceados — avísale a soporte.
              </span>
            )}
          </p>
        </>
      )}
    </main>
  )
}
