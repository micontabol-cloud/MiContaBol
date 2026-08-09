import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(0)}`

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
  const [sus, setSus] = useState(null)
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ciclo, setCiclo] = useState('trimestral')

  useEffect(() => {
    async function cargar() {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.rpc('mi_suscripcion'),
        supabase.from('planes').select('*').eq('visible', true).order('orden'),
      ])
      setSus(s)
      setPlanes(p || [])
      setCargando(false)
    }
    cargar()
  }, [])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2.5rem' }}>
        <h2 style={{ margin: 0 }}>Elige tu plan</h2>
        <div style={{ display: 'flex', gap: '0.4rem', background: '#F7F9FC', padding: '0.25rem', borderRadius: 999, flexWrap: 'wrap' }}>
          {[
            { valor: 'mensual', label: 'Mensual' },
            { valor: 'trimestral', label: 'Trimestral' },
            { valor: 'anual', label: 'Anual' },
          ].map((c) => (
            <button
              key={c.valor}
              type="button"
              onClick={() => setCiclo(c.valor)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '0.45rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: ciclo === c.valor ? '#FFFFFF' : 'transparent',
                color: ciclo === c.valor ? '#1F3A5F' : '#64748B',
                boxShadow: ciclo === c.valor ? '0 1px 3px rgba(31,58,95,0.12)' : 'none',
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
          const precio =
            ciclo === 'mensual' ? p.precio_mensual : ciclo === 'trimestral' ? p.precio_trimestral : p.precio_anual
          const meses = ciclo === 'mensual' ? 1 : ciclo === 'trimestral' ? 3 : 12

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
                <span style={{ color: '#64748B', fontSize: '0.9rem' }}>
                  {ciclo === 'mensual' ? ' /mes' : ciclo === 'trimestral' ? ' /trimestre' : ' /año'}
                </span>
              </p>
              {meses > 1 && (
                <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: '#22C55E', fontWeight: 600 }}>
                  Equivale a {fmt(precio / meses)}/mes
                </p>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li style={{ fontSize: '0.88rem' }}>
                  <strong>{p.limite_productos ? `${p.limite_productos} productos` : 'Productos ilimitados'}</strong>
                  {p.limite_productos && (
                    <span style={{ color: '#A3AFBF' }}> (tallas y colores cuentan)</span>
                  )}
                </li>
                <li style={{ fontSize: '0.88rem' }}>
                  {p.limite_negocios === 1 ? '1 negocio' : `Hasta ${p.limite_negocios} negocios`} ·{' '}
                  {p.limite_usuarios} usuarios
                </li>

                {CARACTERISTICAS.filter((c) => !['productos', 'limite_negocios', 'limite_usuarios'].includes(c.clave)).map(
                  (c) => {
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
                  }
                )}

                {p.incluye_kickoff && (
                  <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}>
                    <span style={{ color: '#22C55E' }}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    Sesión de arranque con un asesor
                  </li>
                )}
                {p.asesorias_mes > 0 && (
                  <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: '#1F3A5F' }}>
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
                  <a href="#como-pagar">
                    <button className={recomendado ? 'btn-hero' : undefined} type="button">
                      Elegir {p.nombre}
                    </button>
                  </a>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Cómo pagar */}
      <h2 id="como-pagar" style={{ marginTop: '2.5rem' }}>
        Cómo activar tu plan
      </h2>
      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          padding: '1.25rem 1.4rem',
        }}
      >
        <p style={{ margin: '0 0 1rem', lineHeight: 1.55 }}>
          Escríbenos por WhatsApp indicando qué plan quieres y si lo prefieres mensual o anual. Te enviamos el QR
          para pagar y activamos tu cuenta el mismo día.
        </p>

        <a
          href="https://wa.me/59170000000?text=Hola,%20quiero%20activar%20mi%20plan%20en%20MiContaBol"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="btn-hero btn-lg">Escribir por WhatsApp</button>
        </a>

        <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
          Aceptamos QR y transferencia bancaria. Puedes cambiar de plan o cancelar cuando quieras — si cancelas,
          tus datos siguen ahí y puedes volver cuando gustes.
        </p>
      </div>
    </main>
  )
}
