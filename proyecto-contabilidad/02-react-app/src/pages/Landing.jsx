import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import BoliMascot from '../components/BoliMascot'
import LiveDashboard from '../components/LiveDashboard'

// Para poner una foto real: guárdala en public/rubros/ y pon aquí su
// ruta (ej. foto: '/rubros/zapateria.jpg'). Mientras foto sea null,
// la tarjeta muestra un degradado de marca con el ícono — se ve bien
// igual, no queda rota.
const rubros = [
  { icon: '👠', label: 'Zapaterías', texto: 'Controla tu inventario por modelo y talla.', foto: null },
  { icon: '💍', label: 'Joyerías', texto: 'Cada pieza con su costo y su margen real.', foto: null },
  { icon: '👕', label: 'Boutiques', texto: 'Tallas y colores, todo en un solo producto.', foto: null },
  { icon: '🛒', label: 'Minimarkets', texto: 'Avisos de vencimiento antes de perder plata.', foto: null },
  { icon: '🔧', label: 'Ferreterías', texto: 'Cientos de artículos, encontrados en segundos.', foto: null },
  { icon: '💊', label: 'Farmacias', texto: 'Control por lote y fecha de caducidad.', foto: null },
]

const funciones = [
  { icon: '💰', titulo: 'Ventas', texto: 'Registra una venta en segundos, al contado o al crédito.' },
  { icon: '📦', titulo: 'Inventario', texto: 'Sabe exactamente qué tienes, y qué se está por acabar.' },
  { icon: '🛒', titulo: 'Compras', texto: 'Cada compra actualiza tu stock y tus cuentas sola.' },
  { icon: '👥', titulo: 'Clientes', texto: 'Quién te compra más y quién te debe.' },
  { icon: '💵', titulo: 'Caja', texto: 'Cuánto tienes hoy, en efectivo y en el banco.' },
  { icon: '📊', titulo: 'Reportes', texto: 'Tu contabilidad se arma sola, sin que la toques.' },
]

const problemas = [
  'No sabes con certeza cuánto ganaste este mes.',
  'No sabes qué productos te dejan más y cuáles casi nada.',
  'No recuerdas quién te debe ni cuánto.',
  'Se te vence mercadería antes de venderla.',
  'Todo vive en un cuaderno o en un Excel que solo tú entiendes.',
]

const soluciones = [
  'Ves tu utilidad del mes apenas abres la app.',
  'Cada producto muestra su margen real.',
  'Las cuentas por cobrar se actualizan con cada abono.',
  'Te avisa qué está por vencer, con semanas de anticipación.',
  'Todo queda registrado y respaldado en la nube.',
]

function CtaFranja({ titulo }) {
  return (
    <section className="landing-cta">
      <div className="landing-container" style={{ textAlign: 'center' }}>
        <h2 className="landing-h2" style={{ color: '#FFFFFF' }}>{titulo}</h2>
        <Link to="/login">
          <button className="btn-hero btn-lg" style={{ marginTop: '1.25rem' }}>Empieza gratis</button>
        </Link>
      </div>
    </section>
  )
}

