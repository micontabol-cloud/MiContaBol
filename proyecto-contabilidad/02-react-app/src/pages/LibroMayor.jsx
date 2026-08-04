import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function LibroMayor() {
  const { id: empresaId } = useParams()
  const [cuentas, setCuentas] = useState([])
  const [cuentaId, setCuentaId] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

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

  const cuentaActual = cuentas.find((c) => c.id === cuentaId)

  useEffect(() => {
    if (!cuentaId) return

    async function cargarMovimientos() {
      setCargando(true)
      setError(null)

      let saldoIni = 0
      if (desde) {
        const { data: previos, error: errPrevios } = await supabase
          .from('vista_libro_mayor')
          .select('debe, haber')
          .eq('cuenta_id', cuentaId)
          .lt('fecha', desde)

        if (errPrevios) {
          setError(errPrevios.message)
          setCargando(false)
          return
        }

        saldoIni = (previos || []).reduce((acc, m) => {
          const debe = Number(m.debe)
          const haber = Number(m.haber)
          return acc + (cuentaActual?.naturaleza === 'deudora' ? debe - haber : haber - debe)
        }, 0)
      }
      setSaldoInicial(saldoIni)

      let query = supabase
        .from('vista_libro_mayor')
        .select('*')
        .eq('cuenta_id', cuentaId)
        .order('fecha')
        .order('numero')

      if (desde) query = query.gte('fecha', desde)
      if (hasta) query = query.lte('fecha', hasta)

      const { data, error } = await query

      if (error) {
        setError(error.message)
      } else {
        setMovimientos(data)
      }
      setCargando(false)
    }
    cargarMovimientos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentaId, desde, hasta])

  let saldoAcumulado = saldoInicial
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
      <p style={{ color: '#64748B' }}>Solo incluye asientos confirmados.</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', margin: '1rem 0' }}>
        <label>
          Cuenta
          <br />
          <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>N°</th>
              <th style={{ padding: '4px 8px' }}>Glosa</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Debe</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Haber</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {desde && (
              <tr style={{ borderBottom: '1px solid #E6ECF3', fontStyle: 'italic', color: '#64748B' }}>
                <td colSpan={5} style={{ padding: '4px 8px' }}>
                  Saldo inicial (antes de {desde})
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{saldoInicial.toFixed(2)}</td>
              </tr>
            )}
            {filasConSaldo.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{m.fecha}</td>
                <td style={{ padding: '4px 8px' }}>{m.numero}</td>
                <td style={{ padding: '4px 8px' }}>{m.asiento_glosa}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(m.debe).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(m.haber).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{m.saldo.toFixed(2)}</td>
              </tr>
            ))}
            {filasConSaldo.length === 0 && !desde && (
              <tr>
                <td colSpan={6} style={{ padding: '4px 8px' }}>
                  Esta cuenta todavía no tiene movimientos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  )
}
