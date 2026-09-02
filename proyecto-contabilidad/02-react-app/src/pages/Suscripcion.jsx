import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(0)}`

const CICLOS = {
  mensual: { label: 'Mensual', sufijo: '/mes', meses: 1, campo: 'precio_mensual' },
  trimestral: { label: 'Trimestral', sufijo: '/trimestre', meses: 3, campo: 'precio_trimestral' },
  anual: { label: 'Anual', sufijo: '/año', meses: 12, campo: 'precio_anual' },
}

const CARACTERISTICAS = [
  { clave: 'productos', label: 'Productos' },
  { clave: 'limite_negocios', label: 'Negocios' },
  { clave: 'limite_usuarios', label: 'Usuarios' },
  { clave: 'base', label: 'Ventas, compras, clientes y catálogo' },
  { clave: 'reportes_contables', label: 'Reportes contables formales' },
  { clave: 'exportar_archivos', label: 'Exportar a PDF y Excel' },
  { clave: 'lotes_vencimiento', label: 'Lotes y vencimientos' },
  { clave: 'codigo_barras', label: 'Código de barras y conteo físico' },
  { clave: 'importar_excel', label: 'Importar desde Excel' },
]

export default function Suscripcion() {
  const { session } = useAuth()
  const [sus, setSus] = useState(null)
  const [planes, setPlanes] = useState([])
  const [config, setConfig] = useState(null)
  const [solicitud, setSolicitud] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ciclo, setCiclo] = useState('trimestral')

  const [planElegido, setPlanElegido] = useState(null)
  // El QR del plan y ciclo elegidos. Si no hay uno específico,
  // la función devuelve el general del ciclo.
  const [qrPlan, setQrPlan] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function cargar() {
    const [{ data: s }, { data: p }, { data: c }, { data: sol }] = await Promise.all([
      supabase.rpc('mi_suscripcion'),
      supabase.from('planes').select('*').eq('visible', true).order('orden'),
      supabase.from('configuracion_plataforma').select('*').eq('id', 1).single(),
      supabase.rpc('mi_solicitud_pendiente'),
    ])
    setSus(s)
    setPlanes(p || [])
    setConfig(c)
    setSolicitud(sol)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const precioDe = (plan, c) => plan?.[CICLOS[c]?.campo] ?? null

  async function elegirPlan(plan) {
    setPlanElegido(plan)
    setError(null)
    setQrPlan(null)

    const { data } = await supabase.rpc('qr_para_plan', {
      p_plan_codigo: plan.codigo,
      p_ciclo: ciclo,
    })
    setQrPlan(data)

    setTimeout(
      () => document.getElementById('como-pagar')?.scrollIntoView({ behavior: 'smooth' }),
      50
    )
  }

  // Al cambiar de ciclo con un plan ya elegido, el QR debe
  // cambiar también: el de trimestral no sirve para pagar el anual.
  async function cambiarCiclo(nuevo) {
    setCiclo(nuevo)

    if (planElegido) {
      setQrPlan(null)
      const { data } = await supabase.rpc('qr_para_plan', {
        p_plan_codigo: planElegido.codigo,
        p_ciclo: nuevo,
      })
      setQrPlan(data)
    }
  }

  async function enviarComprobante(e) {
    e.preventDefault()
    if (!archivo) {
      setError('Sube la foto o captura de tu comprobante.')
      return
    }

    setError(null)
    setEnviando(true)

    const ext = archivo.name.split('.').pop()
    const ruta = `${session.user.id}/comprobante-${Date.now()}.${ext}`

    const { error: errSubida } = await supabase.storage.from('comprobantes').upload(ruta, archivo)

    if (errSubida) {
      setEnviando(false)
      setError(`No se pudo subir el comprobante: ${errSubida.message}`)
      return
    }

    const { error: errRpc } = await supabase.rpc('crear_solicitud_pago', {
      p_plan_codigo: planElegido.codigo,
      p_ciclo: ciclo,
      p_comprobante_path: ruta,
      p_referencia: referencia || null,
      p_nota: nota || null,
    })

    setEnviando(false)

    if (errRpc) {
      setError(errRpc.message)
      return
    }

    setPlanElegido(null)
    setQrPlan(null)
    setArchivo(null)
    setReferencia('')
    setNota('')
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 900, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  const enPrueba = sus?.estado === 'prueba'
  const vencida = sus?.estado === 'vencida'
  const dias = sus?.dias_restantes

  return (
    <main style={{ maxWidth: 980, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>

      {/* Estado actual */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: vencida ? 'rgba(239, 68, 68, 0.06)' : '#F7F9FC',
          border: `1px solid ${vencida ? 'rgba(239, 68, 68, 0.3)' : '#E6ECF3'}`,
          borderRadius: 16,
          padding: '1.25rem 1.4rem',
        }}
      >
        <BoliMascot pose={vencida ? 'triste' : enPrueba ? 'consejo' : 'exito'} size={72} />
        <div style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            {vencida
              ? 'Tu suscripción venció'
              : enPrueba
              ? sus.prueba_iniciada
                ? 'Estás probando el plan Negocio'
                : 'Tu mes gratis empieza con tu primera venta'
              : `Tu plan: ${sus.plan_nombre}`}
          </h1>

          <p style={{ color: '#64748B', margin: '0.4rem 0 0' }}>
            {vencida ? (
              <>
                Puedes seguir viendo toda tu información, pero para registrar ventas, compras o productos nuevos
                necesitas renovar.
              </>
            ) : enPrueba && !sus.prueba_iniciada ? (
              <>Carga tus productos con calma. El mes empieza a correr recién cuando registres tu primera venta.</>
            ) : dias !== null && dias >= 0 ? (
              <>
                Te {dias === 1 ? 'queda' : 'quedan'} <strong>{dias}</strong> {dias === 1 ? 'día' : 'días'}
                {sus.vence_el && ` (hasta el ${sus.vence_el})`}.
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Planes */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginTop: '2.5rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Elige tu plan</h2>
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: '#F7F9FC',
            padding: '0.25rem',
            borderRadius: 999,
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(CICLOS).map(([valor, c]) => (
            <button
              key={valor}
              type="button"
              onClick={() => cambiarCiclo(valor)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '0.45rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: ciclo === valor ? '#FFFFFF' : 'transparent',
                color: ciclo === valor ? '#1F3A5F' : '#64748B',
                boxShadow: ciclo === valor ? '0 1px 3px rgba(31,58,95,0.12)' : 'none',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-cards" style={{ marginTop: '1.25rem' }}>
        {planes.map((p) => {
          const actual = p.codigo === sus?.plan_codigo && !vencida
          const recomendado = p.codigo === 'negocio'
          const precio = precioDe(p, ciclo)
          const meses = CICLOS[ciclo].meses
          const disponible = precio !== null && Number(precio) > 0

          return (
            <section
              key={p.codigo}
              className="panel-card"
              style={{
                border: recomendado ? '2px solid #F2555A' : undefined,
                position: 'relative',
              }}
            >
              {recomendado && (
                <span
                  style={{
                    position: 'absolute',
                    top: -11,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#F2555A',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.7rem',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  El más elegido
                </span>
              )}

              <h3 style={{ marginTop: recomendado ? '0.4rem' : 0 }}>{p.nombre}</h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 0.75rem', minHeight: 40 }}>
                {p.descripcion}
              </p>

              {disponible ? (
                <>
                  <p style={{ margin: '0 0 0.2rem' }}>
                    <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3A5F' }}>{fmt(precio)}</span>
                    <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{CICLOS[ciclo].sufijo}</span>
                  </p>
                  {meses > 1 && (
                    <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: '#22C55E', fontWeight: 600 }}>
                      Equivale a {fmt(precio / meses)}/mes
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin: '0 0 0.9rem', color: '#A3AFBF', fontSize: '0.9rem' }}>
                  No disponible en {CICLOS[ciclo].label.toLowerCase()}
                </p>
              )}

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1rem 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                }}
              >
                <li style={{ fontSize: '0.88rem' }}>
                  <strong>{p.limite_productos ? `${p.limite_productos} productos` : 'Productos ilimitados'}</strong>
                  {p.limite_productos && <span style={{ color: '#A3AFBF' }}> (tallas y colores cuentan)</span>}
                </li>
                <li style={{ fontSize: '0.88rem' }}>
                  {p.limite_negocios === 1 ? '1 negocio' : `Hasta ${p.limite_negocios} negocios`} ·{' '}
                  {p.limite_usuarios} usuarios
                </li>

                {CARACTERISTICAS.filter(
                  (c) => !['productos', 'limite_negocios', 'limite_usuarios'].includes(c.clave)
                ).map((c) => {
                  const incluido = c.clave === 'base' ? true : p[c.clave]
                  return (
                    <li
                      key={c.clave}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                        fontSize: '0.88rem',
                        color: incluido ? '#253046' : '#C4CCD8',
                      }}
                    >
                      <span style={{ color: incluido ? '#22C55E' : '#E6ECF3', flexShrink: 0 }}>
                        {incluido ? <Check size={15} strokeWidth={2.5} /> : '—'}
                      </span>
                      {c.label}
                    </li>
                  )
                })}

                {p.incluye_kickoff && (
                  <li
                    style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}
                  >
                    <span style={{ color: '#22C55E' }}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    Sesión de arranque con un asesor
                  </li>
                )}
                {p.asesorias_mes > 0 && (
                  <li
                    style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}
                  >
                    <span style={{ color: '#22C55E' }}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    {p.asesorias_mes} {p.asesorias_mes === 1 ? 'asesoría' : 'asesorías'} al mes
                  </li>
                )}
                {p.soporte && (
                  <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <span style={{ color: '#22C55E' }}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    Soporte por {p.soporte}
                  </li>
                )}
              </ul>

              <div style={{ marginTop: '1.1rem' }}>
                {actual ? (
                  <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.9rem' }}>✓ Tu plan actual</span>
                ) : (
                  <button
                    className={recomendado ? 'btn-hero' : undefined}
                    type="button"
                    onClick={() => elegirPlan(p)}
                    disabled={!disponible}
                  >
                    Elegir {p.nombre}
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Estado del pago enviado */}
      {solicitud?.estado === 'pendiente' && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'rgba(59, 130, 246, 0.07)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 16,
            padding: '1.15rem 1.3rem',
            marginTop: '2rem',
          }}
        >
          <BoliMascot pose="revisando" size={62} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e40af' }}>Estamos revisando tu pago</p>
            <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.92rem' }}>
              Recibimos tu comprobante del plan <strong>{solicitud.plan_nombre}</strong> {solicitud.ciclo} por{' '}
              {fmt(solicitud.monto)}. Apenas confirmemos que llegó a la cuenta, activamos tu membresía. Suele tomar
              unas horas.
            </p>
          </div>
        </div>
      )}

      {solicitud?.estado === 'rechazada' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.07)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 16,
            padding: '1.15rem 1.3rem',
            marginTop: '2rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: '#B91C1C' }}>No pudimos confirmar tu último pago</p>
          <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.92rem' }}>{solicitud.nota_admin}</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Puedes volver a enviarlo eligiendo tu plan arriba.
          </p>
        </div>
      )}

      {/* Pagar */}
      {planElegido && solicitud?.estado !== 'pendiente' && (
        <section id="como-pagar" style={{ marginTop: '2.5rem' }}>
          <h2>Paga tu plan {planElegido.nombre}</h2>

          <div
            style={{
              background: '#F7F9FC',
              border: '1px solid #E6ECF3',
              borderRadius: 16,
              padding: '1.4rem',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {/* QR del plan y ciclo elegidos */}
            <div style={{ textAlign: 'center' }}>
              {qrPlan ? (
                <img
                  src={qrPlan}
                  alt={`QR para pagar el plan ${planElegido.nombre}`}
                  style={{
                    width: 230,
                    height: 230,
                    objectFit: 'contain',
                    background: '#FFFFFF',
                    border: '1px solid #E6ECF3',
                    borderRadius: 14,
                    padding: '0.5rem',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 230,
                    height: 230,
                    borderRadius: 14,
                    background: '#FFFFFF',
                    border: '1px dashed #E6ECF3',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#A3AFBF',
                    fontSize: '0.85rem',
                    padding: '1rem',
                    lineHeight: 1.5,
                  }}
                >
                  Todavía no hay QR para este plan. Puedes pagar por transferencia o escribirnos por WhatsApp.
                </div>
              )}

              {/* El monto en grande: aunque el QR ya lo lleve, verlo
                  escrito evita que alguien pague de menos. */}
              <p style={{ margin: '0.75rem 0 0', fontWeight: 800, fontSize: '1.35rem', color: '#1F3A5F' }}>
                {fmt(precioDe(planElegido, ciclo))}
              </p>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
                Plan {planElegido.nombre} · {CICLOS[ciclo].label}
              </p>

              {config?.banco_nombre && (
                <div style={{ marginTop: '0.9rem', fontSize: '0.82rem', color: '#64748B', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>O por transferencia:</p>
                  <p style={{ margin: 0 }}>{config.banco_nombre}</p>
                  {config.banco_cuenta && <p style={{ margin: 0 }}>Cuenta: {config.banco_cuenta}</p>}
                  {config.banco_titular && <p style={{ margin: 0 }}>A nombre de: {config.banco_titular}</p>}
                  {config.banco_nit && <p style={{ margin: 0 }}>NIT/CI: {config.banco_nit}</p>}
                </div>
              )}
            </div>

            {/* Comprobante */}
            <form onSubmit={enviarComprobante} style={{ flex: 1, minWidth: 260 }}>
              <p style={{ margin: '0 0 1rem', lineHeight: 1.55 }}>
                Escanea el QR con la app de tu banco, paga, y sube aquí la captura o foto del comprobante. Revisamos
                que haya llegado y activamos tu plan el mismo día.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <label>
                  Comprobante de pago
                  <br />
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  />
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
                    Foto, captura o PDF. Solo lo vemos nosotros.
                  </span>
                </label>

                <label>
                  Número de transacción (opcional)
                  <br />
                  <input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Si tu comprobante lo muestra"
                    style={{ width: '100%' }}
                  />
                </label>

                <label>
                  Algo que debamos saber (opcional)
                  <br />
                  <input value={nota} onChange={(e) => setNota(e.target.value)} style={{ width: '100%' }} />
                </label>

                {error && <p style={{ color: '#EF4444', margin: 0 }}>{error}</p>}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn-hero" type="submit" disabled={enviando}>
                    {enviando ? 'Enviando...' : 'Enviar comprobante'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanElegido(null)
                      setQrPlan(null)
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {config?.whatsapp_soporte && (
        <p style={{ marginTop: '1.5rem', color: '#64748B', fontSize: '0.9rem' }}>
          ¿Dudas con el pago?{' '}
          <a
            href={`https://wa.me/${String(config.whatsapp_soporte).replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      )}
    </main>
  )
}
