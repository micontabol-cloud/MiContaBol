import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { calcularSaldosPorCuenta } from '../lib/reportes'

function Tabla({ titulo, filas }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '0.25rem' }}>{titulo}</h3>
      {filas.length === 0 ? (
        <p style={{ color: '#A3AFBF' }}>Sin movimientos</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>
                  {f.codigo} — {f.nombre}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.saldo.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function EstadosFinancieros() {
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

  const porTipo = (tipo) => filas.filter((f) => f.tipo === tipo)
  const sumaSaldo = (lista) => lista.reduce((sum, f) => sum + f.saldo, 0)

  const ingresos = porTipo('ingreso')
  const gastos = porTipo('gasto')
  const activos = porTipo('activo')
  const pasivos = porTipo('pasivo')
  const patrimonios = porTipo('patrimonio')

  const totalIngresos = sumaSaldo(ingresos)
  const totalGastos = sumaSaldo(gastos)
  const utilidadNeta = totalIngresos - totalGastos

  const totalActivo = sumaSaldo(activos)
  const totalPasivo = sumaSaldo(pasivos)
  const totalPatrimonioSinUtilidad = sumaSaldo(patrimonios)
  const totalPasivoMasPatrimonio = totalPasivo + totalPatrimonioSinUtilidad + utilidadNeta
  const cuadra = Math.abs(totalActivo - totalPasivoMasPatrimonio) < 0.005

  return (
    <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Estados financieros</h1>
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
      ) : (
        <>
          <section style={{ marginTop: '1rem' }}>
            <h2>Estado de resultados</h2>
            <Tabla titulo="Ingresos" filas={ingresos} />
            <Tabla titulo="Gastos" filas={gastos} />
            <p style={{ fontWeight: 'bold', borderTop: '2px solid #253046', paddingTop: '0.5rem' }}>
              Utilidad neta: {utilidadNeta.toFixed(2)}
            </p>
          </section>

          <section style={{ marginTop: '2.5rem' }}>
            <h2>Balance general</h2>
            <Tabla titulo="Activo" filas={activos} />
            <Tabla titulo="Pasivo" filas={pasivos} />
            <Tabla titulo="Patrimonio" filas={patrimonios} />

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>Utilidad del ejercicio (del Estado de Resultados)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{utilidadNeta.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Total activo: {totalActivo.toFixed(2)}</p>
            <p style={{ fontWeight: 'bold' }}>Total pasivo + patrimonio: {totalPasivoMasPatrimonio.toFixed(2)}</p>

            <p style={{ marginTop: '1rem' }}>
              {cuadra ? (
                <span style={{ color: '#22C55E' }}>✅ Activo = Pasivo + Patrimonio. La ecuación contable cuadra.</span>
              ) : (
                <span style={{ color: '#EF4444' }}>
                  ⚠️ No cuadra (diferencia: {(totalActivo - totalPasivoMasPatrimonio).toFixed(2)}).
                </span>
              )}
            </p>
          </section>

          {(desde || hasta) && (
            <p style={{ color: '#A3AFBF', fontSize: '0.85em', marginTop: '1.5rem' }}>
              Nota: con un filtro de fechas activo, el Balance General muestra solo el movimiento del período
              elegido, no los saldos acumulados desde el inicio — útil para ver la actividad de un mes, pero para
              un balance general "real" a una fecha de corte, lo correcto es dejar "Desde" vacío y solo poner
              "Hasta".
            </p>
          )}
        </>
      )}
    </main>
  )
}
