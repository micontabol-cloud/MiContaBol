import { Fragment, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function CuentasPorCobrar() {
  const { id: empresaId } = useParams()
  const [filas, setFilas] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [abonoAbierto, setAbonoAbierto] = useState(null)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [cuentaCobroId, setCuentaCobroId] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: cxc, error: errCxc }, { data: cts }] = await Promise.all([
      supabase.from('vista_cuentas_por_cobrar').select('*').eq('empresa_id', empresaId).order('fecha'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
    ])
    if (errCxc) setError(errCxc.message)
    setFilas((cxc || []).filter((f) => f.saldo_pendiente > 0.005))
    setCuentas((cts || []).filter((c) => c.tipo === 'activo'))
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  function abrirAbono(f) {
    setAbonoAbierto(f.comprobante_id)
    setMonto('')
    setCuentaCobroId('')
    setFecha(new Date().toISOString().slice(0, 10))
  }

  async function registrarAbono(e, comprobanteId) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.rpc('registrar_pago', {
      p_empresa_id: empresaId,
      p_comprobante_id: comprobanteId,
      p_fecha: fecha,
      p_monto: parseFloat(monto),
      p_cuenta_cobro_id: cuentaCobroId,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    setAbonoAbierto(null)
    cargar()
  }

  const totalPendiente = filas.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0)

  return (
    <main style={{ maxWidth: 800, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Cuentas por cobrar</h1>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : filas.length === 0 ? (
        <p>No hay saldos pendientes por cobrar. 🎉</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>N°</th>
                <th style={{ padding: '4px 8px' }}>Fecha</th>
                <th style={{ padding: '4px 8px' }}>Cliente</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Pagado</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Pendiente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <Fragment key={f.comprobante_id}>
                  <tr style={{ borderBottom: '1px solid #E6ECF3' }}>
                    <td style={{ padding: '4px 8px' }}>{f.numero_interno}</td>
                    <td style={{ padding: '4px 8px' }}>{f.fecha}</td>
                    <td style={{ padding: '4px 8px' }}>{f.cliente_proveedor || '—'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.monto_total).toFixed(2)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.total_pagado).toFixed(2)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(f.saldo_pendiente).toFixed(2)}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <button type="button" onClick={() => abrirAbono(f)}>
                        Registrar abono
                      </button>
                    </td>
                  </tr>
                  {abonoAbierto === f.comprobante_id && (
                    <tr>
                      <td colSpan={7} style={{ padding: '8px', background: '#F7F9FC' }}>
                        <form
                          onSubmit={(e) => registrarAbono(e, f.comprobante_id)}
                          style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
                        >
                          <label>
                            Fecha
                            <br />
                            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
                          </label>
                          <label>
                            Monto (máx {Number(f.saldo_pendiente).toFixed(2)})
                            <br />
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={f.saldo_pendiente}
                              required
                              value={monto}
                              onChange={(e) => setMonto(e.target.value)}
                              style={{ width: 100 }}
                            />
                          </label>
                          <label>
                            Cuenta que recibe
                            <br />
                            <select required value={cuentaCobroId} onChange={(e) => setCuentaCobroId(e.target.value)}>
                              <option value="">-- Selecciona --</option>
                              {cuentas.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.codigo} — {c.nombre}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button type="submit" disabled={guardando}>
                            Guardar
                          </button>
                          <button type="button" onClick={() => setAbonoAbierto(null)}>
                            Cancelar
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <p style={{ fontWeight: 'bold', marginTop: '1rem' }}>Total pendiente: {totalPendiente.toFixed(2)}</p>
        </>
      )}
    </main>
  )
}