export default function Landing() {
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/login">
              <button type="button">Iniciar sesión</button>
            </Link>
            <Link to="/login">
              <button className="btn-hero">Empieza gratis</button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — foto emocional con el producto flotando encima */}
      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div>
            <BoliMascot pose="hola" size={62} style={{ marginBottom: '1rem' }} />
            <h1 className="landing-h1">¿Sabes realmente cuánto ganas cada mes?</h1>
            <p className="landing-subtitle">
              Administra ventas, inventario y contabilidad desde tu celular. Aunque nunca hayas usado un sistema
              contable.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link to="/login">
                <button className="btn-hero btn-lg">Empieza gratis</button>
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <LiveDashboard />
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <div className="trust-strip">
        <div className="landing-container">
          <p style={{ textAlign: 'center', color: '#FFFFFF', fontWeight: 600, margin: '0 0 0.75rem' }}>
            Hecho para comerciantes bolivianos.
          </p>
          <div className="trust-items">
            <span>✓ Sin conocimientos contables</span>
            <span>✓ Desde cualquier celular</span>
            <span>✓ Respaldo en la nube</span>
            <span>✓ Prueba gratis 30 días</span>
          </div>
        </div>
      </div>

      {/* PROBLEMA */}
      <section className="landing-section">
        <div className="landing-container landing-grid-2">
          <div>
            <h2 className="landing-h2">¿Te pasa esto?</h2>
            <ul className="lista-check">
              {problemas.map((p) => (
                <li key={p}>
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>✕</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: 'center' }}>
            <BoliMascot pose="pensando" size={150} style={{ margin: '0 auto' }} />
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="landing-section bg-tint">
        <div className="landing-container landing-grid-2">
          <div style={{ textAlign: 'center' }}>
            <BoliMascot pose="exito" size={150} style={{ margin: '0 auto' }} />
          </div>
          <div>
            <h2 className="landing-h2">Con MiContaBol, todo se organiza solo</h2>
            <ul className="lista-check">
              {soluciones.map((s) => (
                <li key={s}>
                  <span style={{ color: '#22C55E', fontWeight: 700 }}>✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* RUBROS */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Diseñado para negocios como el tuyo</h2>
          <p style={{ textAlign: 'center', color: '#64748B', marginTop: '0.5rem' }}>
            Eliges tu rubro y la app se adapta: muestra solo lo que tu negocio necesita.
          </p>
          <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
            {rubros.map((r) => (
              <div key={r.label} className="rubro-card">
                <div
                  className="rubro-foto"
                  style={r.foto ? { backgroundImage: `url(${r.foto})` } : undefined}
                >
                  {!r.foto && r.icon}
                </div>
                <div className="rubro-cuerpo">
                  <p style={{ fontWeight: 700, color: '#1F3A5F', margin: 0 }}>{r.label}</p>
                  <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0.3rem 0 0' }}>{r.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaFranja titulo="Empieza hoy. Te toma menos de 5 minutos." />

      {/* FUNCIONES */}
      <section className="landing-section bg-gris">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Todo en un solo lugar</h2>
          <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
            {funciones.map((f) => (
              <div key={f.titulo} className="landing-card">
                <div style={{ fontSize: '2.1rem' }}>{f.icon}</div>
                <p style={{ fontWeight: 700, color: '#1F3A5F', margin: '0.5rem 0 0.25rem' }}>{f.titulo}</p>
                <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTO */}
      <section className="landing-section" id="producto">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2">Tu negocio, de un vistazo</h2>
          <p style={{ color: '#64748B', marginTop: '0.5rem' }}>
            Ventas, utilidad, caja, productos y clientes — apenas entras, sin buscar nada.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <LiveDashboard />
          </div>
        </div>
      </section>

      {/* SÉ DE LOS PRIMEROS */}
      <section className="landing-section bg-tint">
        <div className="landing-container" style={{ textAlign: 'center', maxWidth: 620 }}>
          <BoliMascot pose="agradecido" size={110} style={{ margin: '0 auto 1rem' }} />
          <h2 className="landing-h2">Sé de los primeros en probarlo</h2>
          <p style={{ color: '#64748B', marginTop: '0.75rem' }}>
            MiContaBol está recién empezando, y queremos construirlo junto a comerciantes reales. Si entras ahora,
            tu opinión moldea lo que viene: escríbenos qué necesita tu negocio y lo escuchamos de verdad.
          </p>
        </div>
      </section>

      <CtaFranja titulo="Empieza gratis. 30 días. Sin tarjeta. Sin compromiso." />

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <Logo dark iconSize={28} textSize="1rem" />
            <p style={{ color: '#93A5C4', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
              Mi contabilidad en el bolsillo.
            </p>
          </div>
          <div>
            <p className="landing-footer-heading">Producto</p>
            <a href="#producto">Funciones</a>
            <a href="#">Precios</a>
          </div>
          <div>
            <p className="landing-footer-heading">Recursos</p>
            <a href="#">Blog</a>
            <a href="#">Centro de ayuda</a>
          </div>
          <div>
            <p className="landing-footer-heading">Contacto</p>
            <a href="#">WhatsApp</a>
            <a href="#">Instagram</a>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', marginTop: '2rem' }}>
          © {new Date().getFullYear()} MiContaBol. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
