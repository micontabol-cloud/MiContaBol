import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HelpCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const primerDiaMes = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const hoy = () => new Date().toISOString().slice(0, 10)

/* Una línea del reporte. Las "fuertes" son los subtotales. */
function Linea({ etiqueta, monto, margen, resta, fuerte, destacada, nota }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '1rem',
        padding: destacada ? '0.9rem 1rem' : '0.5rem 1rem',
        background: destacada ? 'rgba(34, 197, 94, 0.07)' : undefined,
        border: destacada ? '1px solid rgba(34, 197, 94, 0.3)' : undefined,
        borderRadius: destacada ? 12 : undefined,
        borderTop: fuerte && !destacada ? '1px solid #E6ECF3' : undefined,
        marginTop: fuerte && !destacada ? '0.35rem' : undefined,
      }}
    >
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontWeight: destacada ? 800 : fuerte ? 700 : 400,
            color: destacada ? '#15803D' : fuerte ? '#1F3A5F' : '#64748B',
            fontSize: destacada ? '1.02rem' : '0.95rem',
          }}
        >
          {resta && <span style={{ color: '#A3AFBF' }}>(−) </span>}
          {etiqueta}
        </span>
        {nota && (
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.15rem' }}>{nota}</span>
        )}
      </div>

      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span
          style={{
            fontWeight: destacada ? 800 : fuerte ? 700 : 500,
            fontSize: destacada ? '1.25rem' : fuerte ? '1.05rem' : '0.95rem',
            color: destacada
              ? Number(monto) >= 0 ? '#22C55E' : '#EF4444'
              : resta ? '#64748B' : '#1F3A5F',
          }}
        >
          {resta ? `(${fmt(Math.abs(monto))})` : fmt(monto)}
        </span>
        {margen !== undefined && margen !== null && (
          <span
            style={{
              display: 'block',
              fontSize: '0.78rem',
              color: destacada ? '#15803D' : '#A3AFBF',
              fontWeight: destacada ? 700 : 400,
            }}
          >
            {margen}% de tus ventas
          </span>
        )}
      </div>
    </div>
  )
}

