import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CalendarClock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(0)}`

// Solo trimestral y anual: el mensual no tiene precio cargado
const CICLOS = {
  trimestral: { label: 'Trimestral', sufijo: '/trimestre', meses: 3, campo: 'precio_trimestral' },
  anual: { label: 'Anual', sufijo: '/año', meses: 12, campo: 'precio_anual' },
}

const CARACTERISTICAS = [
  { clave: 'base', label: 'Ventas, compras, clientes y catálogo' },
  { clave: 'reportes_contables', label: 'Reportes contables formales' },
  { clave: 'exportar_archivos', label: 'Exportar a PDF y Excel' },
  { clave: 'lotes_vencimiento', label: 'Lotes y vencimientos' },
  { clave: 'codigo_barras', label: 'Código de barras y conteo físico' },
  { clave: 'importar_excel', label: 'Importar desde Excel' },
]

const hora12 = (h) => {
  if (h === 12) return '12:00 del mediodía'
  if (h < 12) return `${h}:00 de la mañana`
  return `${h - 12}:00 de la tarde`
}

const fechaLarga = (iso) => {
  const [a, m, d] = iso.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${Number(d)} de ${meses[Number(m) - 1]}`
}


// Si paga hoy, ¿hasta cuándo le alcanza? Los días que le quedan
// de prueba no se pierden: el trimestre arranca desde ahí.
function fechaSiPagaHoy(diasRestantes, meses) {
  const d = new Date()
  if (diasRestantes > 0) d.setDate(d.getDate() + diasRestantes)
  d.setMonth(d.getMonth() + meses)

  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const meses_ = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${meses_[d.getMonth()]} de ${d.getFullYear()}`
}

export default function Suscripcion() {
  const { session } = useAuth()
  const [sus, setSus] = useState(null)
  const [planes, setPlanes] = useState([])
  const [config, setConfig] = useState(null)
  const [solicitud, setSolicitud] = useState(null)
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ciclo, setCiclo] = useState('trimestral')

  const [planElegido, setPlanElegido] = useState(null)
  const [qrPlan, setQrPlan] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  // Agenda
  const [disponibles, setDisponibles] = useState([])
  const [fechaSesion, setFechaSesion] = useState('')
  const [horaSesion, setHoraSesion] = useState('')
  const [telefono, setTelefono] = useState('')

  async function cargar() {
    const [{ data: s }, { data: p }, { data: c }, { data: sol }, { data: ses }] = await Promise.all([
      supabase.rpc('mi_suscripcion'),
      supabase.from('planes').select('*').eq('visible', true).order('orden'),
      supabase.from('configuracion_plataforma').select('*').eq('id', 1).single(),
      supabase.rpc('mi_solicitud_pendiente'),
      supabase.rpc('mi_sesion_arranque'),
    ])
    setSus(s)
    setPlanes(p || [])
    setConfig(c)
    setSolicitud(sol)
    setSesion(ses)
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
    setFechaSesion('')
    setHoraSesion('')

    const { data } = await supabase.rpc('qr_para_plan', {
      p_plan_codigo: plan.codigo,
      p_ciclo: ciclo,
    })
    setQrPlan(data)

    // Los horarios solo hacen falta si el plan incluye la sesión
    if (plan.incluye_kickoff) {
      const { data: h } = await supabase.rpc('horarios_disponibles', { p_dias: 21 })
      setDisponibles(h || [])
    }

    setTimeout(() => document.getElementById('como-pagar')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

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

    if (planElegido.incluye_kickoff) {
      if (!telefono.trim() || telefono.replace(/\D/g, '').length < 7) {
        setError('Necesitamos tu WhatsApp para confirmar la reunión.')
        return
      }
      if (!fechaSesion || !horaSesion) {
        setError('Elige el día y la hora de tu sesión de arranque.')
        return
      }
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
      p_telefono: telefono || null,
      p_sesion_fecha: planElegido.incluye_kickoff ? fechaSesion : null,
      p_sesion_hora: planElegido.incluye_kickoff ? Number(horaSesion) : null,
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
    setFechaSesion('')
    setHoraSesion('')
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

  const horasDelDia = disponibles.find((d) => d.fecha === fechaSesion)?.horas || []

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

      {/* Sesión ya agendada */}
      {sesion && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: sesion.estado === 'confirmada' ? 'rgba(34, 197, 94, 0.07)' : 'rgba(59, 130, 246, 0.07)',
            border: `1px solid ${sesion.estado === 'confirmada' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
            borderRadius: 16,
            padding: '1.15rem 1.3rem',
            marginTop: '1rem',
          }}
        >
          <CalendarClock
            size={26}
            strokeWidth={1.8}
            style={{ color: sesion.estado === 'confirmada' ? '#22C55E' : '#3B82F6', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
              {sesion.estado === 'confirmada'
                ? 'Tu sesión de arranque está confirmada'
                : 'Tu sesión queda por confirmar'}
            </p>
            <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.92rem' }}>
              {fechaLarga(sesion.fecha)} a las {hora12(sesion.hora)}.{' '}
              {sesion.estado === 'confirmada'
                ? 'Te escribimos al WhatsApp para coordinar.'
                : 'La confirmamos apenas verifiquemos tu pago.'}
            </p>
          </div>
        </div>
      )}

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
                padding: '0.45rem 1.1rem',
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

      {/* Por qué Negocio — cambia según dónde esté el cliente */}
      {(() => {
        const planNegocio = planes.find((p) => p.codigo === 'negocio')
        const yaEsNegocio = sus?.plan_codigo === 'negocio'
        const meses = CICLOS[ciclo].meses
        const diasQueQuedan = enPrueba && dias > 0 ? dias : 0
        const hasta = fechaSiPagaHoy(diasQueQuedan, meses)

        // Si ya paga Negocio y tiene su sesión, no hay nada que
        // recomendarle: sería ruido.
        if (yaEsNegocio && !enPrueba && !vencida) return null

        return (
          <div
            style={{
              background: 'rgba(242, 85, 90, 0.05)',
              border: '1px solid rgba(242, 85, 90, 0.25)',
              borderRadius: 14,
              padding: '1.15rem 1.3rem',
              marginTop: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
              <CalendarClock size={22} strokeWidth={1.8} style={{ color: '#F2555A', flexShrink: 0, marginTop: 3 }} />

              <div style={{ flex: 1, minWidth: 240 }}>
                {enPrueba ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F', fontSize: '1rem' }}>
                      Estás probando el plan Negocio, pero la sesión de arranque no viene incluida
                    </p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.94rem', lineHeight: 1.6, color: '#253046' }}>
                      Tienes todas las funciones gratis por 30 días. Lo único que no entra en la prueba es la{' '}
                      <strong>hora de arranque con un asesor</strong>: para agendarla hay que pagar el plan.
                    </p>

                    {diasQueQuedan > 0 && (
                      <p
                        style={{
                          margin: '0.85rem 0 0',
                          padding: '0.75rem 0.9rem',
                          background: '#FFFFFF',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: 10,
                          fontSize: '0.92rem',
                          lineHeight: 1.6,
                          color: '#253046',
                        }}
                      >
                        <strong style={{ color: '#15803D' }}>No pierdes tus días de prueba.</strong> Si pagas hoy,
                        se suman los <strong>{diasQueQuedan} días</strong> que te quedan más los{' '}
                        <strong>{meses === 12 ? '365' : '90'} días</strong> del plan{' '}
                        {CICLOS[ciclo].label.toLowerCase()}: tu suscripción llegaría hasta el{' '}
                        <strong>{hasta}</strong>.
                      </p>
                    )}
                  </>
                ) : vencida ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F', fontSize: '1rem' }}>
                      Renueva y agenda tu sesión de arranque
                    </p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.94rem', lineHeight: 1.6, color: '#253046' }}>
                      Con el plan Negocio nos sentamos una hora contigo: cargamos tus productos, tus saldos y quién
                      te debe.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F', fontSize: '1rem' }}>
                      Con el plan Negocio nos sentamos una hora contigo
                    </p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.94rem', lineHeight: 1.6, color: '#253046' }}>
                      Cargamos tus productos, tus saldos y quién te debe, y haces tu primera venta con nosotros al
                      lado. Sales con tu negocio adentro, no con una app vacía.
                    </p>
                  </>
                )}

                {planNegocio && !sesion && (
                  <button
                    className="btn-hero"
                    type="button"
                    onClick={() => elegirPlan(planNegocio)}
                    style={{ marginTop: '1rem' }}
                  >
                    Pagar y agendar mi arranque
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="panel-cards" style={{ marginTop: '1.25rem' }}>
        {planes.map((p) => {
          const actual = p.codigo === sus?.plan_codigo && !vencida
          const recomendado = p.codigo === 'negocio'
          const precio = precioDe(p, ciclo)
          const meses = CICLOS[ciclo].meses

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

              <p style={{ margin: '0 0 0.2rem' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1F3A5F' }}>{fmt(precio)}</span>
                <span style={{ color: '#64748B', fontSize: '0.9rem' }}>{CICLOS[ciclo].sufijo}</span>
              </p>
              <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: '#22C55E', fontWeight: 600 }}>
                Equivale a {fmt(precio / meses)}/mes
              </p>

              {/* La sesión primero: es lo que diferencia a Negocio */}
              {p.incluye_kickoff && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.07)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: 10,
                    padding: '0.6rem 0.75rem',
                    marginBottom: '0.9rem',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#15803D',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <CalendarClock size={15} strokeWidth={2} />
                    1 hora de arranque con un asesor
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    Agendas tu horario al pagar
                  </p>
                </div>
              )}

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
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

                {CARACTERISTICAS.map((c) => {
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
                    style={recomendado ? { width: '100%' } : undefined}
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
                  Todavía no hay QR para este plan. Paga por transferencia o escríbenos por WhatsApp.
                </div>
              )}

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

            <form onSubmit={enviarComprobante} style={{ flex: 1, minWidth: 280 }}>
              <p style={{ margin: '0 0 1rem', lineHeight: 1.55 }}>
                Escanea el QR con la app de tu banco, paga, y sube aquí la captura o foto del comprobante.
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

                {/* Agendar la sesión: solo en planes que la incluyen */}
                {planElegido.incluye_kickoff && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 12,
                      padding: '1rem 1.15rem',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 0.3rem',
                        fontWeight: 700,
                        color: '#1F3A5F',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <CalendarClock size={18} strokeWidth={1.9} style={{ color: '#22C55E' }} />
                      Agenda tu sesión de arranque
                    </p>
                    <p style={{ margin: '0 0 0.9rem', fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
                      Una hora con un asesor para cargar tus productos y hacer tu primera venta juntos.
                    </p>

                    <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                      <label style={{ flex: 1, minWidth: 155 }}>
                        Día
                        <br />
                        <select
                          value={fechaSesion}
                          onChange={(e) => {
                            setFechaSesion(e.target.value)
                            setHoraSesion('')
                          }}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Elige un día --</option>
                          {disponibles.map((d) => (
                            <option key={d.fecha} value={d.fecha}>
                              {d.dia_nombre} {fechaLarga(d.fecha)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ flex: 1, minWidth: 140 }}>
                        Hora
                        <br />
                        <select
                          value={horaSesion}
                          onChange={(e) => setHoraSesion(e.target.value)}
                          disabled={!fechaSesion}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Elige la hora --</option>
                          {horasDelDia.map((h) => (
                            <option key={h} value={h}>
                              {h}:00 a {h + 1}:00
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label style={{ display: 'block', marginTop: '0.75rem' }}>
                      Tu WhatsApp
                      <br />
                      <input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="70000000"
                        style={{ width: '100%' }}
                      />
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
                        Te escribimos por aquí para confirmar la reunión.
                      </span>
                    </label>

                    {fechaSesion && horaSesion && (
                      <p
                        style={{
                          margin: '0.85rem 0 0',
                          padding: '0.7rem 0.85rem',
                          background: 'rgba(59, 130, 246, 0.07)',
                          border: '1px solid rgba(59, 130, 246, 0.28)',
                          borderRadius: 10,
                          fontSize: '0.86rem',
                          color: '#1e40af',
                          lineHeight: 1.55,
                        }}
                      >
                        Tu reunión queda reservada para el{' '}
                        <strong>
                          {fechaLarga(fechaSesion)} a las {hora12(Number(horaSesion))}
                        </strong>
                        . La confirmamos apenas verifiquemos tu pago, y te escribimos al WhatsApp.
                      </p>
                    )}
                  </div>
                )}

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
