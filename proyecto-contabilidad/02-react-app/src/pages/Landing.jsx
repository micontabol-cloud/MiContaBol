import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ArrowRight,
  TrendingUp,
  Package,
  Search,
  CreditCard,
  FileSpreadsheet,
  Lock,
  Eye,
  EyeOff,
  Notebook,
  HandHeart,
  Cloud,
  UserCog,
  Download,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { ES_APP } from '../lib/plataforma'
import { Wordmark, LogoIsotipo } from '../components/Logo'
import BoliMascot from '../components/BoliMascot'
import '../styles/landing.css'

/*
  Página principal de MiContaBol — Design System 2.0 (el de LecheTrack)
  con la marca MiContaBol: navy + coral + Boli.

  Dentro de la app del celular (ES_APP) NO se muestran precios, planes,
  mes gratis ni registro: solo la página y el botón para entrar.
*/

const fmt = (n) => `Bs ${Number(n).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`

const rubros = ['Zapaterías', 'Boutiques', 'Minimarkets', 'Ferreterías', 'Joyerías', 'Farmacias']

const ventasMeses = [
  { mes: 'Mar', valor: 7800 },
  { mes: 'Abr', valor: 9100 },
  { mes: 'May', valor: 8700 },
  { mes: 'Jun', valor: 10400 },
  { mes: 'Jul', valor: 9900 },
  { mes: 'Ago', valor: 12850 },
]

const antes = [
  'Ventas en un cuaderno',
  'Stock "más o menos"',
  '"No sé cuánto gané"',
  'Fotos una por una por WhatsApp',
  'Una bolsa de papeles para el contador',
]

const despues = [
  { texto: 'Ventas registradas en segundos', Icon: Search },
  { texto: 'Stock exacto, siempre', Icon: Package },
  { texto: 'Ganancia real: Bs 5.430', Icon: TrendingUp, fuerte: true },
  { texto: 'Catálogo con enlace y QR', Icon: CreditCard },
  { texto: 'Contabilidad lista para tu contador', Icon: FileSpreadsheet },
]

const confianza = [
  { Icon: Lock, titulo: 'Solo tú ves tus números', texto: 'Ni siquiera nosotros accedemos a tus datos personales.' },
  { Icon: Cloud, titulo: 'Respaldo automático', texto: 'Tu información se guarda todos los días, sin que hagas nada.' },
  { Icon: UserCog, titulo: 'Tú decides quién ve qué', texto: 'Cada persona de tu equipo entra solo a lo que necesita.' },
  { Icon: Download, titulo: 'Tu información es tuya', texto: 'Si algún día te vas, te la llevas completa.' },
]

const preguntas = [
  {
    p: '¿Necesito saber contabilidad?',
    r: 'No. Registras lo que vendes como lo dirías normalmente y el sistema arma la contabilidad por detrás. Nunca vas a ver la palabra "asiento" ni "debe" ni "haber".',
  },
  {
    p: '¿Reemplaza a mi contador?',
    r: 'No, le facilita el trabajo. Tú manejas tu negocio en lenguaje normal y él recibe los estados financieros ordenados en vez de una bolsa de papeles. Puede entrar con su propio acceso.',
  },
  {
    p: '¿Emite facturas del SIN?',
    r: 'Todavía no. MiContaBol es para el control interno de tu negocio; la facturación fiscal la sigues haciendo como hasta ahora.',
  },
  {
    p: '¿Puedo pasar mi Excel?',
    r: 'Sí, se importa en un paso. Y si tienes todo en un cuaderno, empiezas con los productos que más vendes y cargas el resto sobre la marcha.',
  },
  {
    p: '¿Funciona desde el celular?',
    r: 'Sí, y está pensado para eso: buscas el producto, tocas cómo te pagaron y listo. También funciona en computadora y tablet.',
  },
  {
    // Habla de pagos: solo en la web.
    soloWeb: true,
    p: '¿Qué pasa si dejo de pagar?',
    r: 'Tu información no se borra. La cuenta queda en modo lectura: puedes ver todo tu historial, pero no registrar movimientos nuevos hasta que renueves.',
  },
].filter((q) => !(ES_APP && q.soloWeb))

/* ---------- Piezas visuales (pantallas de ejemplo) ---------- */

function Ventana({ children, ancho = 'auto' }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        color: 'var(--color-text)',
        borderRadius: 14,
        boxShadow: '0 24px 60px rgba(15, 26, 41, 0.22)',
        overflow: 'hidden',
        border: '1px solid rgba(15,26,41,0.08)',
        width: ancho,
        maxWidth: '100%',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.6rem 0.85rem',
          background: '#F1F5FA',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.7rem',
            color: '#64748B',
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: 999,
            padding: '0.1rem 0.6rem',
          }}
        >
          micontabol.com
        </span>
      </div>
      {children}
    </div>
  )
}

