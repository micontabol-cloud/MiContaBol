import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

const mesActual = () => new Date().toISOString().slice(0, 7)
const hoy = () => new Date().toISOString().slice(0, 10)

export default function Personal() {
  const { id: empresaId } = useParams()

  const [trabajadores, setTrabajadores] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [historial, setHistorial] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', ci: '', cargo: '', telefono: '', fecha_ingreso: '', sueldo: '' })
  const [creando, setCreando] = useState(false)

  const [accion, setAccion] = useState(null) // {id, tipo}
  const [form, setForm] = useState({})
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: t, error: errT }, { data: c }] = await Promise.all([
      supabase.rpc('resumen_personal', { p_empresa_id: empresaId }),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .eq('tipo', 'activo')
        .order('codigo'),
    ])
    if (errT) setError(errT.message)
    setTrabajadores(t || [])
    setCuentas(c || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function verHistorial(id) {
    if (historial[id]) {
      setHistorial((prev) => ({ ...prev, [id]: null }))
      return
    }
    const { data } = await supabase.rpc('historial_personal', { p_trabajador_id: id })
    setHistorial((prev) => ({ ...prev, [id]: data || [] }))
  }

  async function crearTrabajador(e) {
    e.preventDefault()
    setError(null)
    setCreando(true)

    const { error } = await supabase.from('trabajadores').insert({
      empresa_id: empresaId,
      nombre: nuevo.nombre,
      ci: nuevo.ci || null,
      cargo: nuevo.cargo || null,
      telefono: nuevo.telefono || null,
      fecha_ingreso: nuevo.fecha_ingreso || null,
      sueldo: parseFloat(nuevo.sueldo) || 0,
    })

    setCreando(false)
    if (error) return setError(error.message)

    setNuevo({ nombre: '', ci: '', cargo: '', telefono: '', fecha_ingreso: '', sueldo: '' })
    setMostrarForm(false)
    cargar()
  }

  function abrirAccion(t, tipo) {
    if (accion?.id === t.id && accion?.tipo === tipo) {
      setAccion(null)
      return
    }
    setAccion({ id: t.id, tipo })
    setError(null)
    setForm({
      fecha: hoy(),
      periodo: mesActual(),
      monto: tipo === 'sueldo' ? String(t.sueldo || '') : '',
      descuento: tipo === 'sueldo' ? String(Number(t.anticipos_pendientes) || 0) : '',
      cuenta: cuentas[0]?.id || '',
      notas: '',
    })
  }

  async function guardarAccion(t) {
    setError(null)
    setProcesando(true)

    const comun = { p_fecha: form.fecha, p_cuenta_pago_id: form.cuenta, p_notas: form.notas || null }

    const { error } =
      accion.tipo === 'anticipo'
        ? await supabase.rpc('registrar_anticipo', {
            p_trabajador_id: t.id,
            p_monto: parseFloat(form.monto) || 0,
            ...comun,
          })
        : await supabase.rpc('registrar_pago_sueldo', {
            p_trabajador_id: t.id,
            p_periodo: form.periodo,
            p_monto: parseFloat(form.monto) || 0,
            p_descuento_anticipo: parseFloat(form.descuento) || 0,
            ...comun,
          })

    setProcesando(false)
    if (error) return setError(error.message)

    setAccion(null)
    setHistorial((prev) => ({ ...prev, [t.id]: null }))
    setAviso(accion.tipo === 'anticipo' ? 'Anticipo registrado.' : 'Sueldo registrado.')
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  const activos = trabajadores.filter((t) => t.activo)
  const totalSueldos = activos.reduce((s, t) => s + Number(t.sueldo), 0)
  const totalAnticipos = trabajadores.reduce((s, t) => s + Number(t.anticipos_pendientes), 0)
  const conAnticipo = trabajadores.filter((t) => Number(t.anticipos_pendientes) > 0)
  const sinPagarEsteMes = activos.filter((t) => t.ultimo_sueldo !== mesActual())

  const hallazgos = []
  if (activos.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tienes <strong>{activos.length}</strong> {activos.length === 1 ? 'persona' : 'personas'} en tu equipo, con{' '}
          <strong>{fmt(totalSueldos)}</strong> en sueldos al mes.
        </>
      ),
    })
  }
  if (sinPagarEsteMes.length > 0 && activos.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          <strong>{sinPagarEsteMes.length}</strong>{' '}
          {sinPagarEsteMes.length === 1 ? 'todavía no tiene' : 'todavía no tienen'} el sueldo de este mes registrado.
        </>
      ),
    })
  }
  if (conAnticipo.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          Tienes <strong>{fmt(totalAnticipos)}</strong> en anticipos por descontar.
        </>
      ),
    })
  }

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Personal"
        pregunta="¿A quién le pagas, cuánto, y qué le debes descontar?"
        pose={conAnticipo.length > 0 || sinPagarEsteMes.length > 0 ? 'revisando' : 'agradecido'}
        hallazgos={hallazgos}
        mensajeVacio="Todo al día con tu equipo."
        acciones={
          <button type="button" className="btn-hero" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Agregar trabajador'}
          </button>
        }
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      <p
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 12,
          padding: '0.75rem 0.95rem',
          fontSize: '0.88rem',
          color: '#64748B',
          margin: '1.25rem 0',
          lineHeight: 1.5,
        }}
      >
        Esto registra a quién le pagas y cuánto, con su respaldo contable.{' '}
        <strong>No es una planilla:</strong> no calcula AFP, aportes patronales ni aguinaldo. Esos cálculos los sigue
        haciendo tu contador.
      </p>

      {mostrarForm && (
        <form
          onSubmit={crearTrabajador}
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 16,
            padding: '1.15rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <label>
            Nombre
            <br />
            <input
              required
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              style={{ width: 200 }}
            />
          </label>
          <label>
            Cédula
            <br />
            <input value={nuevo.ci} onChange={(e) => setNuevo({ ...nuevo, ci: e.target.value })} style={{ width: 120 }} />
          </label>
          <label>
            Cargo
            <br />
            <input
              value={nuevo.cargo}
              onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })}
              placeholder="Vendedora"
              style={{ width: 150 }}
            />
          </label>
          <label>
            Teléfono
            <br />
            <input
              value={nuevo.telefono}
              onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
              style={{ width: 120 }}
            />
          </label>
          <label>
            Ingresó el
            <br />
            <input
              type="date"
              value={nuevo.fecha_ingreso}
              onChange={(e) => setNuevo({ ...nuevo, fecha_ingreso: e.target.value })}
            />
          </label>
          <label>
            Sueldo mensual
            <br />
            <input
              type="number"
              step="0.01"
              min="0"
              value={nuevo.sueldo}
              onChange={(e) => setNuevo({ ...nuevo, sueldo: e.target.value })}
              style={{ width: 130 }}
            />
          </label>
          <button className="btn-hero" type="submit" disabled={creando}>
            Agregar
          </button>
        </form>
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : trabajadores.length === 0 ? (
        <p style={{ color: '#64748B' }}>Agrega a tu primer trabajador con el botón de arriba.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {trabajadores.map((t) => {
            const anticipos = Number(t.anticipos_pendientes)
            const pagadoEsteMes = t.ultimo_sueldo === mesActual()

            return (
              <div
                key={t.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 14,
                  padding: '1rem 1.15rem',
                  opacity: t.activo ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                      {t.nombre}
                      {t.cargo && <span style={{ color: '#64748B', fontWeight: 400 }}> · {t.cargo}</span>}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                      {t.ci && `CI ${t.ci} · `}
                      {t.telefono && `${t.telefono} · `}
                      {t.fecha_ingreso && `desde ${t.fecha_ingreso}`}
                      {!t.activo && ' · Inactivo'}
                    </p>
                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9rem' }}>
                        Sueldo: <strong>{fmt(t.sueldo)}</strong>
                      </span>
                      {anticipos > 0 && (
                        <span style={{ fontSize: '0.9rem', color: '#F59E0B', fontWeight: 600 }}>
                          Anticipos por descontar: {fmt(anticipos)}
                        </span>
                      )}
                      <span
                        className="chip-estado"
                        style={
                          pagadoEsteMes
                            ? { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                            : { background: 'rgba(245, 158, 11, 0.15)', color: '#8a5a00' }
                        }
                      >
                        {pagadoEsteMes ? 'Sueldo del mes pagado' : 'Falta el sueldo del mes'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => abrirAccion(t, 'sueldo')}>
                    Pagar sueldo
                  </button>
                  <button type="button" onClick={() => abrirAccion(t, 'anticipo')}>
                    Dar anticipo
                  </button>
                  <button type="button" onClick={() => verHistorial(t.id)}>
                    {historial[t.id] ? 'Ocultar historial' : 'Ver historial'}
                  </button>
                </div>

                {accion?.id === t.id && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}>
                    <p style={{ margin: '0 0 0.7rem', fontWeight: 600, color: '#1F3A5F' }}>
                      {accion.tipo === 'anticipo' ? `Anticipo a ${t.nombre}` : `Sueldo de ${t.nombre}`}
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <label>
                        Fecha
                        <br />
                        <input
                          type="date"
                          value={form.fecha}
                          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                        />
                      </label>

                      {accion.tipo === 'sueldo' && (
                        <label>
                          Mes
                          <br />
                          <input
                            type="month"
                            value={form.periodo}
                            onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                          />
                        </label>
                      )}

                      <label>
                        {accion.tipo === 'anticipo' ? 'Monto' : 'Sueldo del mes'}
                        <br />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.monto}
                          onChange={(e) => setForm({ ...form, monto: e.target.value })}
                          style={{ width: 130 }}
                        />
                      </label>

                      {accion.tipo === 'sueldo' && anticipos > 0 && (
                        <label>
                          Descontar de anticipos
                          <br />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={anticipos}
                            value={form.descuento}
                            onChange={(e) => setForm({ ...form, descuento: e.target.value })}
                            style={{ width: 130 }}
                          />
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF' }}>
                            Tiene {fmt(anticipos)} pendientes
                          </span>
                        </label>
                      )}

                      <label>
                        {accion.tipo === 'anticipo' ? 'Sale de' : 'Le pagas desde'}
                        <br />
                        <select value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })}>
                          {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Nota
                        <br />
                        <input
                          value={form.notas}
                          onChange={(e) => setForm({ ...form, notas: e.target.value })}
                          style={{ width: 160 }}
                        />
                      </label>
                    </div>

                    {accion.tipo === 'sueldo' && (
                      <p
                        style={{
                          margin: '0.85rem 0 0',
                          padding: '0.7rem 0.85rem',
                          background: '#F7F9FC',
                          borderRadius: 10,
                          fontSize: '0.88rem',
                          lineHeight: 1.5,
                        }}
                      >
                        Le entregas{' '}
                        <strong style={{ color: '#1F3A5F' }}>
                          {fmt((parseFloat(form.monto) || 0) - (parseFloat(form.descuento) || 0))}
                        </strong>
                        {(parseFloat(form.descuento) || 0) > 0 && (
                          <>
                            , porque {fmt(parseFloat(form.descuento))} ya se los habías adelantado. El gasto del mes
                            sigue siendo {fmt(parseFloat(form.monto) || 0)}.
                          </>
                        )}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                      <button className="btn-hero" type="button" onClick={() => guardarAccion(t)} disabled={procesando}>
                        Registrar
                      </button>
                      <button type="button" onClick={() => setAccion(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {historial[t.id] && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}>
                    {historial[t.id].length === 0 ? (
                      <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Sin movimientos todavía.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                            <th style={{ padding: '3px 6px' }}>Fecha</th>
                            <th style={{ padding: '3px 6px' }}>Concepto</th>
                            <th style={{ padding: '3px 6px', textAlign: 'right' }}>Monto</th>
                            <th style={{ padding: '3px 6px', textAlign: 'right' }}>Le entregaste</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historial[t.id].map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #F7F9FC' }}>
                              <td style={{ padding: '3px 6px' }}>{p.fecha}</td>
                              <td style={{ padding: '3px 6px' }}>
                                {p.tipo === 'anticipo' ? 'Anticipo' : `Sueldo ${p.periodo || ''}`}
                                {Number(p.descuento_anticipo) > 0 && (
                                  <span style={{ color: '#A3AFBF' }}>
                                    {' '}
                                    (− {fmt(p.descuento_anticipo)} de anticipos)
                                  </span>
                                )}
                                {p.notas && <span style={{ color: '#A3AFBF' }}> · {p.notas}</span>}
                              </td>
                              <td style={{ padding: '3px 6px', textAlign: 'right' }}>{fmt(p.monto)}</td>
                              <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>
                                {fmt(p.neto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
