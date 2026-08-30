import { useEffect, useState } from 'react'
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
import Logo from '../components/Logo'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`

const rubros = ['Zapaterías', 'Boutiques', 'Minimarkets', 'Ferreterías', 'Joyerías', 'Farmacias']

// Ventas reales del gráfico: con montos por mes se lee como producto,
// no como wireframe.
const ventasMeses = [
  { mes: 'Mar', valor: 7800 },
  { mes: 'Abr', valor: 9100 },
  { mes: 'May', valor: 8700 },
  { mes: 'Jun', valor: 10400 },
  { mes: 'Jul', valor: 9900 },
  { mes: 'Ago', valor: 12850 },
]

// Productos del catálogo de ejemplo. Cuando tengas fotos reales,
// reemplaza "color" por "foto: '/demo/producto-1.jpg'".
const productosDemo = [
  { nombre: 'Modelo Roma', precio: 'Bs 450', color: '#8B5E4C', tono: '#A87561' },
  { nombre: 'Modelo Milano', precio: 'Bs 520', color: '#1F3A5F', tono: '#2E5C8A' },
  { nombre: 'Modelo Siena', precio: 'Bs 390', color: '#C9A227', tono: '#DCB94A' },
  { nombre: 'Modelo Capri', precio: 'Bs 495', color: '#A8A9AD', tono: '#C4C5C9' },
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
    p: '¿Qué pasa si dejo de pagar?',
    r: 'Tu información no se borra. La cuenta queda en modo lectura: puedes ver todo tu historial, pero no registrar movimientos nuevos hasta que renueves.',
  },
]

/* ---------- Piezas visuales ---------- */

function Ventana({ children, ancho = 'auto' }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        boxShadow: '0 24px 60px rgba(15, 26, 41, 0.22)',
        overflow: 'hidden',
        border: '1px solid rgba(15,26,41,0.08)',
        width: ancho,
        maxWidth: '100%',
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
            color: 'var(--color-text-disabled)',
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
        <div style={{ background: '#FFFFFF', borderRadius: 22, height: alto, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
      {etiqueta && (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', fontWeight: 600, opacity: 0.85 }}>{etiqueta}</p>
      )}
    </div>
  )
}

/* Un zapato dibujado: mejor que un cubo gris mientras no haya fotos.
   Con fotos reales, se reemplaza por <img src={p.foto} />. */
function ZapatoDibujado({ color, tono }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="100" height="100" fill="#F1F5FA" />
      <ellipse cx="50" cy="78" rx="34" ry="5" fill="rgba(15,26,41,0.08)" />
      {/* suela */}
      <path d="M18 70 Q18 76 26 76 L74 76 Q82 76 82 70 L82 66 L18 66 Z" fill={tono} opacity="0.55" />
      {/* cuerpo */}
      <path d="M22 66 Q20 44 34 36 Q44 30 54 32 Q66 35 72 46 Q79 57 78 66 Z" fill={color} />
      {/* empeine */}
      <path d="M34 44 Q46 38 58 42 Q64 44 66 50 Q52 46 38 50 Z" fill="#FFFFFF" opacity="0.22" />
      {/* correa */}
      <rect x="36" y="50" width="30" height="4" rx="2" fill="#FFFFFF" opacity="0.55" />
      <circle cx="66" cy="52" r="2.6" fill="#FFFFFF" opacity="0.8" />
    </svg>
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
          <p style={{ margin: 0, fontWeight: 800, color: 'var(--color-success)', fontSize: '1rem' }}>
            Tu ganancia: Bs 233,00
          </p>
          <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            Margen del 40%
          </p>
        </div>
      </div>

      <button className="btn-hero" type="button" style={{ width: '100%', marginTop: '0.9rem', fontSize: '0.85rem' }}>
        Registrar venta
      </button>
    </div>
  )
}

/* Dashboard con el gráfico real: montos por mes y la variación */
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
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.95rem' }}>
            Calzados Patito
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            ¡Buen inicio de semana! Aquí está tu resumen.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
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
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{k.label}</p>
            <p
              style={{
                margin: '0.15rem 0 0',
                fontSize: '0.95rem',
                fontWeight: 800,
                color: k.destacado === 'utilidad' ? 'var(--color-success)' : 'var(--color-navy)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-navy)' }}>
            Ventas de los últimos 6 meses
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-success)' }}>
            ↑ {variacion}% vs. mes anterior
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: 78 }}>
          {ventasMeses.map((m, i) => {
            const esUltimo = i === ventasMeses.length - 1
            return (
              <div key={m.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    color: esUltimo ? 'var(--color-coral)' : 'var(--color-text-disabled)',
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
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
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
    <div style={{ height: '100%', background: 'var(--color-bg-secondary)' }}>
      <div style={{ background: 'var(--color-navy)', padding: '1rem 0.85rem 0.85rem' }}>
        <p style={{ margin: 0, color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>Calzados Patito</p>
        <p style={{ margin: '0.1rem 0 0', color: '#C7D2E0', fontSize: '0.7rem' }}>Temporada nueva</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.7rem' }}>
        {productosDemo.map((p) => (
          <div
            key={p.nombre}
            style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid var(--color-border)', overflow: 'hidden' }}
          >
            <div style={{ aspectRatio: '1' }}>
              <ZapatoDibujado color={p.color} tono={p.tono} />
            </div>
            <div style={{ padding: '0.4rem 0.5rem 0.55rem' }}>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text)' }}>{p.nombre}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                {p.precio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
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
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', color: '#667781', textAlign: 'right' }}>14:32</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- La página ---------- */

export default function Landing() {
  const [planes, setPlanes] = useState([])
  const [ciclo, setCiclo] = useState('trimestral')
  const [abierta, setAbierta] = useState(null)

  useEffect(() => {
    supabase
      .from('planes')
      .select('*')
      .eq('visible', true)
      .order('orden')
      .then(({ data }) => setPlanes(data || []))
  }, [])

  return (
    <main
      style={{
        maxWidth: 'none',
        margin: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        fontFamily: 'sans-serif',
      }}
    >
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Logo iconSize={36} textSize="1.2rem" />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a href="#producto" style={{ fontSize: '0.92rem' }}>Producto</a>
            <a href="#precios" style={{ fontSize: '0.92rem' }}>Precios</a>
            <a href="#preguntas" style={{ fontSize: '0.92rem' }}>Preguntas</a>
            <Link to="/login">
              <button type="button">Iniciar sesión</button>
            </Link>
            <Link to="/login">
              <button className="btn-hero">Probar gratis</button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1 — HERO */}
      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.3rem 0.85rem',
                borderRadius: 999,
                marginBottom: '1.1rem',
              }}
            >
              🇧🇴 Hecho para comerciantes bolivianos
            </span>

            <h1 className="landing-h1">Controla tu negocio sin saber contabilidad.</h1>

            <p className="landing-subtitle">
              Registra tus ventas, controla tu inventario y descubre cuánto ganas de verdad. MiContaBol arma la
              contabilidad por detrás.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link to="/login">
                <button className="btn-hero btn-lg">Probar gratis 1 mes</button>
              </Link>
              <a href="#producto">
                <button
                  type="button"
                  className="btn-lg"
                  style={{ background: 'transparent', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)' }}
                >
                  Ver cómo funciona
                </button>
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                flexWrap: 'wrap',
                marginTop: '1.5rem',
                color: '#D5DEEA',
                fontSize: '0.88rem',
              }}
            >
              <span>✓ Sin tarjeta</span>
              <span>✓ Tu mes empieza con tu primera venta</span>
              <span>✓ Desde el celular</span>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Ventana ancho={360}>
              <PantallaVenta />
            </Ventana>

            {[
              { texto: '+ Bs 580 a caja', color: 'var(--color-navy)', top: '6%', left: '-14%' },
              { texto: '− Bs 347 inventario', color: 'var(--color-text-secondary)', top: '46%', right: '-13%' },
              { texto: '+ Bs 233 ganancia', color: 'var(--color-success)', bottom: '13%', left: '-11%', fuerte: true },
            ].map((c) => (
              <span
                key={c.texto}
                style={{
                  position: 'absolute',
                  top: c.top,
                  left: c.left,
                  right: c.right,
                  bottom: c.bottom,
                  background: '#FFFFFF',
                  border: c.fuerte ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--color-border)',
                  borderRadius: 999,
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: c.color,
                  boxShadow: '0 6px 18px rgba(15,26,41,0.16)',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.texto}
              </span>
            ))}

            <BoliMascot
              pose="hola"
              size={78}
              style={{ position: 'absolute', bottom: -26, right: -8, filter: 'drop-shadow(0 6px 14px rgba(15,26,41,0.35))' }}
            />
          </div>
        </div>
      </section>

      {/* Franja de rubros */}
      <div className="trust-strip">
        <div className="landing-container">
          <p style={{ textAlign: 'center', color: '#FFFFFF', fontWeight: 600, margin: '0 0 0.7rem', fontSize: '0.95rem' }}>
            Hecho para negocios como el tuyo
          </p>
          <div className="trust-items">
            {rubros.map((r, i) => (
              <span key={r}>
                {r}
                {i < rubros.length - 1 && <span style={{ opacity: 0.4, marginLeft: '1.5rem' }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2 — DASHBOARD */}
      <section className="landing-section" id="producto">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2">Abres MiContaBol y sabes cómo está tu negocio.</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Lo que vendiste, lo que ganaste y lo que tienes en inventario. Sin buscar nada.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.25rem' }}>
            <Ventana ancho={840}>
              <PantallaDashboard />
            </Ventana>
          </div>
        </div>
      </section>

      {/* 3 — LA VENTA */}
      <section className="landing-section bg-tint">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Antes de confirmar una venta, ya sabes cuánto ganaste.
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginTop: '2.25rem',
            }}
          >
            {[
              { titulo: 'Buscas', valor: 'Roma rojo 38', Icon: Search },
              { titulo: 'Cobras', valor: 'Bs 580', Icon: CreditCard },
              { titulo: 'Sabes cuánto ganaste', valor: '+ Bs 233', Icon: TrendingUp, verde: true },
            ].map((p, i, arr) => (
              <div key={p.titulo} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: p.verde ? '2px solid rgba(34,197,94,0.4)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '1.25rem 1.4rem',
                    width: 195,
                    textAlign: 'center',
                  }}
                >
                  <p.Icon
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: p.verde ? 'var(--color-success)' : 'var(--color-navy)' }}
                  />
                  <p style={{ margin: '0.6rem 0 0.2rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    {p.titulo}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: p.verde ? 'var(--color-success)' : 'var(--color-navy)',
                    }}
                  >
                    {p.valor}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={22} strokeWidth={2} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem', fontSize: '1.05rem' }}>
            Tú registras una venta. MiContaBol hace todo lo demás.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
            {['Caja', 'Inventario', 'Kardex', 'Ganancia', 'Contabilidad'].map((t) => (
              <span
                key={t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 999,
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-navy)',
                }}
              >
                <Check size={14} strokeWidth={3} style={{ color: 'var(--color-success)' }} />
                {t}
              </span>
            ))}
          </div>

          <p
            style={{
              maxWidth: 560,
              margin: '2rem auto 0',
              padding: '1.15rem 1.3rem',
              background: '#FFFFFF',
              borderLeft: '3px solid var(--color-coral)',
              borderRadius: 12,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-navy)',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            Sin asientos. Sin debe. Sin haber.
            <span
              style={{
                display: 'block',
                fontWeight: 400,
                color: 'var(--color-text-secondary)',
                fontSize: '0.95rem',
                marginTop: '0.35rem',
              }}
            >
              MiContaBol habla como comerciante, no como contador.
            </span>
          </p>
        </div>
      </section>

      {/* 4 — TÚ → MICONTABOL → TU CONTADOR (subida al cuarto lugar) */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Tú manejas el negocio. MiContaBol ordena los números.
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginTop: '2.25rem',
            }}
          >
            {[
              { titulo: 'Tú', items: ['Ventas', 'Compras', 'Gastos'], sub: 'en lenguaje normal' },
              { titulo: 'MiContaBol', items: ['Ordena todo', 'automáticamente'], centro: true },
              {
                titulo: 'Tu contador',
                items: ['Balance', 'Estado de resultados', 'Libro mayor', 'PDF / Excel'],
                sub: 'todo donde corresponde',
              },
            ].map((col, i, arr) => (
              <div key={col.titulo} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    background: col.centro ? 'var(--color-navy)' : '#FFFFFF',
                    border: col.centro ? 'none' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '1.3rem 1.5rem',
                    width: 210,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ marginBottom: '0.7rem', display: 'flex', justifyContent: 'center' }}>
                    {col.centro ? (
                      <Logo dark iconSize={26} textSize="0.95rem" />
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>{col.titulo}</span>
                    )}
                  </div>

                  {col.items.map((it) => (
                    <p
                      key={it}
                      style={{
                        margin: '0 0 0.3rem',
                        fontSize: '0.88rem',
                        color: col.centro ? '#C7D2E0' : 'var(--color-text)',
                      }}
                    >
                      {it}
                    </p>
                  ))}

                  {col.sub && (
                    <p style={{ margin: '0.6rem 0 0', fontSize: '0.76rem', color: 'var(--color-text-disabled)' }}>
                      {col.sub}
                    </p>
                  )}
                </div>

                {i < arr.length - 1 && (
                  <ArrowRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: 'center',
              maxWidth: 560,
              margin: '2rem auto 0',
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            No necesitas aprender debe, haber ni partida doble.{' '}
            <strong style={{ color: 'var(--color-navy)' }}>
              MiContaBol no reemplaza a tu contador: le facilita el trabajo.
            </strong>
          </p>
        </div>
      </section>

      {/* 5 — INVENTARIO */}
      <section className="landing-section bg-gris">
        <div className="landing-container landing-grid-2">
          <div>
            <h2 className="landing-h2">Tu inventario también es plata.</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.75rem', fontSize: '1.05rem', lineHeight: 1.55 }}>
              MiContaBol te muestra cuánto dinero tienes metido en mercadería, cuánto vale vendida y qué necesitas
              reponer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem', marginTop: '1.5rem' }}>
              {[
                ['Stock automático', 'Cada venta descuenta sola.'],
                ['Variantes', 'Talla, color y presentación.'],
                ['Avisos', 'Sabes qué reponer a tiempo.'],
                ['Costo real', 'Cuánto tienes invertido de verdad.'],
              ].map(([t, d]) => (
                <div key={t}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.95rem' }}>{t}</p>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                padding: '1.4rem',
              }}
            >
              <p style={{ margin: '0 0 1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Cuánto dinero tienes parado en mercadería
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.9rem' }}>
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
                            background: 'rgba(34, 197, 94, 0.07)',
                            border: '1px solid rgba(34, 197, 94, 0.28)',
                            borderRadius: 12,
                            padding: '0.7rem 0.8rem',
                          }
                        : { padding: '0.7rem 0' }
                    }
                  >
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{d.label}</p>
                    <p
                      style={{
                        margin: '0.15rem 0 0',
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: d.destacado ? 'var(--color-success)' : 'var(--color-navy)',
                      }}
                    >
                      {d.valor}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-disabled)' }}>
                      {d.nota}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '0.85rem 1rem',
                marginTop: '0.85rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <BoliMascot pose="alerta" size={44} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                Tienes <strong>Bs 12.400</strong> quietos en mercadería. <strong>4 productos</strong> necesitan
                reposición.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — CATÁLOGO */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Convierte tu vitrina en un catálogo digital.
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0.5rem auto 0' }}>
            Tu cliente escanea el QR pegado en tu local, mira tus productos con foto y precio, y te escribe directo
            por WhatsApp.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
              marginTop: '2.5rem',
            }}
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
                  }}
                >
                  CONOCE NUESTROS
                  <br />
                  PRODUCTOS
                </p>

                <div
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

                <p style={{ margin: '0.8rem 0 0', fontSize: '0.66rem', color: 'var(--color-text-secondary)' }}>
                  Escanea con tu cámara
                </p>
              </div>
              <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                En tu vitrina
              </p>
            </div>

            <ArrowRight size={22} strokeWidth={2} style={{ color: 'var(--color-text-disabled)' }} />

            <Telefono alto={330} etiqueta="Tu catálogo">
              <PantallaCatalogo />
            </Telefono>

            <ArrowRight size={22} strokeWidth={2} style={{ color: 'var(--color-text-disabled)' }} />

            <Telefono alto={330} etiqueta="Te escribe">
              <PantallaWhatsapp />
            </Telefono>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
              gap: '1rem',
              marginTop: '2.5rem',
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {[
              { valor: '1.248', label: 'visitas al catálogo' },
              { valor: '87', label: 'consultas por WhatsApp' },
              { valor: 'Modelo Roma', label: 'el más consultado' },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy)' }}>{s.valor}</p>
                <p className="stat-label" style={{ margin: '0.2rem 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '1.25rem' }}>
            Te dice qué productos miran y cuáles no. Si algo tiene muchas visitas y ninguna consulta, el problema es
            el precio o la foto.
          </p>
        </div>
      </section>

      {/* 7 — TU NEGOCIO EN EL BOLSILLO */}
      <section style={{ background: 'var(--color-navy)', padding: '3.5rem 0' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2" style={{ color: '#FFFFFF', fontSize: '2rem' }}>
            Tu negocio, en tu bolsillo.
          </h2>
          <p style={{ color: '#C7D2E0', marginTop: '0.6rem', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Vende desde el mostrador. Revisa cómo va tu negocio desde tu casa. Solo necesitas internet.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
              marginTop: '2.5rem',
              color: '#C7D2E0',
            }}
          >
            <Telefono alto={310} etiqueta="Vender">
              <PantallaVenta compacta />
            </Telefono>

            <Telefono alto={310} etiqueta="Tu catálogo">
              <PantallaCatalogo />
            </Telefono>

            <Telefono alto={310} etiqueta="Tus números">
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
                    <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--color-text-secondary)' }}>{k.l}</p>
                    <p
                      style={{
                        margin: '0.1rem 0 0',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: k.verde ? 'var(--color-success)' : 'var(--color-navy)',
                      }}
                    >
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>
            </Telefono>
          </div>

          <BoliMascot pose="hola" size={90} style={{ margin: '2rem auto 0' }} />
          <p style={{ color: '#93A5C4', fontSize: '0.88rem', margin: '0.6rem 0 0' }}>Tu negocio en el bolsillo.</p>
        </div>
      </section>

      {/* 8 — VENDEDORES */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Tus vendedores venden. Tus números siguen siendo tuyos.
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Cada persona ve solamente lo que necesita para trabajar.
          </p>

          <div className="landing-grid-2" style={{ marginTop: '2.25rem', alignItems: 'stretch' }}>
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
                // Azul, no coral: el coral se reserva para acciones.
                destacado: true,
              },
            ].map((col) => (
              <div
                key={col.titulo}
                style={{
                  background: '#FFFFFF',
                  border: col.destacado ? '2px solid var(--color-navy-light)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <col.Icon
                    size={20}
                    strokeWidth={1.8}
                    style={{ color: col.destacado ? 'var(--color-navy-light)' : 'var(--color-text-secondary)' }}
                  />
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)' }}>{col.titulo}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {col.items.map((it) => (
                    <li key={it} style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', fontSize: '0.95rem' }}>
                      <Check size={15} strokeWidth={2.5} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                      {it}
                    </li>
                  ))}

                  {col.oculto?.map((it) => (
                    <li
                      key={it}
                      style={{
                        display: 'flex',
                        gap: '0.55rem',
                        alignItems: 'center',
                        fontSize: '0.95rem',
                        color: 'var(--color-text-disabled)',
                      }}
                    >
                      <Lock size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                      {it} <span style={{ fontSize: '0.8rem' }}>— oculto</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — DE "MÁS O MENOS" A SABER (fusión de las dos secciones) */}
      <section className="landing-section bg-tint">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            De "más o menos" a saber exactamente cómo va tu negocio
          </h2>

          <div className="landing-grid-2" style={{ marginTop: '2rem', alignItems: 'stretch' }}>
            <div
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.6rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 1.2rem',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.03em',
                }}
              >
                ANTES
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {antes.map((a) => (
                  <li key={a} style={{ color: 'var(--color-text-secondary)', fontSize: '0.98rem' }}>
                    {a}
                  </li>
                ))}
              </ul>
              <p style={{ margin: '1.5rem 0 0', fontSize: '1.05rem', color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                "Creo que este mes me fue bien."
              </p>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                borderTop: '4px solid var(--color-coral)',
                boxShadow: 'var(--shadow-card)',
                padding: '1.6rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 1.2rem',
                  fontWeight: 700,
                  color: 'var(--color-coral)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.03em',
                }}
              >
                CON MICONTABOL
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {despues.map((d) => (
                  <li
                    key={d.texto}
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'center',
                      color: d.fuerte ? 'var(--color-success)' : 'var(--color-text)',
                      fontSize: '0.98rem',
                      fontWeight: d.fuerte ? 700 : 500,
                    }}
                  >
                    <d.Icon
                      size={17}
                      strokeWidth={1.9}
                      style={{ color: d.fuerte ? 'var(--color-success)' : 'var(--color-navy)', flexShrink: 0 }}
                    />
                    {d.texto}
                  </li>
                ))}
              </ul>
              <p style={{ margin: '1.5rem 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>
                "Este mes gané Bs 5.430."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10 — MIGRACIÓN */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>¿Y cómo paso lo que ya tengo?</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0.5rem auto 0' }}>
            Es la primera pregunta de todo el que ya tiene su negocio andando.
          </p>

          <div className="landing-grid-3" style={{ marginTop: '2rem', alignItems: 'start' }}>
            {[
              {
                Icon: FileSpreadsheet,
                titulo: 'Si tienes un Excel',
                texto: 'Se importa en un solo paso. Ves una vista previa antes de confirmar, así detectas si algo quedó mal antes de que entre.',
              },
              {
                Icon: Notebook,
                titulo: 'Si tienes un cuaderno',
                texto: 'Empiezas con los veinte o treinta que más vendes. El resto los cargas cuando los vendas. Nadie carga trescientos en un día.',
              },
              {
                Icon: HandHeart,
                titulo: 'No lo haces solo',
                texto: 'En el plan Negocio nos sentamos 90 minutos contigo: cargamos tus productos, tus saldos y quién te debe.',
              },
            ].map((c) => (
              <div key={c.titulo} className="landing-card" style={{ textAlign: 'left' }}>
                <c.Icon size={24} strokeWidth={1.7} style={{ color: 'var(--color-navy)' }} />
                <p style={{ fontWeight: 700, color: 'var(--color-navy)', margin: '0.7rem 0 0.35rem' }}>{c.titulo}</p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                  {c.texto}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem 1.6rem',
              marginTop: '1.75rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              maxWidth: 700,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <BoliMascot pose="consejo" size={68} />
            <p style={{ margin: 0, flex: 1, minWidth: 240, fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
              <strong style={{ color: 'var(--color-navy)' }}>No tienes que dejar tu cuaderno de golpe.</strong>{' '}
              Anota en los dos durante una semana. Cuando veas que los números cuadran, sueltas el cuaderno.
            </p>
          </div>
        </div>
      </section>

      {/* 11 — CONFIANZA
          Va aquí, justo antes del precio: es la última barrera antes
          de decidir. Cuando tengas testimonios reales, van encima de
          esta sección — el bloque comentado más abajo tiene el formato. */}
      <section className="landing-section bg-gris">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Tus números están seguros</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Le vas a confiar la información de tu negocio. Así la cuidamos.
          </p>

          <div className="landing-grid-4" style={{ marginTop: '2rem' }}>
            {confianza.map((c) => (
              <div key={c.titulo} className="landing-card" style={{ textAlign: 'left' }}>
                <c.Icon size={22} strokeWidth={1.7} style={{ color: 'var(--color-navy)' }} />
                <p style={{ fontWeight: 700, color: 'var(--color-navy)', margin: '0.6rem 0 0.25rem', fontSize: '0.95rem' }}>
                  {c.titulo}
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                  {c.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
        ────────────────────────────────────────────────────────────
        TESTIMONIOS — pendiente hasta tener clientes reales.

        Cuando dos o tres comerciantes lleven un mes usándolo y te den
        permiso por escrito, esta sección va JUSTO ARRIBA de "Tus
        números están seguros".

        Estructura lista para llenar:

        <section className="landing-section">
          <div className="landing-container">
            <h2 className="landing-h2" style={{ textAlign: 'center' }}>
              Comerciantes que ya lo usan
            </h2>
            <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
              {[
                { frase: '...', nombre: '...', negocio: '...', ciudad: '...' },
              ].map((t) => (
                <div key={t.nombre} className="landing-card" style={{ textAlign: 'left' }}>
                  <p style={{ color: '#F59E0B', margin: 0 }}>★★★★★</p>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: '0.6rem 0 1rem' }}>
                    "{t.frase}"
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9rem' }}>
                    {t.nombre}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {t.negocio} · {t.ciudad}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        Tres reglas para cuando llegue el momento:
          · Frases textuales, nunca redactadas por ti
          · Autorización explícita del comerciante
          · Nombre real del negocio — un testimonio anónimo no convence
        ────────────────────────────────────────────────────────────
      */}

      {/* 12 — PRECIOS */}
      <section className="landing-section" id="precios">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Pruébalo gratis. Elige tu plan cuando estés listo.
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                background: 'var(--color-bg-secondary)',
                padding: '0.25rem',
                borderRadius: 999,
                border: '1px solid var(--color-border)',
              }}
            >
              {[
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
                    padding: '0.5rem 1.2rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: ciclo === c.valor ? 'var(--color-navy)' : 'transparent',
                    color: ciclo === c.valor ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {planes.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-disabled)', marginTop: '2rem' }}>
              Cargando planes...
            </p>
          ) : (
            <div className="landing-grid-3" style={{ marginTop: '2.5rem', alignItems: 'start' }}>
              {planes.map((p) => {
                const recomendado = p.codigo === 'negocio'
                const precio = ciclo === 'anual' ? p.precio_anual : p.precio_trimestral
                const meses = ciclo === 'anual' ? 12 : 3
                const porDia = precio / (meses * 30)

                return (
                  <div
                    key={p.codigo}
                    className="landing-card"
                    style={{
                      textAlign: 'left',
                      position: 'relative',
                      border: recomendado ? '2px solid var(--color-coral)' : undefined,
                      transform: recomendado ? 'scale(1.05)' : undefined,
                      zIndex: recomendado ? 1 : undefined,
                    }}
                  >
                    {recomendado && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--color-coral)',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.8rem',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        El más elegido
                      </span>
                    )}

                    <h3
                      style={{
                        margin: recomendado ? '0.5rem 0 0.25rem' : '0 0 0.25rem',
                        fontSize: '1.15rem',
                        color: 'var(--color-navy)',
                      }}
                    >
                      {p.nombre}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: '0 0 1rem', minHeight: 42 }}>
                      {p.descripcion}
                    </p>

                    <p style={{ margin: 0 }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>{fmt(precio)}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {ciclo === 'anual' ? ' /año' : ' /trimestre'}
                      </span>
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      Equivale a {fmt(Math.round(precio / meses))} al mes
                    </p>

                    {recomendado ? (
                      <p style={{ margin: '0.2rem 0 1.1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Menos de <strong>Bs {porDia.toFixed(0)} al día</strong>.
                      </p>
                    ) : (
                      <div style={{ height: '1.1rem' }} />
                    )}

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li style={{ fontSize: '0.88rem' }}>
                        <strong>{p.limite_productos ? `${p.limite_productos} productos` : 'Productos ilimitados'}</strong>
                      </li>
                      <li style={{ fontSize: '0.88rem' }}>
                        {p.limite_negocios === 1 ? '1 negocio' : `Hasta ${p.limite_negocios} negocios`} ·{' '}
                        {p.limite_usuarios} usuarios
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
                        <li
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-start',
                            fontSize: '0.88rem',
                            color: f.ok ? 'var(--color-text)' : '#C4CCD8',
                          }}
                        >
                          <span style={{ color: f.ok ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0, marginTop: 2 }}>
                            {f.ok ? <Check size={15} strokeWidth={2.5} /> : '—'}
                          </span>
                          {f.label}
                        </li>
                      ))}
                    </ul>

                    <Link to="/login" style={{ display: 'block', marginTop: '1.25rem' }}>
                      <button className={recomendado ? 'btn-hero' : undefined} type="button" style={{ width: '100%' }}>
                        {recomendado ? 'Probar gratis' : `Elegir ${p.nombre}`}
                      </button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* El trial, con su propio CTA */}
          <div
            style={{
              background: 'var(--color-navy)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.25rem 2rem',
              marginTop: '2.75rem',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            <h3 style={{ color: '#FFFFFF', fontSize: '1.5rem', margin: 0 }}>Tu mes gratis no empieza hoy.</h3>
            <p style={{ color: '#D5DEEA', margin: '0.75rem auto 0', maxWidth: 540, lineHeight: 1.6 }}>
              Empieza cuando registres tu primera venta. Carga tus productos con calma, configura tu negocio,
              aprende a usarlo. Cuando estés listo para vender, recién ahí corren tus 30 días.
            </p>

            <Link to="/login">
              <button className="btn-hero btn-lg" style={{ marginTop: '1.5rem' }}>
                Probar MiContaBol gratis
              </button>
            </Link>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '1.25rem',
                color: '#C7D2E0',
                fontSize: '0.88rem',
              }}
            >
              <span>✓ Sin tarjeta</span>
              <span>✓ Sin cobros automáticos</span>
              <span>✓ Tus datos nunca se borran</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
            Pagas por QR o transferencia, desde tu propio banco. Tú decides cuándo renovar.
          </p>
        </div>
      </section>

      {/* 13 — PREGUNTAS */}
      <section className="landing-section bg-gris" id="preguntas">
        <div className="landing-container" style={{ maxWidth: 760 }}>
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Preguntas frecuentes</h2>

          <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {preguntas.map((q, i) => (
              <div
                key={q.p}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setAbierta(abierta === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'transparent',
                    border: 'none',
                    padding: '1rem 1.15rem',
                    textAlign: 'left',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    color: 'var(--color-navy)',
                  }}
                >
                  {q.p}
                  <span style={{ color: 'var(--color-text-disabled)', fontSize: '1.2rem', flexShrink: 0 }}>
                    {abierta === i ? '−' : '+'}
                  </span>
                </button>

                {abierta === i && (
                  <p
                    style={{
                      margin: 0,
                      padding: '0 1.15rem 1.15rem',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {q.r}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14 — CTA FINAL */}
      <section style={{ background: 'var(--color-navy)', padding: '4rem 0' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <BoliMascot pose="agradecido" size={120} style={{ margin: '0 auto 1.5rem' }} />

          <h2 className="landing-h2" style={{ color: '#FFFFFF', fontSize: '2.2rem', lineHeight: 1.25 }}>
            Deja de adivinar cómo está tu negocio.
            <br />
            Empieza a verlo en números.
          </h2>

          <Link to="/login">
            <button className="btn-hero btn-lg" style={{ marginTop: '1.75rem' }}>
              Probar MiContaBol gratis
            </button>
          </Link>

          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '1.25rem',
              color: '#C7D2E0',
              fontSize: '0.9rem',
            }}
          >
            <span>✓ Sin tarjeta</span>
            <span>✓ 30 días</span>
            <span>✓ Empiezan con tu primera venta</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <Logo dark iconSize={28} textSize="1rem" />
            <p style={{ color: '#93A5C4', fontSize: '0.85rem', margin: '0.6rem 0 0', lineHeight: 1.5 }}>
              Tu negocio en orden.
              <br />
              Tu contabilidad se arma sola.
            </p>
            <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0.9rem 0 0' }}>🇧🇴 Santa Cruz, Bolivia</p>
          </div>

          <div>
            <p className="landing-footer-heading">Producto</p>
            <a href="#producto">Cómo funciona</a>
            <a href="#precios">Precios</a>
            <a href="#preguntas">Preguntas</a>
          </div>

          <div>
            <p className="landing-footer-heading">Empresa</p>
            <a href="#">Contacto</a>
            <a href="#">Soporte</a>
          </div>

          <div>
            <p className="landing-footer-heading">Legal</p>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
          </div>

          <div>
            <p className="landing-footer-heading">Acceso</p>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/login">Probar gratis</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', marginTop: '2rem' }}>
          © {new Date().getFullYear()} MiContaBol. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