function Telefono({ children, alto = 400, etiqueta }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          background: '#0F1A29',
          borderRadius: 28,
          padding: '0.5rem',
          boxShadow: '0 20px 45px rgba(15, 26, 41, 0.35)',
          width: 208,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            color: 'var(--color-text)',
            borderRadius: 22,
            height: alto,
            overflow: 'hidden',
            position: 'relative',
            textAlign: 'left',
          }}
        >
          {children}
        </div>
      </div>
      {etiqueta && <p style={{ margin: '0.85rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{etiqueta}</p>}
    </div>
  )
}

function PantallaVenta({ compacta = false }) {
  return (
    <div style={{ padding: compacta ? '0.9rem' : '1.3rem' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Nueva venta</p>
      <p style={{ margin: '0.15rem 0 0.9rem', fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.95rem' }}>
        Modelo Roma · Rojo · Talla 38
      </p>

      <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 12, padding: '0.85rem' }}>
        <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.85rem' }}>
          Esto es lo que va a pasar
        </p>

        {[
          ['Entran', 'Bs 580,00', 'a Caja', 'var(--color-text)'],
          ['Registras', 'Bs 580,00', 'como venta', 'var(--color-text)'],
          ['Salen', 'Bs 347,00', 'de inventario', 'var(--color-text-secondary)'],
        ].map(([pre, monto, post, color]) => (
          <p key={post} style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color }}>
            {pre} <strong>{monto}</strong> {post}
          </p>
        ))}

        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.7rem', paddingTop: '0.7rem' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#15803D', fontSize: '1rem' }}>Tu ganancia: Bs 233,00</p>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            Margen del 40%
          </p>
        </div>
      </div>

      {/* Es una imagen de ejemplo: un div, no un botón de verdad */}
      <div
        style={{
          width: '100%',
          marginTop: '0.9rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          textAlign: 'center',
          background: 'var(--color-coral)',
          color: '#FFFFFF',
          borderRadius: 12,
          padding: '0.6rem 1.2rem',
        }}
      >
        Registrar venta
      </div>
    </div>
  )
}