export default function ResultadoOperativo() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [meses, setMeses] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [desde, setDesde] = useState(primerDiaMes())
  const [hasta, setHasta] = useState(hoy())
  const [explicando, setExplicando] = useState(false)
  const [verDetalle, setVerDetalle] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)

    const [{ data, error: err }, { data: hist }] = await Promise.all([
      supabase.rpc('estado_resultados_ebitda', {
        p_empresa_id: empresaId,
        p_desde: desde,
        p_hasta: hasta,
      }),
      supabase.rpc('ebitda_mensual', { p_empresa_id: empresaId, p_meses: 6 }),
    ])

    if (err) setError(err.message)
    setDatos(data)
    setMeses(hist || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  if (cargando) {
    return (
      <main style={{ maxWidth: 850, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!datos) {
    return (
      <main style={{ maxWidth: 850, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error || 'No se pudo cargar el reporte.'}</p>
      </main>
    )
  }

  const ebitda = Number(datos.ebitda)
  const neta = Number(datos.utilidad_neta)
  const sinMovimientos = Number(datos.ingresos_netos) === 0 && ebitda === 0

  // El hallazgo cambia según el resultado: no es lo mismo un negocio
  // que no vende que uno que vende bien pero lo ahogan las deudas.
  let hallazgo = null
  if (!sinMovimientos) {
    if (ebitda > 0 && neta < 0) {
      hallazgo = {
        color: '#F59E0B',
        fondo: 'rgba(245, 158, 11, 0.09)',
        borde: 'rgba(245, 158, 11, 0.35)',
        Icon: AlertTriangle,
        titulo: 'Tu negocio sí gana operando',
        texto: 'Pero las deudas, el desgaste de tus bienes y los impuestos se lo comen. El problema no es cómo vendes: es lo que viene después. Eso se arregla distinto.',
      }
    } else if (ebitda < 0) {
      hallazgo = {
        color: '#EF4444',
        fondo: 'rgba(239, 68, 68, 0.07)',
        borde: 'rgba(239, 68, 68, 0.3)',
        Icon: TrendingDown,
        titulo: 'Vendiendo no alcanzas a cubrir tus gastos',
        texto: 'Antes de mirar deudas o impuestos, hay que revisar dos cosas: tus precios y tus gastos fijos. Es ahí donde está el problema.',
      }
    } else {
      hallazgo = {
        color: '#22C55E',
        fondo: 'rgba(34, 197, 94, 0.07)',
        borde: 'rgba(34, 197, 94, 0.3)',
        Icon: TrendingUp,
        titulo: 'Tu negocio gana operando y también al final',
        texto: `De cada Bs 100 que vendes, te quedan Bs ${Number(datos.margen_neto).toFixed(0)} después de todo.`,
      }
    }
  }

  const maxMes = Math.max(...meses.map((m) => Math.abs(Number(m.ebitda) || 0)), 1)

  return (
    <main style={{ maxWidth: 850, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/reportes`}>&larr; Reportes</Link>
      </p>

      <h1>¿Tu negocio gana plata?</h1>
      <p style={{ color: '#64748B', marginTop: '-0.25rem' }}>
        Desglose de tus ventas hasta la ganancia final.
      </p>

      {/* Período */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', margin: '1.25rem 0' }}>
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
        <button type="button" onClick={cargar}>
          Ver
        </button>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {sinMovimientos ? (
        <p
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            padding: '1.5rem',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          No hay movimientos registrados en este período.
        </p>
      ) : (
        <>
          {/* El reporte en cascada */}
          <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 16,
              padding: '1.25rem 0.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Linea etiqueta="Ventas" monto={datos.ventas} />
            {Number(datos.descuentos) > 0 && (
              <Linea etiqueta="Descuentos que hiciste" monto={datos.descuentos} resta />
            )}
            <Linea etiqueta="Costo de lo que vendiste" monto={datos.costo_ventas} resta />
            <Linea
              etiqueta="Ganancia bruta"
              monto={datos.utilidad_bruta}
              margen={datos.margen_bruto}
              fuerte
            />

            <div style={{ height: '0.75rem' }} />

            <Linea
              etiqueta="Gastos de operación"
              monto={datos.gastos_operativos}
              resta
              nota="Sueldos, alquiler, servicios, publicidad"
            />
            {Number(datos.otros_ingresos) > 0 && (
              <Linea etiqueta="Otros ingresos" monto={datos.otros_ingresos} />
            )}

            <div style={{ padding: '0 0.5rem' }}>
              <Linea
                etiqueta="Ganancia de la operación (EBITDA)"
                monto={datos.ebitda}
                margen={datos.margen_ebitda}
                destacada
              />
            </div>

            <p
              style={{
                margin: '0.6rem 1rem 0',
                fontSize: '0.85rem',
                color: '#64748B',
                lineHeight: 1.5,
              }}
            >
              Lo que gana tu negocio vendiendo, antes de lo que viene después.{' '}
              <button
                type="button"
                onClick={() => setExplicando(!explicando)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1F3A5F',
                  padding: 0,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <HelpCircle size={14} strokeWidth={2} />
                ¿Qué significa esto?
              </button>
            </p>

            {explicando && (
              <div
                style={{
                  background: '#F7F9FC',
                  border: '1px solid #E6ECF3',
                  borderRadius: 12,
                  padding: '1rem 1.15rem',
                  margin: '0.75rem 1rem 0',
                  fontSize: '0.92rem',
                  lineHeight: 1.65,
                  color: '#253046',
                }}
              >
                <p style={{ margin: '0 0 0.7rem', fontWeight: 700, color: '#1F3A5F' }}>
                  ¿Por qué separar estos tres?
                </p>
                <p style={{ margin: '0 0 0.7rem' }}>
                  Imagina dos zapaterías idénticas: mismas ventas, mismos costos. Una compró su local; la otra lo
                  alquila y pidió un préstamo.
                </p>
                <p style={{ margin: '0 0 0.7rem' }}>
                  La segunda va a mostrar menos ganancia final — pero no porque venda peor, sino por cómo se
                  financió.
                </p>
                <p style={{ margin: '0 0 0.7rem' }}>
                  La <strong>ganancia de la operación</strong> deja fuera esas tres cosas para responder una sola
                  pregunta: <strong>¿el negocio, vendiendo, gana plata?</strong>
                </p>
                <p style={{ margin: 0, paddingTop: '0.7rem', borderTop: '1px solid #E6ECF3' }}>
                  Si este número es positivo pero tu ganancia final es negativa, el problema no es tu negocio: son
                  tus deudas o tus impuestos. Y eso se arregla distinto.
                </p>
              </div>
            )}

            <div style={{ height: '1rem' }} />

            <Linea
              etiqueta="Desgaste de tus bienes"
              monto={datos.depreciacion}
              resta
              nota="Depreciación: no sale plata, pero tus bienes valen menos"
            />
            <Linea etiqueta="Intereses y gastos bancarios" monto={datos.gastos_financieros} resta />
            <Linea etiqueta="Impuestos" monto={datos.impuestos} resta />

            <Linea
              etiqueta="Ganancia final"
              monto={datos.utilidad_neta}
              margen={datos.margen_neto}
              fuerte
            />
          </section>

          {/* Hallazgo */}
          {hallazgo && (
            <div
              style={{
                background: hallazgo.fondo,
                border: `1px solid ${hallazgo.borde}`,
                borderRadius: 14,
                padding: '1.1rem 1.25rem',
                marginTop: '1.25rem',
                display: 'flex',
                gap: '0.9rem',
                alignItems: 'flex-start',
              }}
            >
              <hallazgo.Icon size={22} strokeWidth={1.9} style={{ color: hallazgo.color, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>{hallazgo.titulo}</p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.93rem', color: '#64748B', lineHeight: 1.6 }}>
                  {hallazgo.texto}
                </p>
              </div>
            </div>
          )}

          {/* Detalle de gastos operativos */}
          {datos.detalle_operativos?.length > 0 && (
            <section style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setVerDetalle(!verDetalle)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1F3A5F',
                  padding: 0,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                {verDetalle ? 'Ocultar' : 'Ver'} en qué se fueron tus gastos de operación
              </button>

              {verDetalle && (
                <ul className="panel-lista" style={{ marginTop: '0.75rem' }}>
                  {datos.detalle_operativos.map((g, i) => (
                    <li key={i}>
                      <span>{g.cuenta}</span>
                      <span style={{ fontWeight: 600 }}>{fmt(g.monto)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {/* Evolución */}
      {meses.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Cómo viene la operación</h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '-0.4rem' }}>
            Últimos 6 meses. Lo que importa es la tendencia, no un mes suelto.
          </p>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 16,
              padding: '1.25rem',
              marginTop: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 130 }}>
              {meses.map((m) => {
                const v = Number(m.ebitda) || 0
                const alto = Math.max(4, (Math.abs(v) / maxMes) * 92)
                return (
                  <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: v >= 0 ? '#22C55E' : '#EF4444',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${alto}px`,
                        background: v >= 0 ? '#22C55E' : '#EF4444',
                        opacity: 0.85,
                        borderRadius: '5px 5px 0 0',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>{m.etiqueta}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.85rem', marginTop: '1.75rem', lineHeight: 1.55 }}>
        Este reporte agrupa tus cuentas de gasto automáticamente. Si alguna quedó en el grupo equivocado, tu
        contador puede ajustarla desde el plan de cuentas.
      </p>
    </main>
  )
}
