import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Handshake, Package, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Promotores() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [cupo, setCupo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    zona: '',
    descuento: 30,
    tipo_acceso: 'consignacion',
  })
  const [creando, setCreando] = useState(false)
  const [credenciales, setCredenciales] = useState(null)

  const [cobrando, setCobrando] = useState(null)
  const [pago, setPago] = useState({ monto: '', cuenta: '', nota: '' })
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data, error: err }, { data: ctas }, { data: cp }] = await Promise.all([
      supabase.rpc('resumen_promotores', { p_empresa_id: empresaId }),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'activo')
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
      supabase.rpc('cupo_usuarios', { p_empresa_id: empresaId }),
    ])
    if (err) setError(err.message)
    setDatos(data)
    setCuentas(ctas || [])
    setCupo(cp)
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

    const { data, error } = await supabase.rpc('crear_promotor', {
      p_empresa_id: empresaId,
      p_email: nuevo.email.trim().toLowerCase(),
      p_password: nuevo.password,
      p_nombre: nuevo.nombre.trim(),
      p_telefono: nuevo.telefono || null,
      p_zona: nuevo.zona || null,
      p_descuento: Number(nuevo.descuento),
      p_tipo_acceso: nuevo.tipo_acceso,
    })

    setCreando(false)
    if (error) return setError(error.message)

    // Los datos de acceso quedan a la vista para poder copiarlos:
    // el dueño se los tiene que pasar por WhatsApp.
    setCredenciales(
      data?.cuenta_nueva
        ? { email: nuevo.email.trim().toLowerCase(), password: nuevo.password, nombre: nuevo.nombre }
        : null
    )

    setNuevo({
      email: '',
      password: '',
      nombre: '',
      telefono: '',
      zona: '',
      descuento: 30,
      tipo_acceso: 'consignacion',
    })
    setMostrarForm(false)
    if (!data?.cuenta_nueva) {
      setAviso('Ese correo ya tenía cuenta. Se le dio acceso como promotor.')
      setTimeout(() => setAviso(null), 6000)
    }
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

      {/* Datos de acceso recién creados */}
      {credenciales && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.07)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 16,
            padding: '1.25rem 1.4rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: '#15803D' }}>
            Cuenta creada para {credenciales.nombre}
          </p>
          <p style={{ margin: '0.4rem 0 0.9rem', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55 }}>
            Pásale estos datos por WhatsApp. Al entrar puede cambiar la contraseña desde su perfil.
          </p>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 10,
              padding: '0.85rem 1rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.8,
            }}
          >
            <div>micontabol.com</div>
            <div>Correo: {credenciales.email}</div>
            <div>Contraseña: {credenciales.password}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-hero"
              onClick={() => {
                const texto = `Hola ${credenciales.nombre}, ya tienes tu acceso a MiContaBol:\n\nmicontabol.com\nCorreo: ${credenciales.email}\nContraseña: ${credenciales.password}\n\nEntra y cambia tu contraseña desde Mi perfil.`
                window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
              }}
            >
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  `micontabol.com\nCorreo: ${credenciales.email}\nContraseña: ${credenciales.password}`
                )
              }}
            >
              Copiar
            </button>
            <button type="button" onClick={() => setCredenciales(null)}>
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Cupo del plan */}
      {cupo && !cupo.hay_cupo && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 12,
            padding: '0.9rem 1.1rem',
            marginBottom: '1.25rem',
            fontSize: '0.92rem',
            color: '#8a5a00',
            lineHeight: 1.55,
          }}
        >
          <strong>Ya usaste los {cupo.limite} usuarios de tu plan {cupo.plan}.</strong> Para sumar más promotores
          necesitas cambiar de plan.
        </div>
      )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>Nuevo promotor</p>
            {cupo && (
              <span style={{ fontSize: '0.85rem', color: cupo.disponibles > 0 ? '#64748B' : '#EF4444' }}>
                {cupo.usados} de {cupo.limite} usuarios · plan {cupo.plan}
              </span>
            )}
          </div>

          <p style={{ margin: '0 0 0.9rem', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.55 }}>
            Le creas la cuenta aquí mismo. No necesita registrarse antes: le pasas el correo y la contraseña por
            WhatsApp y ya puede entrar.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label>
              Su correo
              <br />
              <input
                type="email"
                required
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                placeholder="promotor@correo.com"
                style={{ width: 230 }}
              />
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
                Con esto entra al sistema.
              </span>
            </label>

            <label>
              Contraseña temporal
              <br />
              <input
                required
                minLength={6}
                value={nuevo.password}
                onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
                placeholder="mínimo 6 caracteres"
                style={{ width: 190 }}
              />
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
                Se la pasas por WhatsApp.
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

                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                  <Link to={`/empresas/${empresaId}/promotores/${p.id}/mercaderia`}>
                    <button type="button" style={{ fontSize: '0.85rem' }}>
                      Mercadería
                    </button>
                  </Link>

                  {Number(p.debe) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCobrando(cobrando === p.id ? null : p.id)
                        setPago({ monto: String(p.debe), cuenta: '', nota: '' })
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Registrar pago
                    </button>
                  )}
                </div>
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
