import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Conciliacion() {
  const { id: empresaId, conciliacionId } = useParams()
  const navigate = useNavigate()

  const [datos, setDatos] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [mostrarCargo, setMostrarCargo] = useState(false)
  const [cargoFecha, setCargoFecha] = useState('')
  const [cargoConcepto, setCargoConcepto] = useState('')
  const [cargoMonto, setCargoMonto] = useState('')
  const [cargoCuenta, setCargoCuenta] = useState('')
  const [guardandoCargo, setGuardandoCargo] = useState(false)

  const [notas, setNotas] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [confirmandoCierre, setConfirmandoCierre] = useState(false)

  async function cargar() {
    const [{ data, error: err }, { data: ctas }] = await Promise.all([
      supabase.rpc('detalle_conciliacion', { p_conciliacion_id: conciliacionId }),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
    ])

    if (err) setError(err.message)
    setDatos(data)
    setCuentas(ctas || [])
    if (data && !cargoFecha) setCargoFecha(data.fecha_hasta)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conciliacionId])

  async function alternar(m) {
    // Optimista: marcar uno por uno esperando al servidor sería
    // insoportable con 40 movimientos.
    setDatos((prev) => ({
      ...prev,
      movimientos: prev.movimientos.map((x) =>
        x.movimiento_id === m.movimiento_id ? { ...x, conciliado: !x.conciliado } : x
      ),
    }))

    const { error } = await supabase.rpc('marcar_conciliado', {
      p_conciliacion_id: conciliacionId,
      p_movimiento_id: m.movimiento_id,
      p_marcar: !m.conciliado,
    })

    if (error) setError(error.message)
    cargar()
  }

  async function agregarCargo(e) {
    e.preventDefault()
    setError(null)
    setGuardandoCargo(true)

    const { error } = await supabase.rpc('registrar_cargo_banco', {
      p_conciliacion_id: conciliacionId,
      p_fecha: cargoFecha,
      p_concepto: cargoConcepto,
      p_monto: parseFloat(cargoMonto),
      p_cuenta_contrapartida_id: cargoCuenta,
    })

    setGuardandoCargo(false)
    if (error) return setError(error.message)

    setCargoConcepto('')
    setCargoMonto('')
    setMostrarCargo(false)
    cargar()
  }

  async function cerrar() {
    setError(null)
    setCerrando(true)

    const { error } = await supabase.rpc('cerrar_conciliacion', {
      p_conciliacion_id: conciliacionId,
      p_notas: notas || null,
    })

    setCerrando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/bancos`)
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!datos) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error || 'Conciliación no encontrada.'}</p>
      </main>
    )
  }

  const cerrada = datos.estado === 'cerrada'
  const diferencia = Number(datos.diferencia)
  const cuadra = Math.abs(diferencia) < 0.005
  const pendientes = datos.movimientos.filter((m) => !m.conciliado)
  const marcados = datos.movimientos.filter((m) => m.conciliado)

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/bancos`}>&larr; Bancos</Link>
      </p>

      <h1>
        Conciliación · {datos.banco}
        {datos.alias && <span style={{ color: '#64748B', fontWeight: 400 }}> · {datos.alias}</span>}
      </h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Del {datos.fecha_desde} al {datos.fecha_hasta}
        {cerrada && ' · Cerrada'}
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {/* El resultado, arriba de todo */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: cuadra ? 'rgba(34, 197, 94, 0.07)' : 'rgba(245, 158, 11, 0.09)',
          border: `1px solid ${cuadra ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.4)'}`,
          borderRadius: 16,
          padding: '1.25rem 1.4rem',
          margin: '1.5rem 0',
        }}
      >
        <BoliMascot pose={cuadra ? 'celebrando' : 'revisando'} size={70} />
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: cuadra ? '#15803D' : '#8a5a00' }}>
            {cuadra ? '✓ Todo cuadra' : `Falta explicar ${fmt(Math.abs(diferencia))}`}
          </p>
          <p style={{ margin: '0.3rem 0 0', color: '#64748B', fontSize: '0.92rem', lineHeight: 1.5 }}>
            {cuadra ? (
              <>Lo que verificaste coincide exactamente con el saldo de tu extracto.</>
            ) : diferencia > 0 ? (
              <>
                Según lo marcado, deberías tener {fmt(datos.saldo_conciliado)} y el banco dice{' '}
                {fmt(datos.saldo_extracto)}. Falta marcar movimientos, o el banco te cobró algo que no registraste.
              </>
            ) : (
              <>
                El banco muestra {fmt(datos.saldo_extracto)} y según lo marcado deberías tener{' '}
                {fmt(datos.saldo_conciliado)}. Puede haber un depósito que no registraste.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Los números */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <p className="stat-label">Saldo anterior</p>
          <p className="stat-value">{fmt(datos.saldo_anterior)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Verificado en el extracto</p>
          <p className="stat-value">{fmt(datos.saldo_conciliado)}</p>
        </div>
        <div className="stat-card destacada-ventas">
          <p className="stat-label">Saldo del banco</p>
          <p className="stat-value">{fmt(datos.saldo_extracto)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Sin verificar</p>
          <p className="stat-value" style={{ color: pendientes.length > 0 ? '#F59E0B' : undefined }}>
            {fmt(datos.total_pendiente)}
          </p>
        </div>
      </div>

      {!cerrada && (
        <div
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 14,
            padding: '1rem 1.15rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>
            <strong>Cómo se hace:</strong> abre tu extracto y marca cada movimiento que aparezca también ahí. Los que
            queden sin marcar son cheques que no cobraron todavía o depósitos que el banco aún no procesó. Si el banco
            te cobró comisiones que no tenías registradas, agrégalas abajo.
          </p>
        </div>
      )}

      {/* Movimientos */}
      <h2>Movimientos del período ({datos.movimientos.length})</h2>

      {datos.movimientos.length === 0 ? (
        <p style={{ color: '#64748B' }}>No hay movimientos registrados en esta cuenta durante el período.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px', width: 40 }}>✓</th>
                <th style={{ padding: '4px 8px' }}>Fecha</th>
                <th style={{ padding: '4px 8px' }}>Detalle</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Entró</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Salió</th>
              </tr>
            </thead>
            <tbody>
              {datos.movimientos.map((m) => (
                <tr
                  key={m.movimiento_id}
                  style={{
                    borderBottom: '1px solid #E6ECF3',
                    background: m.conciliado ? 'rgba(34, 197, 94, 0.05)' : undefined,
                  }}
                >
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="checkbox"
                      checked={m.conciliado}
                      disabled={cerrada}
                      onChange={() => alternar(m)}
                      style={{ width: 18, height: 18 }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{m.fecha}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {m.glosa}
                    <span style={{ color: '#A3AFBF', fontSize: '0.8rem' }}> · #{m.numero}</span>
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#22C55E' }}>
                    {Number(m.debe) > 0 ? Number(m.debe).toFixed(2) : ''}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#EF4444' }}>
                    {Number(m.haber) > 0 ? Number(m.haber).toFixed(2) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.75rem' }}>
        {marcados.length} verificados · {pendientes.length} sin verificar
      </p>

      {/* Cargos del banco */}
      {!cerrada && (
        <section style={{ marginTop: '2rem' }}>
          <h2>¿El banco te cobró algo que no tenías registrado?</h2>
          <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '-0.5rem' }}>
            Comisiones, mantenimiento de cuenta, ITF, o intereses que te abonaron. Se registra el asiento y queda
            conciliado de una vez.
          </p>

          {!mostrarCargo ? (
            <button type="button" onClick={() => setMostrarCargo(true)}>
              + Registrar movimiento del banco
            </button>
          ) : (
            <form
              onSubmit={agregarCargo}
              style={{
                background: '#F7F9FC',
                border: '1px solid #E6ECF3',
                borderRadius: 14,
                padding: '1.15rem',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <label>
                Fecha
                <br />
                <input type="date" required value={cargoFecha} onChange={(e) => setCargoFecha(e.target.value)} />
              </label>
              <label>
                Concepto
                <br />
                <input
                  required
                  value={cargoConcepto}
                  onChange={(e) => setCargoConcepto(e.target.value)}
                  placeholder="ej. Comisión de mantenimiento"
                  style={{ width: 220 }}
                />
              </label>
              <label>
                Monto
                <br />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cargoMonto}
                  onChange={(e) => setCargoMonto(e.target.value)}
                  placeholder="-25"
                  style={{ width: 110 }}
                />
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF' }}>
                  Negativo si te cobraron
                </span>
              </label>
              <label>
                Cuenta
                <br />
                <select required value={cargoCuenta} onChange={(e) => setCargoCuenta(e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {cuentas
                    .filter((c) => (parseFloat(cargoMonto) || 0) < 0 ? c.tipo === 'gasto' : c.tipo === 'ingreso')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF' }}>
                  Normalmente "Gastos Bancarios"
                </span>
              </label>
              <button className="btn-hero" type="submit" disabled={guardandoCargo}>
                Registrar
              </button>
              <button type="button" onClick={() => setMostrarCargo(false)}>
                Cancelar
              </button>
            </form>
          )}
        </section>
      )}

      {/* Cerrar */}
      {!cerrada && (
        <section style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E6ECF3' }}>
          <h2>Cerrar la conciliación</h2>

          {!confirmandoCierre ? (
            <button type="button" onClick={() => setConfirmandoCierre(true)}>
              Cerrar conciliación
            </button>
          ) : (
            <div
              style={{
                background: cuadra ? 'rgba(34, 197, 94, 0.06)' : 'rgba(245, 158, 11, 0.09)',
                border: `1px solid ${cuadra ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.4)'}`,
                borderRadius: 14,
                padding: '1.15rem',
              }}
            >
              {cuadra ? (
                <p style={{ margin: '0 0 0.75rem', color: '#15803D', fontWeight: 600 }}>
                  Todo cuadra. Al cerrar queda como constancia de que revisaste este período.
                </p>
              ) : (
                <p style={{ margin: '0 0 0.75rem', color: '#8a5a00' }}>
                  Todavía hay una diferencia de <strong>{fmt(Math.abs(diferencia))}</strong>. Puedes cerrar igual y
                  dejarla anotada, pero conviene encontrarla antes: casi siempre es un movimiento sin marcar o un
                  cargo del banco sin registrar.
                </p>
              )}

              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                Notas (opcional)
                <br />
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder={cuadra ? 'Todo conforme' : 'ej. Diferencia por revisar con el banco'}
                  style={{ width: '100%', maxWidth: 460 }}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-hero" type="button" onClick={cerrar} disabled={cerrando}>
                  Confirmar cierre
                </button>
                <button type="button" onClick={() => setConfirmandoCierre(false)}>
                  Seguir revisando
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {cerrada && datos.notas && (
        <p style={{ marginTop: '1.5rem', color: '#64748B', fontSize: '0.9rem' }}>
          <strong>Notas:</strong> {datos.notas}
        </p>
      )}
    </main>
  )
}
