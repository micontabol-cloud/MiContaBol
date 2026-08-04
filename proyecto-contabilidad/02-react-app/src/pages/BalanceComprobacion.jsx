import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { calcularSaldosPorCuenta } from '../lib/reportes'

export default function BalanceComprobacion() {
  const { id: empresaId } = useParams()
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)

      const { data: cuentas, error: errCuentas } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo, naturaleza')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .order('codigo')

      if (errCuentas) {
        setError(errCuentas.message)
        setCargando(false)
        return
      }

      let query = supabase
        .from('vista_libro_mayor')
        .select('cuenta_id, debe, haber')
        .eq('empresa_id', empresaId)

      if (desde) query = query.gte('fecha', desde)
      if (hasta) query = query.lte('fecha', hasta)

      const { data: movimientos, error: errMov } = await query

      if (errMov) {
        setError(errMov.message)
        setCargando(false)
        return
      }

      setFilas(calcularSaldosPorCuenta(cuentas, movimientos))
      setCargando(false)
    }
    cargar()
  }, [empresaId, desde, hasta])

  const totalDebe = filas.reduce((sum, f) => sum + f.total_debe, 0)
  const totalHaber = filas.reduce((sum, f) => sum + f.total_haber, 0)

  return (
    <main style={{ maxWidth: 800, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Balance de comprobación</h1>
      <p style={{ color: '#64748B' }}>Solo incluye asientos confirmados.</p>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', alignItems: 'flex-end' }}>
        <label>
          Desde
          <br />
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <br />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        {(desde || hasta) && (
          <button
            type="button"
            onClick={() => {
              setDesde('')
              setHasta('')
            }}
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : filas.length === 0 ? (
        <p>Todavía no hay cuentas con movimientos.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>Código</th>
                <th style={{ padding: '4px 8px' }}>Cuenta</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total debe</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total haber</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>{f.codigo}</td>
                  <td style={{ padding: '4px 8px' }}>{f.nombre}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.total_debe.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.total_haber.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.saldo.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #253046', fontWeight: 'bold' }}>
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
              <span style={{ color: '#22C55E' }}>✅ El total debe y el total haber cuadran.</span>
            ) : (
              <span style={{ color: '#EF4444' }}>
                ⚠️ No cuadran (diferencia: {(totalDebe - totalHaber).toFixed(2)}).
              </span>
            )}
          </p>
        </>
      )}
    </main>
  )
}
