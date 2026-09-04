import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Handshake, Package, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Promotores() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({
    email: '',
    nombre: '',
    telefono: '',
    zona: '',
    descuento: 30,
    tipo_acceso: 'consignacion',
  })
  const [creando, setCreando] = useState(false)

  const [cobrando, setCobrando] = useState(null)
  const [pago, setPago] = useState({ monto: '', cuenta: '', nota: '' })
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data, error: err }, { data: ctas }] = await Promise.all([
      supabase.rpc('resumen_promotores', { p_empresa_id: empresaId }),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'activo')
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
    ])
    if (err) setError(err.message)
    setDatos(data)
    setCuentas(ctas || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function crear(e) {
    e.preventDefault()
    setError(null)
    setCreando(true)

    const { error } = await supabase.rpc('alta_promotor', {
      p_empresa_id: empresaId,
      p_email: nuevo.email.trim().toLowerCase(),
      p_nombre: nuevo.nombre.trim(),
      p_telefono: nuevo.telefono || null,
      p_zona: nuevo.zona || null,
      p_descuento: Number(nuevo.descuento),
      p_tipo_acceso: nuevo.tipo_acceso,
    })

    setCreando(false)
    if (error) return setError(error.message)

    setNuevo({ email: '', nombre: '', telefono: '', zona: '', descuento: 30, tipo_acceso: 'consignacion' })
    setMostrarForm(false)
    setAviso('Promotor dado de alta.')
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  async function registrarPago(p) {
    setError(null)
    setProcesando(true)

    const { data, error } = await supabase.rpc('registrar_pago_promotor', {
      p_promotor_id: p.id,
      p_monto: parseFloat(pago.monto),
      p_cuenta_cobro_id: pago.cuenta,
      p_nota: pago.nota || null,
    })

    setProcesando(false)
    if (error) return setError(error.message)

    setCobrando(null)
    setPago({ monto: '', cuenta: '', nota: '' })
    setAviso(`Pago registrado. ${p.nombre} queda debiendo ${fmt(data.saldo)}.`)
    setTimeout(() => setAviso(null), 7000)
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 980, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  const lista = datos?.promotores || []
  const activos = lista.filter((p) => p.activo)
  const totalDeuda = lista.reduce((s, p) => s + Number(p.debe || 0), 0)
  const totalVendido = lista.reduce((s, p) => s + Number(p.vendido || 0), 0)
  const totalGanancia = lista.reduce((s, p) => s + Number(p.ganancia_empresa || 0), 0)

  const hallazgos = []
  if (activos.length > 0) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tus promotores vendieron <strong>{fmt(totalVendido)}</strong> este mes, y te dejaron{' '}
          <strong>{fmt(totalGanancia)}</strong> de ganancia.
        </>
      ),
    })
  }
  if (totalDeuda > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          Te deben <strong>{fmt(totalDeuda)}</strong> en total.
        </>
      ),
    })
  }

  return (
    <main style={{ maxWidth: 980, fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <BoliMascot pose={totalDeuda > 0 ? 'consejo' : 'exito'} size={72} />

        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ margin: 0 }}>Promotores</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>¿Cómo les está yendo?</p>

          {hallazgos.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.85rem 0 0' }}>
              {hallazgos.map((h, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'flex-start',
                    marginBottom: '0.35rem',
                    fontSize: '0.95rem',
                  }}
                >
                  <span style={{ color: h.color, fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                  <span>{h.texto}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="btn-hero"
            onClick={() => setMostrarForm(!mostrarForm)}
            style={{ marginTop: '1rem' }}
          >
            {mostrarForm ? 'Cancelar' : '+ Dar de alta un promotor'}
          </button>
        </div>
      </div>

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
        Un promotor vende tu mercadería por fuera. Le dejas los productos a precio mayorista, él le cobra al
        cliente lo que quiera, y te paga la diferencia. La mercadería sigue siendo tuya hasta que se venda.
      </p>

      {/* Alta */}
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
          <p style={{ margin: '0 0 0.9rem', fontWeight: 700, color: '#1F3A5F' }}>Nuevo promotor</p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label>
              Correo de su cuenta
              <br />
              <input
                type="email"
                required
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                placeholder="promotor@correo.com"
                style={{ width: 240 }}
              />
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
                Tiene que haberse registrado antes en MiContaBol.
              </span>
            </label>

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
              WhatsApp
              <br />
              <input
                value={nuevo.telefono}
                onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                style={{ width: 140 }}
              />
            </label>

            <label>
              Zona
              <br />
              <input
                value={nuevo.zona}
                onChange={(e) => setNuevo({ ...nuevo, zona: e.target.value })}
                placeholder="Plan 3000"
                style={{ width: 150 }}
              />
            </label>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 12,
              padding: '0.9rem 1rem',
              marginTop: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label>
                Su descuento
                <br />
                <input
                  type="number"
                  min="1"
                  max="80"
                  required
                  value={nuevo.descuento}
                  onChange={(e) => setNuevo({ ...nuevo, descuento: e.target.value })}
                  style={{ width: 90 }}
                />
                <span style={{ marginLeft: '0.4rem', color: '#64748B' }}>%</span>
              </label>

              <label>
                Qué puede ver
                <br />
                <select
                  value={nuevo.tipo_acceso}
                  onChange={(e) => setNuevo({ ...nuevo, tipo_acceso: e.target.value })}
                  style={{ minWidth: 250 }}
                >
                  <option value="consignacion">Solo lo que le entregue</option>
                  <option value="total">Todo mi inventario</option>
                </select>
              </label>
            </div>

            <p style={{ margin: '0.7rem 0 0', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.55 }}>
              Con {nuevo.descuento}% de descuento, un producto de <strong>Bs 285</strong> se lo dejas en{' '}
              <strong>{fmt(285 * (1 - nuevo.descuento / 100))}</strong>. Lo que él le cobre al cliente es su
              negocio.
            </p>

            {nuevo.tipo_acceso === 'total' && (
              <p
                style={{
                  margin: '0.6rem 0 0',
                  fontSize: '0.85rem',
                  color: '#8a5a00',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8,
                  padding: '0.5rem 0.7rem',
                  lineHeight: 1.5,
                }}
              >
                Va a poder vender cualquier cosa de tu stock, aunque no la tenga en la mano. Úsalo con quien ya te
                genera confianza.
              </p>
            )}
          </div>

          <button className="btn-hero" type="submit" disabled={creando} style={{ marginTop: '1rem' }}>
            {creando ? 'Dando de alta...' : 'Dar de alta'}
          </button>
        </form>
      )}

      {/* Resumen */}
      {lista.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card destacada-ventas">
            <p className="stat-label">Vendieron este mes</p>
            <p className="stat-value">{fmt(totalVendido)}</p>
          </div>
          <div className="stat-card destacada-utilidad">
            <p className="stat-label">Tu ganancia</p>
            <p className="stat-value" style={{ color: '#22C55E' }}>
              {fmt(totalGanancia)}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Te deben</p>
            <p className="stat-value" style={{ color: totalDeuda > 0 ? '#F59E0B' : undefined }}>
              {fmt(totalDeuda)}
            </p>
          </div>
        </div>
      )}

      <h2>Tus promotores</h2>

      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <Handshake size={44} strokeWidth={1.4} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem' }}>
            Todavía no diste de alta a nadie. El promotor necesita tener su propia cuenta en MiContaBol antes.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {lista.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6ECF3',
                borderRadius: 14,
                padding: '1.1rem 1.25rem',
                opacity: p.activo ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                    {p.nombre}
                    {!p.activo && (
                      <span className="chip-estado" style={{ background: '#F7F9FC', color: '#A3AFBF', marginLeft: '0.5rem' }}>
                        Inactivo
                      </span>
                    )}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                    {p.descuento}% de descuento ·{' '}
                    {p.tipo_acceso === 'total' ? 've todo el inventario' : 'solo lo consignado'}
                    {p.zona && ` · ${p.zona}`}
                    {p.telefono && ` · ${p.telefono}`}
                  </p>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.7rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    <span>
                      Vendió: <strong>{fmt(p.vendido)}</strong>
                    </span>
                    <span style={{ color: '#22C55E' }}>
                      Te dejó: <strong>{fmt(p.ganancia_empresa)}</strong>
                    </span>
                    <span style={{ color: Number(p.debe) > 0 ? '#F59E0B' : '#A3AFBF' }}>
                      Debe: <strong>{fmt(p.debe)}</strong>
                    </span>
                    {Number(p.consignado) > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B' }}>
                        <Package size={14} strokeWidth={1.8} />
                        {p.consignado} en su poder
                      </span>
                    )}
                  </div>
                </div>

                {Number(p.debe) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCobrando(cobrando === p.id ? null : p.id)
                      setPago({ monto: String(p.debe), cuenta: '', nota: '' })
                    }}
                    style={{ alignSelf: 'flex-start', fontSize: '0.85rem' }}
                  >
                    Registrar pago
                  </button>
                )}
              </div>

              {cobrando === p.id && (
                <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label>
                      Cuánto te pagó
                      <br />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pago.monto}
                        onChange={(e) => setPago({ ...pago, monto: e.target.value })}
                        style={{ width: 130 }}
                      />
                    </label>

                    <label>
                      ¿Dónde entró?
                      <br />
                      <select
                        value={pago.cuenta}
                        onChange={(e) => setPago({ ...pago, cuenta: e.target.value })}
                        style={{ minWidth: 200 }}
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

                    <label>
                      Nota (opcional)
                      <br />
                      <input
                        value={pago.nota}
                        onChange={(e) => setPago({ ...pago, nota: e.target.value })}
                        style={{ width: 180 }}
                      />
                    </label>

                    <button
                      type="button"
                      className="btn-hero"
                      onClick={() => registrarPago(p)}
                      disabled={procesando || !pago.monto || !pago.cuenta}
                    >
                      {procesando ? 'Registrando...' : 'Confirmar'}
                    </button>
                    <button type="button" onClick={() => setCobrando(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