function PantallaDashboard() {
  const max = Math.max(...ventasMeses.map((m) => m.valor))
  const ultimo = ventasMeses[ventasMeses.length - 1].valor
  const previo = ventasMeses[ventasMeses.length - 2].valor
  const variacion = Math.round(((ultimo - previo) / previo) * 100)

  const kpis = [
    { label: 'Vendido este mes', valor: 'Bs 12.850', destacado: 'ventas' },
    { label: 'Tu ganancia', valor: 'Bs 5.430', destacado: 'utilidad' },
    { label: 'En caja y bancos', valor: 'Bs 4.820' },
    { label: 'En inventario', valor: 'Bs 12.400' },
  ]

  return (
    <div style={{ padding: '1.25rem', background: 'var(--color-bg-secondary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
        <BoliMascot pose="hola" size={34} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.95rem' }}>Calzados Patito</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            ¡Buen inicio de semana! Aquí está tu resumen.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem' }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background:
                k.destacado === 'ventas'
                  ? 'rgba(242, 85, 90, 0.06)'
                  : k.destacado === 'utilidad'
                  ? 'rgba(34, 197, 94, 0.07)'
                  : '#FFFFFF',
              border: `1px solid ${
                k.destacado === 'ventas'
                  ? 'rgba(242, 85, 90, 0.25)'
                  : k.destacado === 'utilidad'
                  ? 'rgba(34, 197, 94, 0.28)'
                  : 'var(--color-border)'
              }`,
              borderRadius: 12,
              padding: '0.6rem 0.7rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{k.label}</p>
            <p
              style={{
                margin: '0.15rem 0 0',
                fontSize: '0.98rem',
                fontWeight: 800,
                color: k.destacado === 'utilidad' ? '#15803D' : 'var(--color-navy)',
              }}
            >
              {k.valor}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '0.9rem',
          marginTop: '0.7rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '0.3rem',
            marginBottom: '0.8rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-navy)' }}>
            Ventas de los últimos 6 meses
          </p>
          <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: '#15803D' }}>↑ {variacion}% vs. mes anterior</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: 78 }}>
          {ventasMeses.map((m, i) => {
            const esUltimo = i === ventasMeses.length - 1
            return (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: esUltimo ? '#D63A41' : '#64748B',
                    marginBottom: '0.2rem',
                  }}
                >
                  {(m.valor / 1000).toFixed(1)}k
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${(m.valor / max) * 52}px`,
                    background: esUltimo ? 'var(--color-coral)' : 'rgba(31, 58, 95, 0.2)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
                <span style={{ fontSize: '0.64rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {m.mes}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PantallaCatalogo() {
  return (
    <img
      src="/demo/catalogo-movil.webp"
      alt="Catálogo público de Calzados Patito visto desde un celular"
      width="480"
      height="1043"
      loading="lazy"
      decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
    />
  )
}

function PantallaWhatsapp() {
  return (
    <div style={{ height: '100%', background: '#ECE5DD', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#075E54',
          padding: '0.85rem',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          C
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600 }}>Carla M.</p>
          <p style={{ margin: 0, fontSize: '0.62rem', opacity: 0.8 }}>en línea</p>
        </div>
      </div>

      <div style={{ padding: '0.85rem' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '10px 10px 10px 2px',
            padding: '0.6rem 0.7rem',
            maxWidth: '90%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: 1.45, color: '#111B21' }}>
            Hola 👋 Vi el <strong>Modelo Roma</strong> en su catálogo a Bs 450 y me interesa. ¿Tienen talla 38?
          </p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.62rem', color: '#667781', textAlign: 'right' }}>14:32</p>
        </div>
      </div>
    </div>
  )
}

/* Etiqueta pequeña + titular con palabras clave en degradado + subtítulo */
function Encabezado({ etiqueta, children, sub, alineado = 'center' }) {
  return (
    <div className="lg-rev" style={{ textAlign: alineado, marginBottom: 40 }}>
      <span className="lg-eyebrow">{etiqueta}</span>
      <h2 className="lg-h2" style={{ margin: '16px 0 0' }}>
        {children}
      </h2>
      {sub && (
        <p className="lg-sub" style={{ margin: '14px auto 0', maxWidth: 640 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function Flecha() {
  return (
    <span className="lg-flecha" aria-hidden="true">
      <ArrowRight size={22} strokeWidth={2} />
    </span>
  )
}

/* ---------- La página ---------- */

export default function Landing() {
  const raiz = useRef(null)
  const [planes, setPlanes] = useState([])
  const [ciclo, setCiclo] = useState('trimestral')
  const [abierta, setAbierta] = useState(0)

  // Los planes y precios solo se piden (y se muestran) en la web
  useEffect(() => {
    if (ES_APP) return
    supabase
      .from('planes')
      .select('*')
      .eq('visible', true)
      .order('orden')
      .then(({ data }) => setPlanes(data || []))
  }, [])

  // Aparición suave al hacer scroll. Si algo falla, todo queda visible.
  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducido || !('IntersectionObserver' in window)) return
    el.classList.add('lg-js')
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lg-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    )
    el.querySelectorAll('.lg-rev').forEach((n) => io.observe(n))
    const seguro = setTimeout(() => el.querySelectorAll('.lg-rev').forEach((n) => n.classList.add('lg-in')), 3500)
    return () => {
      clearTimeout(seguro)
      io.disconnect()
    }
  }, [planes.length])

  // Brillo que sigue al mouse sobre las tarjetas
  function brillo(e) {
    const c = e.target.closest?.('.lg-card')
    if (!c) return
    const r = c.getBoundingClientRect()
    c.style.setProperty('--mx', `${e.clientX - r.left}px`)
    c.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const textoEntrar = ES_APP ? 'Iniciar sesión' : 'Probar gratis'

  return (
    <div className="lg" ref={raiz} onMouseMove={brillo}>
      {/* ── Barra flotante en píldora ── */}
      <header className={`lg-pill ${ES_APP ? '' : 'lg-pill-dos'}`}>
        <Link to="/" className="lg-pill-logo" aria-label="MiContaBol, inicio">
          <LogoIsotipo size={30} />
          <span className="lg-pill-nombre">
            <Wordmark size="1.15rem" />
          </span>
        </Link>
        <nav className="lg-pill-nav">
          <a className="lg-enlace lg-pill-link" href="#producto">
            Producto
          </a>
          {!ES_APP && (
            <a className="lg-enlace lg-pill-link" href="#precios">
              Precios
            </a>
          )}
          <a className="lg-enlace lg-pill-link" href="#preguntas">
            Preguntas
          </a>
          {!ES_APP && (
            <Link className="lg-pill-link" to="/login">
              <span className="lg-largo">Iniciar sesión</span>
              <span className="lg-corto">Entrar</span>
            </Link>
          )}
          <Link className="lg-pill-cta" to="/login">
            {ES_APP ? (
              <>
                <span className="lg-largo">Iniciar sesión</span>
                <span className="lg-corto">Entrar</span>
              </>
            ) : (
              textoEntrar
            )}
          </Link>
        </nav>
      </header>

      {/* ── 1 · Hero oscuro ── */}
      <section className="lg-hero">
        <div className="lg-vid lg-hero-fondo">
          <div className="lg-vid-tinte" />
        </div>
        <div className="lg-grid" />
        <div className="lg-hero-cont">
          <span className="lg-badge lg-badge-grande lg-badge-boli">
            <img src="/boli/boli-hola.webp" alt="Boli, la mascota de MiContaBol" width="84" height="84" fetchpriority="high" />
          </span>

          <span className="lg-eyebrow" style={{ marginTop: 26 }}>
            🇧🇴 Hecho para comerciantes bolivianos
          </span>

          <h1 className="lg-hero-h1" style={{ marginTop: 22 }}>
            Controla tu negocio <b>sin saber contabilidad.</b>
          </h1>

          <p className="lg-hero-p">
            Registra tus ventas, controla tu inventario y descubre cuánto ganas de verdad. MiContaBol arma la
            contabilidad por detrás.
          </p>

          <div className="lg-acciones">
            <Link className="lg-btn lg-btn-hay lg-btn-lg" to="/login">
              {ES_APP ? 'Iniciar sesión' : 'Probar gratis 1 mes'}
            </Link>
            <a className="lg-btn lg-btn-vidrio lg-btn-lg" href="#producto">
              Ver cómo funciona
            </a>
          </div>

          {!ES_APP && (
            <p className="lg-hero-nota">Sin tarjeta · Tu mes empieza con tu primera venta · Desde el celular</p>
          )}

          <div className="lg-stats">
            <div className="lg-stat">
              <b>3 pasos</b>
              <span>buscas, cobras y listo</span>
            </div>
            <div className="lg-stat">
              <b>0</b>
              <span>palabras de contabilidad</span>
            </div>
            <div className="lg-stat">
              <b>1</b>
              <span>lugar para todo tu negocio</span>
            </div>
          </div>
        </div>
        <span className="lg-mouse" aria-hidden="true" />
      </section>

      {/* Franja de rubros */}
      <div className="lg-oscuro lg-rubros">
        <p>Hecho para negocios como el tuyo</p>
        <div className="lg-rubros-fila">
          {rubros.map((r) => (
            <span key={r} className="lg-rubro">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2 · Dashboard (claro) ── */}
      <section id="producto" className="lg-claro lg-sec">
        <div className="lg-sec-in">
          <Encabezado
            etiqueta="Tu resumen"
            sub="Lo que vendiste, lo que ganaste y lo que tienes en inventario. Sin buscar nada."
          >
            Abres MiContaBol y sabes <span className="lg-grad">cómo está tu negocio.</span>
          </Encabezado>
          <div className="lg-rev" style={{ display: 'flex', justifyContent: 'center' }}>
            <Ventana ancho={840}>
              <PantallaDashboard />
            </Ventana>
          </div>
        </div>
      </section>

      {/* ── 3 · La venta (oscuro) ── */}
      <section className="lg-oscuro lg-sec">
        <div className="lg-orb lg-orb-c" style={{ left: '-12%', bottom: 'auto', top: -200 }} />
        <div className="lg-orb lg-orb-d" style={{ top: 'auto', bottom: -160 }} />
        <div className="lg-sec-in">
          <Encabezado etiqueta="La venta">
            Antes de confirmar una venta, ya sabes <span className="lg-grad">cuánto ganaste.</span>
          </Encabezado>

          <div className="lg-flujo lg-rev">
            {[
              { titulo: 'Buscas', valor: 'Roma rojo 38', Icon: Search },
              { titulo: 'Cobras', valor: 'Bs 580', Icon: CreditCard },
              { titulo: 'Sabes cuánto ganaste', valor: '+ Bs 233', Icon: TrendingUp, ok: true },
            ].map((p, i, arr) => (
              <Fragment key={p.titulo}>
                <div className="lg-card">
                  <span className={`lg-ico ${p.ok ? 'lg-ico-ok' : ''}`} style={{ margin: '0 auto' }}>
                    <p.Icon size={24} strokeWidth={1.8} />
                  </span>
                  <p style={{ margin: '14px 0 4px', fontSize: 14, color: 'var(--lg-soft)' }}>{p.titulo}</p>
                  <p
                    className={p.ok ? 'lg-ok' : undefined}
                    style={{ margin: 0, fontSize: 21, fontWeight: 800, fontFamily: 'var(--font-display)' }}
                  >
                    {p.valor}
                  </p>
                </div>
                {i < arr.length - 1 && <Flecha />}
              </Fragment>
            ))}
          </div>

          <p className="lg-sub lg-rev" style={{ textAlign: 'center', marginTop: 32 }}>
            Tú registras una venta. MiContaBol hace todo lo demás.
          </p>

          <div className="lg-chips lg-rev">
            {['Caja', 'Inventario', 'Kardex', 'Ganancia', 'Contabilidad'].map((t) => (
              <span key={t} className="lg-chip">
                <Check size={14} strokeWidth={3} aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>

          <div className="lg-card lg-cita lg-rev">
            <p style={{ margin: 0, fontSize: 19, fontWeight: 700, lineHeight: 1.4 }}>Sin asientos. Sin debe. Sin haber.</p>
            <p className="lg-sub" style={{ margin: '6px 0 0', fontSize: 15.5 }}>
              MiContaBol habla como comerciante, no como contador.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4 · Tú → MiContaBol → tu contador (claro) ── */}
      <section className="lg-claro lg-sec">
        <div className="lg-sec-in">
          <Encabezado etiqueta="Tu contador">
            Tú manejas el negocio. <span className="lg-grad">MiContaBol ordena los números.</span>
          </Encabezado>

          <div className="lg-flujo lg-rev">
            {[
              { titulo: 'Tú', items: ['Ventas', 'Compras', 'Gastos'], sub: 'en lenguaje normal' },
              { titulo: 'MiContaBol', items: ['Ordena todo', 'automáticamente'], centro: true },
              {
                titulo: 'Tu contador',
                items: ['Balance', 'Estado de resultados', 'Libro mayor', 'PDF / Excel'],
                sub: 'todo donde corresponde',
              },
            ].map((col, i, arr) => (
              <Fragment key={col.titulo}>
                <div className={`lg-card ${col.centro ? 'lg-card-marca' : ''}`}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 19 }}>{col.titulo}</h3>
                  {col.items.map((it) => (
                    <p key={it} style={{ margin: '0 0 6px', fontSize: 15, color: col.centro ? '#E3EBF6' : 'var(--lg-text)' }}>
                      {it}
                    </p>
                  ))}
                  {col.sub && <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--lg-soft)' }}>{col.sub}</p>}
                </div>
                {i < arr.length - 1 && <Flecha />}
              </Fragment>
            ))}
          </div>

          <p className="lg-sub lg-rev" style={{ textAlign: 'center', maxWidth: 580, margin: '32px auto 0' }}>
            No necesitas aprender debe, haber ni partida doble.{' '}
            <strong style={{ color: 'var(--lg-text)' }}>
              MiContaBol no reemplaza a tu contador: le facilita el trabajo.
            </strong>
          </p>
        </div>
      </section>

      {/* ── 5 · Inventario (oscuro) ── */}
      <section className="lg-oscuro lg-sec">
        <div className="lg-orb lg-orb-d" style={{ top: -100 }} />
        <div className="lg-sec-in">
          <div className="lg-dos lg-rev">
            <div>
              <span className="lg-eyebrow">Inventario</span>
              <h2 className="lg-h2" style={{ margin: '16px 0 14px' }}>
                Tu inventario <span className="lg-grad">también es plata.</span>
              </h2>
              <p className="lg-sub" style={{ margin: '0 0 22px' }}>
                MiContaBol te muestra cuánto dinero tienes metido en mercadería, cuánto vale vendida y qué necesitas
                reponer.
              </p>
              <ul className="lg-lista">
                {[
                  ['Stock automático', 'Cada venta descuenta sola.'],
                  ['Variantes', 'Talla, color y presentación.'],
                  ['Avisos', 'Sabes qué reponer a tiempo.'],
                  ['Costo real', 'Cuánto tienes invertido de verdad.'],
                ].map(([t, d]) => (
                  <li key={t}>
                    <span className="lg-check" aria-hidden="true">
                      ✓
                    </span>
                    <span>
                      <strong>{t}.</strong> <span style={{ color: 'var(--lg-soft)' }}>{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="lg-panel">
                <p style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--color-navy)' }}>
                  Cuánto dinero tienes parado en mercadería
                </p>
                <div className="lg-datos">
                  {[
                    { label: 'Te costó', valor: 'Bs 12.400', nota: 'Lo que pagaste' },
                    { label: 'Si vendes todo', valor: 'Bs 24.800', nota: 'A tus precios' },
                    { label: 'Ganarías', valor: 'Bs 12.400', nota: 'Margen del 50%', destacado: true },
                  ].map((d) => (
                    <div
                      key={d.label}
                      style={
                        d.destacado
                          ? {
                              background: 'rgba(34, 197, 94, 0.08)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: 12,
                              padding: '10px 12px',
                            }
                          : { padding: '10px 0' }
                      }
                    >
                      <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>{d.label}</p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 21,
                          fontWeight: 800,
                          color: d.destacado ? '#15803D' : 'var(--color-navy)',
                        }}
                      >
                        {d.valor}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{d.nota}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg-panel" style={{ marginTop: 14, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <BoliMascot pose="alerta" size={44} />
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
                  Tienes <strong>Bs 12.400</strong> quietos en mercadería. <strong>4 productos</strong> necesitan
                  reposición.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 · Catálogo (claro) ── */}
      <section className="lg-claro lg-sec">
        <div className="lg-sec-in">
          <Encabezado
            etiqueta="Catálogo digital"
            sub="Tu cliente escanea el QR pegado en tu local, mira tus productos con foto y precio, y te escribe directo por WhatsApp."
          >
            Convierte tu vitrina en un <span className="lg-grad">catálogo digital.</span>
          </Encabezado>

          <div
            className="lg-rev"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, flexWrap: 'wrap' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: '0 14px 34px rgba(15,26,41,0.14)',
                  padding: '1.4rem 1.6rem',
                  width: 190,
                  transform: 'rotate(-2deg)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 0.85rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-navy)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.4,
                  }}
                >
                  CONOCE NUESTROS
                  <br />
                  PRODUCTOS
                </p>
                <div
                  aria-hidden="true"
                  style={{
                    width: 96,
                    height: 96,
                    margin: '0 auto',
                    background: '#FFFFFF',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                    padding: 8,
                  }}
                >
                  {'1101011100010111010011101100101110011010011101011001110101'
                    .split('')
                    .slice(0, 49)
                    .map((v, i) => (
                      <span key={i} style={{ background: v === '1' ? 'var(--color-navy)' : 'transparent', borderRadius: 1 }} />
                    ))}
                </div>
                <p style={{ margin: '0.8rem 0 0', fontSize: '0.7rem', color: '#64748B' }}>Escanea con tu cámara</p>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 14.5, fontWeight: 600, color: 'var(--lg-soft)' }}>En tu vitrina</p>
            </div>

            <Flecha />
            <Telefono alto={400} etiqueta="Tu catálogo">
              <PantallaCatalogo />
            </Telefono>
            <Flecha />
            <Telefono alto={400} etiqueta="Te escribe">
              <PantallaWhatsapp />
            </Telefono>
          </div>

          <div
            className="lg-rev"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 16,
              marginTop: 44,
              maxWidth: 680,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {[
              { valor: '1.248', label: 'visitas al catálogo' },
              { valor: '87', label: 'consultas por WhatsApp' },
              { valor: 'Modelo Roma', label: 'el más consultado' },
            ].map((s) => (
              <div key={s.label} className="lg-card" style={{ textAlign: 'center', padding: '18px 14px' }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#1F3A5F' }}>
                  {s.valor}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--lg-soft)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p className="lg-sub lg-rev" style={{ textAlign: 'center', fontSize: 15, marginTop: 20 }}>
            Te dice qué productos miran y cuáles no. Si algo tiene muchas visitas y ninguna consulta, el problema es el
            precio o la foto.
          </p>
        </div>
      </section>

      {/* ── 7 · Tu negocio en el bolsillo (oscuro) ── */}
      <section className="lg-oscuro lg-sec">
        <div className="lg-orb lg-orb-c" />
        <div className="lg-sec-in">
          <Encabezado
            etiqueta="Desde el celular"
            sub="Vende desde el mostrador. Revisa cómo va tu negocio desde tu casa. Solo necesitas internet."
          >
            Tu negocio, <span className="lg-grad">en tu bolsillo.</span>
          </Encabezado>

          <div className="lg-rev" style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <Telefono alto={450} etiqueta="Vender">
              <PantallaVenta compacta />
            </Telefono>

            <Telefono alto={450} etiqueta="Tu catálogo">
              <PantallaCatalogo />
            </Telefono>

            <Telefono alto={450} etiqueta="Tus números">
              <div style={{ padding: '0.9rem', background: 'var(--color-bg-secondary)', height: '100%' }}>
                {[
                  { l: 'Vendido hoy', v: 'Bs 1.840' },
                  { l: 'Este mes', v: 'Bs 12.850' },
                  { l: 'Tu ganancia', v: 'Bs 5.430', verde: true },
                  { l: 'En caja', v: 'Bs 4.820' },
                ].map((k) => (
                  <div
                    key={k.l}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--color-border)',
                      borderRadius: 10,
                      padding: '0.55rem 0.7rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--color-text-secondary)' }}>{k.l}</p>
                    <p
                      style={{
                        margin: '0.1rem 0 0',
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: k.verde ? '#15803D' : 'var(--color-navy)',
                      }}
                    >
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>
            </Telefono>
          </div>

          <div className="lg-rev" style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
            <BoliMascot pose="hola" size={84} />
          </div>
        </div>
      </section>

      {/* ── 8 · Vendedores (claro) ── */}
      <section className="lg-claro lg-sec">
        <div className="lg-sec-in">
          <Encabezado etiqueta="Tu equipo" sub="Cada persona ve solamente lo que necesita para trabajar.">
            Tus vendedores venden. <span className="lg-grad">Tus números siguen siendo tuyos.</span>
          </Encabezado>

          <div
            className="lg-rev"
            style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 860, margin: '0 auto' }}
          >
            {[
              {
                titulo: 'Lo que ve tu vendedor',
                Icon: EyeOff,
                items: ['Producto y precio', 'Cantidad', 'Cómo le pagaron', 'Registrar la venta'],
                oculto: ['Costo', 'Margen', 'Ganancia'],
              },
              {
                titulo: 'Lo que ves tú',
                Icon: Eye,
                items: ['Todo lo anterior', 'Costo de cada producto', 'Margen y ganancia', 'Reportes y contabilidad'],
                destacado: true,
              },
            ].map((col) => (
              <div
                key={col.titulo}
                className="lg-card"
                style={col.destacado ? { border: '2px solid #2E5C8A' } : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className="lg-ico" style={{ width: 40, height: 40, borderRadius: 12 }}>
                    <col.Icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{col.titulo}</h3>
                </div>
                <ul className="lg-lista">
                  {col.items.map((it) => (
                    <li key={it}>
                      <Check size={17} strokeWidth={2.6} className="lg-ok" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      {it}
                    </li>
                  ))}
                  {col.oculto?.map((it) => (
                    <li key={it} style={{ color: '#6B7A90' }}>
                      <Lock size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      <span>
                        {it} <span style={{ fontSize: 13.5 }}>— oculto</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9 · De "más o menos" a saber (oscuro) ── */}
      <section className="lg-oscuro lg-sec">
        <div className="lg-orb lg-orb-d" style={{ top: 'auto', bottom: -160 }} />
        <div className="lg-sec-in">
          <Encabezado etiqueta="Antes y ahora">
            De "más o menos" a saber <span className="lg-grad">exactamente cómo va tu negocio</span>
          </Encabezado>

          <div
            className="lg-rev"
            style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', alignItems: 'stretch' }}
          >
            <div className="lg-card lg-antes">
              <p style={{ margin: '0 0 18px', fontWeight: 700, color: 'var(--lg-soft)', fontSize: 14, letterSpacing: '.06em' }}>
                ANTES
              </p>
              <ul className="lg-lista" style={{ color: 'var(--lg-soft)' }}>
                {antes.map((a) => (
                  <li key={a}>
                    <span aria-hidden="true">·</span>
                    {a}
                  </li>
                ))}
              </ul>
              <p style={{ margin: '24px 0 0', fontSize: 17, color: '#8DA3C0', fontStyle: 'italic' }}>
                "Creo que este mes me fue bien."
              </p>
            </div>

            <div className="lg-card lg-con">
              <p style={{ margin: '0 0 18px', fontWeight: 700, color: '#FF9A9D', fontSize: 14, letterSpacing: '.06em' }}>
                CON MICONTABOL
              </p>
              <ul className="lg-lista">
                {despues.map((d) => (
                  <li key={d.texto} style={d.fuerte ? { color: 'var(--lg-ok)', fontWeight: 700 } : undefined}>
                    <d.Icon size={18} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    {d.texto}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  margin: '24px 0 0',
                  fontSize: 23,
                  fontWeight: 800,
                  color: 'var(--lg-ok)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                "Este mes gané Bs 5.430."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 · Migración (claro) ── */}
      <section className="lg-claro lg-sec">
        <div className="lg-sec-in">
          <Encabezado etiqueta="Empezar" sub="Es la primera pregunta de todo el que ya tiene su negocio andando.">
            ¿Y cómo paso <span className="lg-grad">lo que ya tengo?</span>
          </Encabezado>

          <div className="lg-rev" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {[
              {
                Icon: FileSpreadsheet,
                titulo: 'Si tienes un Excel',
                texto:
                  'Se importa en un solo paso. Ves una vista previa antes de confirmar, así detectas si algo quedó mal antes de que entre.',
              },
              {
                Icon: Notebook,
                titulo: 'Si tienes un cuaderno',
                texto:
                  'Empiezas con los veinte o treinta que más vendes. El resto los cargas cuando los vendas. Nadie carga trescientos en un día.',
              },
              {
                Icon: HandHeart,
                titulo: 'No lo haces solo',
                // En la app no se nombran planes
                texto: ES_APP
                  ? 'Podemos sentarnos contigo: cargamos tus productos, tus saldos y quién te debe.'
                  : 'En el plan Negocio nos sentamos 90 minutos contigo: cargamos tus productos, tus saldos y quién te debe.',
              },
            ].map((c) => (
              <div key={c.titulo} className="lg-card">
                <span className="lg-ico">
                  <c.Icon size={24} strokeWidth={1.7} />
                </span>
                <h3 style={{ fontSize: 19, margin: '16px 0 6px' }}>{c.titulo}</h3>
                <p style={{ fontSize: 15, color: 'var(--lg-soft)', margin: 0, lineHeight: 1.55 }}>{c.texto}</p>
              </div>
            ))}
          </div>

          <div
            className="lg-card lg-rev"
            style={{
              marginTop: 24,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <BoliMascot pose="consejo" size={64} />
            <p style={{ margin: 0, flex: 1, minWidth: 240, fontSize: 16, lineHeight: 1.6 }}>
              <strong>No tienes que dejar tu cuaderno de golpe.</strong>{' '}
              <span style={{ color: 'var(--lg-soft)' }}>
                Anota en los dos durante una semana. Cuando veas que los números cuadran, sueltas el cuaderno.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── 11 · Confianza (oscuro) ──
           Cuando haya testimonios reales con permiso por escrito, van en una
           sección propia justo antes de esta. Reglas: frases textuales, nombre
           real del negocio y autorización explícita. */}
      <section className="lg-oscuro lg-sec">
        <div className="lg-orb lg-orb-c" />
        <div className="lg-sec-in">
          <Encabezado
            etiqueta="Confianza"
            sub="Le vas a confiar la información de tu negocio. Así la cuidamos."
          >
            Tus números <span className="lg-grad">están seguros</span>
          </Encabezado>

          <div className="lg-rev" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {confianza.map((c) => (
              <div key={c.titulo} className="lg-card">
                <span className="lg-ico">
                  <c.Icon size={22} strokeWidth={1.7} />
                </span>
                <h3 style={{ fontSize: 18, margin: '16px 0 6px' }}>{c.titulo}</h3>
                <p style={{ fontSize: 15, color: 'var(--lg-soft)', margin: 0, lineHeight: 1.55 }}>{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12 · Precios (claro) — SOLO EN LA WEB ── */}
      {!ES_APP && (
        <section id="precios" className="lg-claro lg-sec">
          <div className="lg-sec-in">
            <Encabezado etiqueta="Precios">
              Pruébalo gratis. <span className="lg-grad">Elige tu plan cuando estés listo.</span>
            </Encabezado>

            <div className="lg-rev" style={{ display: 'flex', justifyContent: 'center', marginTop: -12, marginBottom: 36 }}>
              <div className="lg-switch" role="group" aria-label="Ciclo de pago">
                {[
                  { valor: 'trimestral', label: 'Trimestral' },
                  { valor: 'anual', label: 'Anual' },
                ].map((c) => (
                  <button key={c.valor} type="button" aria-pressed={ciclo === c.valor} onClick={() => setCiclo(c.valor)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {planes.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--lg-soft)' }}>Cargando planes...</p>
            ) : (
              <div className="lg-planes lg-rev">
                {planes.map((p) => {
                  const recomendado = p.codigo === 'negocio'
                  const precio = ciclo === 'anual' ? p.precio_anual : p.precio_trimestral
                  const meses = ciclo === 'anual' ? 12 : 3
                  const porDia = precio / (meses * 30)

                  return (
                    <div key={p.codigo} className={`lg-card lg-plan ${recomendado ? 'lg-pro' : ''}`} style={{ textAlign: 'left' }}>
                      {recomendado && <span className="lg-plan-etiqueta">El más elegido</span>}

                      <h3 style={{ margin: recomendado ? '8px 0 4px' : '0 0 4px', fontSize: 22 }}>{p.nombre}</h3>
                      <p style={{ color: 'var(--lg-soft)', fontSize: 14.5, margin: '0 0 16px', minHeight: 42 }}>{p.descripcion}</p>

                      <p style={{ margin: 0 }}>
                        <span style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{fmt(precio)}</span>
                        <span style={{ color: 'var(--lg-soft)', fontSize: 15 }}>{ciclo === 'anual' ? ' /año' : ' /trimestre'}</span>
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--lg-ok)', fontWeight: 700 }}>
                        Equivale a {fmt(Math.round(precio / meses))} al mes
                      </p>
                      {recomendado ? (
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--lg-soft)' }}>
                          Menos de <strong style={{ color: 'var(--lg-text)' }}>Bs {porDia.toFixed(0)} al día</strong>.
                        </p>
                      ) : (
                        <div style={{ height: 22 }} />
                      )}

                      <ul className="lg-plan-lista">
                        <li>
                          <strong>{p.limite_productos ? `${p.limite_productos} productos` : 'Productos ilimitados'}</strong>
                        </li>
                        <li>
                          {p.limite_negocios === 1 ? '1 negocio' : `Hasta ${p.limite_negocios} negocios`} · {p.limite_usuarios}{' '}
                          usuarios
                        </li>
                        {[
                          { ok: true, label: 'Ventas, compras, inventario y clientes' },
                          { ok: true, label: 'Catálogo público con código QR' },
                          { ok: p.reportes_contables, label: 'Reportes contables formales' },
                          { ok: p.exportar_archivos, label: 'Exportar a PDF y Excel' },
                          { ok: p.lotes_vencimiento, label: 'Lotes y vencimientos' },
                          { ok: p.codigo_barras, label: 'Código de barras y conteo físico' },
                          { ok: p.incluye_kickoff, label: 'Sesión de arranque con un asesor' },
                          {
                            ok: p.asesorias_mes > 0,
                            label: `${p.asesorias_mes} ${p.asesorias_mes === 1 ? 'asesoría' : 'asesorías'} al mes`,
                          },
                        ].map((f, i) => (
                          <li key={i} className={f.ok ? undefined : 'lg-no'}>
                            {f.ok ? (
                              <Check size={17} strokeWidth={2.6} className="lg-check" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                            ) : (
                              <span style={{ width: 17, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">
                                —
                              </span>
                            )}
                            <span>
                              {f.label}
                              {!f.ok && <span className="sr-only"> (no incluido)</span>}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        className={`lg-btn ${recomendado ? 'lg-btn-hay' : 'lg-btn-borde'}`}
                        to="/login"
                        style={{ width: '100%', marginTop: 22 }}
                      >
                        {recomendado ? 'Probar gratis' : `Elegir ${p.nombre}`}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}

            {/* El mes gratis */}
            <div className="lg-cierre lg-rev" style={{ background: '#0F2340', marginTop: 56, padding: '48px 24px' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(22px, 3.4vw, 30px)' }}>Tu mes gratis no empieza hoy.</h3>
              <p className="lg-sub" style={{ margin: '14px auto 0', maxWidth: 560, color: '#C9D6E8' }}>
                Empieza cuando registres tu primera venta. Carga tus productos con calma, configura tu negocio, aprende a
                usarlo. Cuando estés listo para vender, recién ahí corren tus 30 días.
              </p>
              <div style={{ marginTop: 26 }}>
                <Link className="lg-btn lg-btn-hay lg-btn-lg" to="/login">
                  Probar MiContaBol gratis
                </Link>
              </div>
              <p className="lg-hero-nota" style={{ margin: '18px auto 0' }}>
                Sin tarjeta · Sin cobros automáticos · Tus datos nunca se borran
              </p>
            </div>

            <p className="lg-sub lg-rev" style={{ textAlign: 'center', fontSize: 15, marginTop: 22 }}>
              Pagas por QR o transferencia, desde tu propio banco. Tú decides cuándo renovar.
            </p>
          </div>
        </section>
      )}

      {/* ── 13 · Preguntas frecuentes ── */}
      <section id="preguntas" className="lg-claro lg-sec" style={ES_APP ? undefined : { paddingTop: 24 }}>
        <div className="lg-sec-in" style={{ maxWidth: 760 }}>
          <Encabezado etiqueta="Preguntas frecuentes">
            Lo que <span className="lg-grad">más preguntan</span>
          </Encabezado>

          <div className="lg-rev" style={{ display: 'grid', gap: 12 }}>
            {preguntas.map((q, i) => {
              const abierto = abierta === i
              return (
                <div key={q.p} className="lg-faq" data-abierta={abierto ? 'si' : 'no'}>
                  <button
                    type="button"
                    className="lg-faq-q"
                    aria-expanded={abierto}
                    aria-controls={`lg-resp-${i}`}
                    onClick={() => setAbierta(abierto ? null : i)}
                  >
                    {q.p}
                    <span className="lg-mas" aria-hidden="true">
                      +
                    </span>
                  </button>
                  <div className="lg-faq-p" id={`lg-resp-${i}`} role="region" aria-hidden={!abierto}>
                    <div>
                      <p>{q.r}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 14 · Cierre ── */}
      <section className="lg-oscuro" style={{ padding: '84px 24px' }}>
        <div className="lg-orb lg-orb-c" />
        <div className="lg-orb lg-orb-d" />
        <div className="lg-sec-in" style={{ maxWidth: 900 }}>
          <div className="lg-cierre lg-rev" style={{ background: '#0F2340' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BoliMascot pose="agradecido" size={104} />
            </div>
            <h2 className="lg-h2" style={{ marginTop: 18 }}>
              Deja de adivinar cómo está tu negocio. Empieza a verlo en <span className="lg-grad">números.</span>
            </h2>
            <div style={{ marginTop: 28 }}>
              <Link className="lg-btn lg-btn-hay lg-btn-lg" to="/login">
                {ES_APP ? 'Iniciar sesión' : 'Probar MiContaBol gratis'}
              </Link>
            </div>
            {!ES_APP && <p className="lg-hero-nota" style={{ margin: '18px auto 0' }}>Sin tarjeta · 30 días · Empiezan con tu primera venta</p>}
          </div>
        </div>
      </section>

      {/* ── Pie de página ── */}
      <footer className="lg-footer">
        <div className="lg-footer-in">
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <LogoIsotipo size={26} dark />
              <Wordmark size="1.05rem" dark />
            </span>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.55, color: '#A9BDD6' }}>
              Tu negocio en orden.
              <br />
              Tu contabilidad se arma sola.
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 13.5, color: '#8DA3C0' }}>🇧🇴 Santa Cruz, Bolivia</p>
          </div>

          <div>
            <p className="lg-footer-t">Producto</p>
            <a href="#producto">Cómo funciona</a>
            {!ES_APP && <a href="#precios">Precios</a>}
            <a href="#preguntas">Preguntas</a>
          </div>

          <div>
            <p className="lg-footer-t">Ayuda</p>
            <Link to="/soporte">Soporte</Link>
            <Link to="/eliminar-cuenta">Eliminar mi cuenta</Link>
          </div>

          <div>
            <p className="lg-footer-t">Legal</p>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </div>

        <p className="lg-footer-copy">© {new Date().getFullYear()} MiContaBol. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
