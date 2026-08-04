import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Tabla({ titulo, filas }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '0.25rem' }}>{titulo}</h3>
      {filas.length === 0 ? (
        <p style={{ color: '#888' }}>Sin movimientos</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {filas.map((f) => (
              <tr key={f.cuenta_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>
                  {f.codigo} — {f.nombre}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.saldo).toFixed(2)}</td>
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

  const porTipo = (tipo) => filas.filter((f) => f.tipo === tipo)
  const sumaSaldo = (lista) => lista.reduce((sum, f) => sum + Number(f.saldo), 0)

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

  if (cargando) {
    return (
      <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Estados financieros</h1>
      <p style={{ color: '#666' }}>Solo incluye asientos confirmados, acumulado desde el inicio.</p>

      {error && <p style={{ color: '#a33' }}>{error}</p>}

      <section style={{ marginTop: '2rem' }}>
        <h2>Estado de resultados</h2>
        <Tabla titulo="Ingresos" filas={ingresos} />
        <Tabla titulo="Gastos" filas={gastos} />
        <p style={{ fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '0.5rem' }}>
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
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '4px 8px' }}>Utilidad del ejercicio (del Estado de Resultados)</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>{utilidadNeta.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Total activo: {totalActivo.toFixed(2)}</p>
        <p style={{ fontWeight: 'bold' }}>Total pasivo + patrimonio: {totalPasivoMasPatrimonio.toFixed(2)}</p>

        <p style={{ marginTop: '1rem' }}>
          {cuadra ? (
            <span style={{ color: '#2a7' }}>✅ Activo = Pasivo + Patrimonio. La ecuación contable cuadra.</span>
          ) : (
            <span style={{ color: '#a33' }}>
              ⚠️ No cuadra (diferencia: {(totalActivo - totalPasivoMasPatrimonio).toFixed(2)}).
            </span>
          )}
        </p>
      </section>
    </main>
  )
}
