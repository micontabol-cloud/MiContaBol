import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function AnalisisCosto() {
  const { id: empresaId } = useParams()
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      setError(null)

      const { data: productos, error: errProd } = await supabase
        .from('productos')
        .select('id, codigo, nombre')
        .eq('empresa_id', empresaId)
        .is('eliminado_at', null)

      if (errProd) {
        setError(errProd.message)
        setCargando(false)
        return
      }

      const { data: promedios, error: errProm } = await supabase.from('vista_costo_promedio').select('*')

      if (errProm) {
        setError(errProm.message)
        setCargando(false)
        return
      }

      const { data: ventas, error: errVentas } = await supabase
        .from('comprobantes')
        .select('id, comprobante_items(producto_id, cantidad, costo_unitario)')
        .eq('empresa_id', empresaId)
        .is('anulado_at', null)
        .eq('tipo', 'venta')

      if (errVentas) {
        setError(errVentas.message)
        setCargando(false)
        return
      }

      const promedioPorProducto = new Map((promedios || []).map((p) => [p.producto_id, Number(p.costo_promedio)]))

      const porProducto = new Map()
      productos.forEach((p) =>
        porProducto.set(p.id, { ...p, cantidad_vendida: 0, costo_real_total: 0, costo_promedio_total: 0 })
      )

      ;(ventas || []).forEach((v) => {
        ;(v.comprobante_items || []).forEach((item) => {
          const fila = porProducto.get(item.producto_id)
          if (!fila) return
          const costoPromedio = promedioPorProducto.get(item.producto_id) ?? Number(item.costo_unitario)
          fila.cantidad_vendida += Number(item.cantidad)
          fila.costo_real_total += Number(item.cantidad) * Number(item.costo_unitario)
          fila.costo_promedio_total += Number(item.cantidad) * costoPromedio
        })
      })

      setFilas(Array.from(porProducto.values()).filter((f) => f.cantidad_vendida > 0))
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  const totalCostoReal = filas.reduce((sum, f) => sum + f.costo_real_total, 0)
  const totalCostoPromedio = filas.reduce((sum, f) => sum + f.costo_promedio_total, 0)
  const diferencia = totalCostoPromedio - totalCostoReal

  return (
    <main style={{ maxWidth: 800, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Costo fijo vs. costo promedio ponderado</h1>
      <p style={{ color: '#64748B' }}>
        Tu contabilidad real usa el costo fijo de cada producto. Esto te muestra qué tan distinto habría sido tu
        resultado si hubieras usado el costo promedio de tus compras en su lugar — es solo informativo, no cambia
        ningún asiento.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : filas.length === 0 ? (
        <p>Todavía no hay ventas de productos para comparar.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>Producto</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Cant. vendida</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo real (fijo)</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo con promedio</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>
                    {f.codigo} — {f.nombre}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.cantidad_vendida.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.costo_real_total.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{f.costo_promedio_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1.5rem' }}>
            <p>
              Costo total de ventas (real, con costo fijo): <strong>{totalCostoReal.toFixed(2)}</strong>
            </p>
            <p>
              Costo total de ventas (estimado, con costo promedio): <strong>{totalCostoPromedio.toFixed(2)}</strong>
            </p>
            <p>
              Diferencia en utilidad:{' '}
              <strong style={{ color: diferencia === 0 ? '#253046' : diferencia > 0 ? '#EF4444' : '#22C55E' }}>
                {diferencia > 0 ? '-' : '+'}
                {Math.abs(diferencia).toFixed(2)}
              </strong>{' '}
              {diferencia > 0
                ? '(tu utilidad real es mayor a la que tendrías con costo promedio)'
                : diferencia < 0
                ? '(tu utilidad real es menor a la que tendrías con costo promedio)'
                : '(no hay diferencia)'}
            </p>
          </div>
        </>
      )}
    </main>
  )
}
