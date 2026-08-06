import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Caja() {
  const { id: empresaId } = useParams()
  const [cuentasCaja, setCuentasCaja] = useState([])
  const [todasLasCuentas, setTodasLasCuentas] = useState([])
  const [balance, setBalance] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [tipo, setTipo] = useState('ingreso')
  const [cuentaCajaId, setCuentaCajaId] = useState('')
  const [cuentaContrapartidaId, setCuentaContrapartidaId] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [concepto, setConcepto] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)

    const [{ data: cuentas }, { data: bal, error: errBal }] = await Promise.all([
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
      supabase.from('vista_balance_comprobacion').select('*').eq('empresa_id', empresaId),
    ])

    if (errBal) setError(errBal.message)

    const caja = (cuentas || []).filter((c) => /caja|banco/i.test(c.nombre))
    setCuentasCaja(caja)
    setTodasLasCuentas(cuentas || [])
    setBalance((bal || []).filter((b) => /caja|banco/i.test(b.nombre)))

    setCuentaCajaId((actual) => actual || (caja.length > 0 ? caja[0].id : ''))

    const idsCaja = caja.map((c) => c.id)
    if (idsCaja.length > 0) {
      const { data: mov } = await supabase
        .from('vista_libro_mayor')
        .select('*')
        .eq('empresa_id', empresaId)
        .in('cuenta_id', idsCaja)
        .order('fecha', { ascending: false })
        .order('numero', { ascending: false })
        .limit(20)
      setMovimientos(mov || [])
    }

    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const totalCajaBancos = balance.reduce((sum, b) => sum + Number(b.saldo), 0)

  const hoyStr = new Date().toISOString().slice(0, 10)
  const movimientosHoy = movimientos.filter((m) => m.fecha === hoyStr)
  const entroHoy = movimientosHoy.reduce((s, m) => s + Number(m.debe), 0)
  const salioHoy = movimientosHoy.reduce((s, m) => s + Number(m.haber), 0)

  const hallazgos = []
  if (movimientosHoy.length > 0) {
    hallazgos.push({
      color: entroHoy - salioHoy >= 0 ? '#22C55E' : '#EF4444',
      texto: (
        <>
          Hoy entraron <strong>{fmt(entroHoy)}</strong> y salieron <strong>{fmt(salioHoy)}</strong>.
        </>
      ),
    })
  }
  if (totalCajaBancos < 0) {
    hallazgos.push({
      color: '#EF4444',
      texto: 'Tu saldo está en negativo — revisa si falta registrar algún ingreso.',
    })
  } else if (balance.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tienes <strong>{fmt(totalCajaBancos)}</strong> repartidos en {balance.length}{' '}
          {balance.length === 1 ? 'cuenta' : 'cuentas'}.
        </>
      ),
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!cuentaCajaId || !cuentaContrapartidaId) {
      setError('Selecciona ambas cuentas.')
      return
    }

    if (cuentaCajaId === cuentaContrapartidaId) {
      setError('La cuenta de caja/banco y la otra cuenta deben ser distintas.')
      return
    }

    setGuardando(true)

    const montoNum = parseFloat(monto)
    const lineas =
      tipo === 'ingreso'
        ? [
            { cuenta_id: cuentaCajaId, debe: montoNum, haber: 0 },
            { cuenta_id: cuentaContrapartidaId, debe: 0, haber: montoNum },
          ]
        : [
            { cuenta_id: cuentaContrapartidaId, debe: montoNum, haber: 0 },
            { cuenta_id: cuentaCajaId, debe: 0, haber: montoNum },
          ]

    const { error } = await supabase.rpc('crear_asiento_confirmado', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_glosa: concepto || (tipo === 'ingreso' ? 'Ingreso de efectivo' : 'Salida de efectivo'),
      p_lineas: lineas,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    setMonto('')
    setConcepto('')
    setCuentaContrapartidaId('')
    cargar()
  }

  return (
    <main style={{ maxWidth: 820, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Caja"
        pregunta="¿Cuánto dinero tienes disponible?"
        pose={totalCajaBancos > 0 ? 'exito' : 'pensando'}
        hallazgos={hallazgos}
        mensajeVacio="Sin movimientos todavía."
      />

      <div className="stat-grid" style={{ margin: '1.75rem 0' }}>
        <div className="stat-card">
          <p className="stat-label">Disponible ahora</p>
          <p className="stat-value" style={{ color: totalCajaBancos >= 0 ? '#22C55E' : '#EF4444' }}>
            {fmt(totalCajaBancos)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Entró hoy</p>
          <p className="stat-value">{fmt(entroHoy)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Salió hoy</p>
          <p className="stat-value">{fmt(salioHoy)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Neto del día</p>
          <p className="stat-value" style={{ color: entroHoy - salioHoy >= 0 ? '#22C55E' : '#EF4444' }}>
            {fmt(entroHoy - salioHoy)}
          </p>
        </div>
      </div>

      {balance.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Cuenta</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((b) => (
              <tr key={b.cuenta_id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>
                  {b.codigo} — {b.nombre}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(b.saldo).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Registrar movimiento</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label>
          Tipo
          <br />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="ingreso">Ingreso</option>
            <option value="salida">Salida</option>
          </select>
        </label>
        <label>
          Cuenta
          <br />
          <select value={cuentaCajaId} onChange={(e) => setCuentaCajaId(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {cuentasCaja.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <br />
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label>
          Monto
          <br />
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={{ width: 100 }}
          />
        </label>
        <label>
          {tipo === 'ingreso' ? 'Viene de' : 'Se destina a'}
          <br />
          <select required value={cuentaContrapartidaId} onChange={(e) => setCuentaContrapartidaId(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {todasLasCuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1, minWidth: 160 }}>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button type="submit" disabled={guardando}>
          Registrar
        </button>
      </form>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      <h2>Movimientos recientes</h2>
      {cargando ? (
        <p>Cargando...</p>
      ) : movimientos.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no hay movimientos.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Cuenta</th>
              <th style={{ padding: '4px 8px' }}>Glosa</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Entrada</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Salida</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{m.fecha}</td>
                <td style={{ padding: '4px 8px' }}>{m.cuenta_nombre}</td>
                <td style={{ padding: '4px 8px' }}>{m.asiento_glosa}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  {Number(m.debe) > 0 ? Number(m.debe).toFixed(2) : ''}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  {Number(m.haber) > 0 ? Number(m.haber).toFixed(2) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
