import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function LibroMayor() {
  const { id: empresaId } = useParams()
  const [cuentas, setCuentas] = useState([])
  const [cuentaId, setCuentaId] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarCuentas() {
      const { data } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, naturaleza')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .order('codigo')
      setCuentas(data || [])
      if (data && data.length > 0) setCuentaId(data[0].id)
    }
    cargarCuentas()
  }, [empresaId])

  useEffect(() => {
    if (!cuentaId) return

    async function cargarMovimientos() {
      setCargando(true)
      setError(null)
      const { data, error } = await supabase
        .from('vista_libro_mayor')
        .select('*')
        .eq('cuenta_id', cuentaId)
        .order('fecha')
        .order('numero')

      if (error) {
        setError(error.message)
      } else {
        setMovimientos(data)
      }
      setCargando(false)
    }
    cargarMovimientos()
  }, [cuentaId])

  const cuentaActual = cuentas.find((c) => c.id === cuentaId)

  // Calcula el saldo acumulado según la naturaleza de la cuenta
  let saldoAcumulado = 0
  const filasConSaldo = movimientos.map((m) => {
    const debe = Number(m.debe)
    const haber = Number(m.haber)
    if (cuentaActual?.naturaleza === 'deudora') {
      saldoAcumulado += debe - haber
    } else {
      saldoAcumulado += haber - debe
    }
    return { ...m, saldo: saldoAcumulado }
  })

  return (
    <main style={{ maxWidth: 800, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Libro mayor</h1>
      <p style={{ color: '#666' }}>Solo incluye asientos confirmados.</p>

      <label>
        Cuenta:{' '}
        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.codigo} — {c.nombre}
            </option>
          ))}
        </select>
      </label>

      {error && <p style={{ color: '#a33' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : filasConSaldo.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>Esta cuenta todavía no tiene movimientos.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>N°</th>
              <th style={{ padding: '4px 8px' }}>Glosa</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Debe</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Haber</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filasConSaldo.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>{m.fecha}</td>
                <td style={{ padding: '4px 8px' }}>{m.numero}</td>
                <td style={{ padding: '4px 8px' }}>{m.asiento_glosa}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(m.debe).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(m.haber).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{m.saldo.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
