import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Building2, TrendingDown, Info } from 'lucide-react'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const mesAnterior = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

const nombreMes = (periodo) => {
  if (!periodo) return ''
  const [a, m] = periodo.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${meses[Number(m) - 1]} de ${a}`
}

export default function ActivosFijos() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({
    nombre: '',
    categoria: 'muebles',
    fecha_compra: new Date().toISOString().slice(0, 10),
    valor: '',
    anos_vida: 10,
    valor_residual: '',
    cuenta_pago: '',
    yaLoTenia: false,
    descripcion: '',
  })
  const [creando, setCreando] = useState(false)

  const [periodoDep, setPeriodoDep] = useState(mesAnterior())
  const [depreciando, setDepreciando] = useState(false)
  const [confirmarDep, setConfirmarDep] = useState(false)

  const [baja, setBaja] = useState(null)
  const [formBaja, setFormBaja] = useState({ fecha: '', motivo: '', valor_venta: '', cuenta_cobro: '' })
  const [procesandoBaja, setProcesandoBaja] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: res, error: err }, { data: cats }, { data: ctas }] = await Promise.all([
      supabase.rpc('resumen_activos', { p_empresa_id: empresaId }),
      supabase.from('categorias_activo').select('*').order('orden'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .eq('tipo', 'activo')
        .order('codigo'),
    ])
    if (err) setError(err.message)
    setDatos(res)
    setCategorias(cats || [])
    setCuentas(ctas || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // Al cambiar de categoría, los años se ajustan a la recomendación
  function cambiarCategoria(codigo) {
    const cat = categorias.find((c) => c.codigo === codigo)
    setNuevo((prev) => ({ ...prev, categoria: codigo, anos_vida: cat?.anos_vida ?? prev.anos_vida }))
  }

  async function crear(e) {
    e.preventDefault()
    setError(null)
    setCreando(true)

    const { error } = await supabase.rpc('registrar_activo', {
      p_empresa_id: empresaId,
      p_nombre: nuevo.nombre,
      p_categoria: nuevo.categoria,
      p_fecha_compra: nuevo.fecha_compra,
      p_valor: parseFloat(nuevo.valor) || 0,
      p_anos_vida: parseInt(nuevo.anos_vida, 10),
      p_cuenta_pago_id: nuevo.yaLoTenia ? null : nuevo.cuenta_pago || null,
      p_valor_residual: parseFloat(nuevo.valor_residual) || 0,
      p_descripcion: nuevo.descripcion || null,
    })

    setCreando(false)
    if (error) return setError(error.message)

    setNuevo({
      nombre: '',
      categoria: 'muebles',
      fecha_compra: new Date().toISOString().slice(0, 10),
      valor: '',
      anos_vida: 10,
      valor_residual: '',
      cuenta_pago: '',
      yaLoTenia: false,
      descripcion: '',
    })
    setMostrarForm(false)
    cargar()
  }

  async function depreciar() {
    setError(null)
    setDepreciando(true)

    const { data, error } = await supabase.rpc('depreciar_mes', {
      p_empresa_id: empresaId,
      p_periodo: periodoDep,
    })

    setDepreciando(false)
    if (error) return setError(error.message)

    setConfirmarDep(false)
    setAviso(
      data.activos === 0
        ? 'No había bienes por depreciar en ese mes.'
        : `Se registró la depreciación de ${nombreMes(periodoDep)}: ${data.activos} ${
            data.activos === 1 ? 'bien' : 'bienes'
          } por ${fmt(data.total)}.`
    )
    setTimeout(() => setAviso(null), 8000)
    cargar()
  }

  async function darDeBaja(a) {
    setError(null)
    setProcesandoBaja(true)

    const { error } = await supabase.rpc('dar_de_baja_activo', {
      p_activo_id: a.id,
      p_fecha: formBaja.fecha,
      p_motivo: formBaja.motivo,
      p_valor_venta: formBaja.valor_venta ? parseFloat(formBaja.valor_venta) : null,
      p_cuenta_cobro_id: formBaja.cuenta_cobro || null,
    })

    setProcesandoBaja(false)
    if (error) return setError(error.message)

    setBaja(null)
    setAviso(`"${a.nombre}" se dio de baja.`)
    setTimeout(() => setAviso(null), 6000)
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  const activos = datos?.activos || []
  const catActual = categorias.find((c) => c.codigo === nuevo.categoria)

  const hallazgos = []
  if (activos.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tienes <strong>{activos.length}</strong> {activos.length === 1 ? 'bien' : 'bienes'} que valen{' '}
          <strong>{fmt(datos.valor_actual)}</strong> hoy.
        </>
      ),
    })
  }
  if (datos?.pendientes > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          <strong>{datos.pendientes}</strong> {datos.pendientes === 1 ? 'bien tiene' : 'bienes tienen'} depreciación
          pendiente de registrar.
        </>
      ),
    })
  }

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Bienes del negocio"
        pregunta="¿Qué tienes y cuánto vale hoy?"
        pose={datos?.pendientes > 0 ? 'alerta' : 'exito'}
        hallazgos={hallazgos}
        mensajeVacio="Todo al día."
        acciones={
          <button type="button" className="btn-hero" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Registrar un bien'}
          </button>
        }
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && (
        <p
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: '0.75rem 0.95rem',
            color: '#15803D',
            fontSize: '0.92rem',
          }}
        >
          {aviso}
        </p>
      )}

      <p
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 12,
          padding: '0.8rem 0.95rem',
          fontSize: '0.9rem',
          color: '#64748B',
          margin: '1.25rem 0',
          lineHeight: 1.55,
        }}
      >
        Aquí van las cosas que tu negocio <strong>usa para trabajar</strong>: vitrinas, computadoras, vehículos,
        maquinaria. No la mercadería que vendes — esa va en Inventario.
      </p>

      {/* Formulario */}
      {mostrarForm && (
        <form
          onSubmit={crear}
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 16,
            padding: '1.15rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label>
              ¿Qué es?
              <br />
              <input
                required
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                placeholder="Vitrina de vidrio grande"
                style={{ width: 230 }}
              />
            </label>

            <label>
              Tipo
              <br />
              <select value={nuevo.categoria} onChange={(e) => cambiarCategoria(e.target.value)}>
                {categorias.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              ¿Cuánto costó?
              <br />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={nuevo.valor}
                onChange={(e) => setNuevo({ ...nuevo, valor: e.target.value })}
                style={{ width: 140 }}
              />
            </label>

            <label>
              ¿Cuándo lo compraste?
              <br />
              <input
                type="date"
                required
                value={nuevo.fecha_compra}
                onChange={(e) => setNuevo({ ...nuevo, fecha_compra: e.target.value })}
              />
            </label>
          </div>

          {/* Años de vida: la norma como recomendación, no imposición */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 12,
              padding: '0.9rem 1rem',
              marginTop: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label>
                ¿Cuántos años te va a durar?
                <br />
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={nuevo.anos_vida}
                  onChange={(e) => setNuevo({ ...nuevo, anos_vida: e.target.value })}
                  style={{ width: 100 }}
                />
              </label>

              {catActual && Number(nuevo.anos_vida) !== catActual.anos_vida && (
                <button
                  type="button"
                  onClick={() => setNuevo({ ...nuevo, anos_vida: catActual.anos_vida })}
                  style={{ fontSize: '0.82rem' }}
                >
                  Usar {catActual.anos_vida} años
                </button>
              )}

              <label>
                ¿Cuánto valdrá al final? (opcional)
                <br />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevo.valor_residual}
                  onChange={(e) => setNuevo({ ...nuevo, valor_residual: e.target.value })}
                  placeholder="0"
                  style={{ width: 130 }}
                />
              </label>
            </div>

            {catActual && (
              <p
                style={{
                  margin: '0.7rem 0 0',
                  fontSize: '0.85rem',
                  color: '#64748B',
                  display: 'flex',
                  gap: '0.45rem',
                  alignItems: 'flex-start',
                  lineHeight: 1.5,
                }}
              >
                <Info size={15} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2, color: '#3B82F6' }} />
                <span>
                  La norma tributaria boliviana usa <strong>{catActual.anos_vida} años</strong> para{' '}
                  {catActual.nombre.toLowerCase()}. Puedes cambiarlo si tu contador prefiere otro plazo.
                </span>
              </p>
            )}

            {nuevo.valor && nuevo.anos_vida > 0 && (
              <p style={{ margin: '0.6rem 0 0', fontSize: '0.9rem', color: '#1F3A5F' }}>
                Se va a descontar{' '}
                <strong>
                  {fmt(((parseFloat(nuevo.valor) || 0) - (parseFloat(nuevo.valor_residual) || 0)) / (nuevo.anos_vida * 12))}
                </strong>{' '}
                cada mes como gasto.
              </p>
            )}
          </div>

          {/* De dónde salió el dinero */}
          <div style={{ marginTop: '0.9rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
              <input
                type="checkbox"
                checked={nuevo.yaLoTenia}
                onChange={(e) => setNuevo({ ...nuevo, yaLoTenia: e.target.checked })}
              />
              Ya lo tenía antes de usar MiContaBol
            </label>

            {!nuevo.yaLoTenia && (
              <label>
                ¿De dónde salió el dinero?
                <br />
                <select
                  value={nuevo.cuenta_pago}
                  onChange={(e) => setNuevo({ ...nuevo, cuenta_pago: e.target.value })}
                  style={{ minWidth: 240 }}
                >
                  <option value="">-- No registrar el pago --</option>
                  {cuentas
                    .filter((c) => /caja|banco/i.test(c.nombre))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
              </label>
            )}
          </div>

          <button className="btn-hero" type="submit" disabled={creando} style={{ marginTop: '1rem' }}>
            Registrar bien
          </button>
        </form>
      )}

      {/* Resumen */}
      {activos.length > 0 && (
        <>
          <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <p className="stat-label">Te costaron</p>
              <p className="stat-value">{fmt(datos.valor_compra)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Se han desgastado</p>
              <p className="stat-value" style={{ color: '#F59E0B' }}>
                {fmt(datos.depreciacion_acumulada)}
              </p>
            </div>
            <div className="stat-card destacada-utilidad">
              <p className="stat-label">Valen hoy</p>
              <p className="stat-value" style={{ color: '#22C55E' }}>
                {fmt(datos.valor_actual)}
              </p>
            </div>
          </div>

          {/* Botón de depreciación */}
          <section
            style={{
              background: datos.pendientes > 0 ? 'rgba(245, 158, 11, 0.08)' : '#F7F9FC',
              border: `1px solid ${datos.pendientes > 0 ? 'rgba(245, 158, 11, 0.35)' : '#E6ECF3'}`,
              borderRadius: 16,
              padding: '1.15rem 1.3rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TrendingDown size={22} strokeWidth={1.8} style={{ color: '#F59E0B', marginTop: 3, flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>Registrar el desgaste del mes</p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: '#64748B', lineHeight: 1.55 }}>
                  Tus bienes pierden valor cada mes que pasa, y ese desgaste es un gasto real. Si no lo registras,
                  tu ganancia sale más alta de lo que es.
                </p>
              </div>
            </div>

            {!confirmarDep ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                <label>
                  Mes
                  <br />
                  <input type="month" value={periodoDep} onChange={(e) => setPeriodoDep(e.target.value)} />
                </label>
                <button type="button" className="btn-hero" onClick={() => setConfirmarDep(true)}>
                  Registrar depreciación
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '0.9rem' }}>
                <p style={{ margin: '0 0 0.7rem', fontSize: '0.92rem' }}>
                  Se va a registrar la depreciación de <strong>{nombreMes(periodoDep)}</strong> para todos tus
                  bienes. Se genera un asiento y no se puede repetir el mismo mes.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-hero" onClick={depreciar} disabled={depreciando}>
                    {depreciando ? 'Registrando...' : 'Confirmar'}
                  </button>
                  <button type="button" onClick={() => setConfirmarDep(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Lista */}
      <h2>Tus bienes</h2>

      {activos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <Building2 size={44} strokeWidth={1.4} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem' }}>
            Todavía no registraste ningún bien. Empieza con lo más grande: tu vitrina, tu computadora, tu vehículo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activos.map((a) => {
            const avance = Number(a.valor_compra) > 0
              ? (Number(a.depreciacion_acumulada) / (Number(a.valor_compra) - Number(a.valor_residual))) * 100
              : 0

            return (
              <div
                key={a.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 14,
                  padding: '1rem 1.15rem',
                  opacity: a.dado_de_baja ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 230 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                      {a.nombre}
                      {a.dado_de_baja && (
                        <span className="chip-estado" style={{ background: 'rgba(239,68,68,0.1)', color: '#B91C1C', marginLeft: '0.5rem' }}>
                          Dado de baja
                        </span>
                      )}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                      {a.categoria_nombre} · comprado el {a.fecha_compra} · {a.anos_vida} años de vida
                    </p>

                    {!a.dado_de_baja && (
                      <>
                        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                          <span>
                            Costó: <strong>{fmt(a.valor_compra)}</strong>
                          </span>
                          <span style={{ color: '#F59E0B' }}>
                            Desgastado: <strong>{fmt(a.depreciacion_acumulada)}</strong>
                          </span>
                          <span style={{ color: '#22C55E', fontWeight: 600 }}>
                            Vale hoy: {fmt(a.valor_actual)}
                          </span>
                        </div>

                        <div
                          style={{
                            height: 6,
                            background: '#E6ECF3',
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginTop: '0.6rem',
                            maxWidth: 380,
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, avance))}%`,
                              height: '100%',
                              background: avance >= 100 ? '#EF4444' : '#F59E0B',
                            }}
                          />
                        </div>
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#A3AFBF' }}>
                          {avance >= 100
                            ? 'Ya terminó su vida útil contable'
                            : `${Math.round(avance)}% de su vida útil · ${fmt(a.depreciacion_mensual)} al mes`}
                        </p>
                      </>
                    )}
                  </div>

                  {!a.dado_de_baja && (
                    <button
                      type="button"
                      onClick={() => {
                        setBaja(baja === a.id ? null : a.id)
                        setFormBaja({
                          fecha: new Date().toISOString().slice(0, 10),
                          motivo: '',
                          valor_venta: '',
                          cuenta_cobro: '',
                        })
                      }}
                      style={{ fontSize: '0.85rem', alignSelf: 'flex-start' }}
                    >
                      Dar de baja
                    </button>
                  )}
                </div>

                {baja === a.id && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}>
                    <p style={{ margin: '0 0 0.7rem', fontSize: '0.9rem', color: '#64748B' }}>
                      Se registra cuando lo vendes, se daña o dejas de usarlo. Si lo vendes, la diferencia con lo que
                      vale en libros se registra como ganancia o pérdida.
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <label>
                        Fecha
                        <br />
                        <input
                          type="date"
                          value={formBaja.fecha}
                          onChange={(e) => setFormBaja({ ...formBaja, fecha: e.target.value })}
                        />
                      </label>

                      <label>
                        ¿Qué pasó?
                        <br />
                        <input
                          value={formBaja.motivo}
                          onChange={(e) => setFormBaja({ ...formBaja, motivo: e.target.value })}
                          placeholder="ej. Se vendió"
                          style={{ width: 200 }}
                        />
                      </label>

                      <label>
                        ¿Lo vendiste? ¿En cuánto?
                        <br />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formBaja.valor_venta}
                          onChange={(e) => setFormBaja({ ...formBaja, valor_venta: e.target.value })}
                          placeholder="dejar vacío si no"
                          style={{ width: 150 }}
                        />
                      </label>

                      {formBaja.valor_venta && (
                        <label>
                          ¿Dónde entró?
                          <br />
                          <select
                            value={formBaja.cuenta_cobro}
                            onChange={(e) => setFormBaja({ ...formBaja, cuenta_cobro: e.target.value })}
                          >
                            <option value="">-- Selecciona --</option>
                            {cuentas
                              .filter((c) => /caja|banco/i.test(c.nombre))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => darDeBaja(a)}
                        disabled={procesandoBaja || !formBaja.motivo.trim()}
                        style={{ background: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }}
                      >
                        Confirmar baja
                      </button>
                      <button type="button" onClick={() => setBaja(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.85rem', marginTop: '1.5rem', lineHeight: 1.55 }}>
        Los años de vida útil siguen la norma tributaria boliviana, pero los puedes ajustar. Si tienes contador,
        vale la pena confirmarlos con él.
      </p>
    </main>
  )
}
