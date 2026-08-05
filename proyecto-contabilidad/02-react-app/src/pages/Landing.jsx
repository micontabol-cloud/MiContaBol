import { Link } from 'react-router-dom'

function MockDashboard({ large }) {
  return (
    <div className="mock-dashboard" style={large ? { maxWidth: 640 } : undefined}>
      <div className="mock-stat-row">
        <div className="mock-stat">
          <span className="mock-stat-label">Utilidad del mes</span>
          <span className="mock-stat-value">Bs 4.520</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-label">Caja</span>
          <span className="mock-stat-value">Bs 9.350</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-label">Productos</span>
          <span className="mock-stat-value">382</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-label">Clientes</span>
          <span className="mock-stat-value">157</span>
        </div>
      </div>
      <div className="mock-chart">
        {[40, 65, 50, 80, 60, 95].map((h, i) => (
          <div key={i} className="mock-bar" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

const categorias = [
  { icon: '👠', label: 'Zapaterías' },
  { icon: '💍', label: 'Joyerías' },
  { icon: '👕', label: 'Boutiques' },
  { icon: '🛒', label: 'Minimarkets' },
  { icon: '🔧', label: 'Ferreterías' },
  { icon: '📱', label: 'Tiendas de celulares' },
]

const funciones = [
  { icon: '💰', titulo: 'Ventas', texto: 'Registra ventas en segundos.' },
  { icon: '📦', titulo: 'Inventario', texto: 'Sabe exactamente qué productos tienes.' },
  { icon: '👥', titulo: 'Clientes', texto: 'Conoce quién te compra más.' },
  { icon: '📊', titulo: 'Contabilidad', texto: 'Todo se organiza automáticamente. Sin conocimientos contables.' },
]

const pasos = [
  { n: '1', titulo: 'Crea tu cuenta', texto: 'Gratis, sin tarjeta.' },
  { n: '2', titulo: 'Carga tus productos', texto: 'O empieza a vender sin inventario.' },
  { n: '3', titulo: 'Registra tu primera venta', texto: 'Y mira tu negocio organizarse solo.' },
]

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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#F2555A', display: 'inline-block' }}
            />
            <span style={{ fontWeight: 700, color: '#1F3A5F' }}>MiContaBol</span>
          </Link>
          <Link to="/login">
            <button type="button">Iniciar sesión</button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-container landing-hero-grid">
          <div>
            <h1 className="landing-h1">¿Sabes realmente cuánto ganas cada mes?</h1>
            <p className="landing-subtitle">
              Administra ventas, inventario y contabilidad desde tu celular. Aunque nunca hayas usado un sistema
              contable.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
              <Link to="/login">
                <button>Empieza gratis</button>
              </Link>
              <a href="#producto">
                <button type="button">Ver demostración</button>
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Diseñado para comerciantes como tú
          </h2>
          <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
            {categorias.map((c) => (
              <div key={c.label} className="landing-card">
                <div style={{ fontSize: '2.5rem' }}>{c.icon}</div>
                <p style={{ fontWeight: 600, color: '#1F3A5F', marginTop: '0.5rem' }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Todo en un solo lugar
          </h2>
          <div className="landing-grid-4" style={{ marginTop: '2rem' }}>
            {funciones.map((f) => (
              <div key={f.titulo} className="landing-card">
                <div style={{ fontSize: '2.25rem' }}>{f.icon}</div>
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
          <h2 className="landing-h2">Así de simple se ve tu negocio</h2>
          <p style={{ color: '#64748B', marginTop: '0.5rem' }}>
            Ventas, caja, productos y clientes — de un vistazo, apenas entras.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <MockDashboard large />
          </div>
        </div>
      </section>

      {/* ANTES / DESPUÉS */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Lo que cambia cuando usas MiContaBol
          </h2>
          <div className="landing-compare">
            <div>
              <h3 style={{ color: '#EF4444' }}>Antes</h3>
              <ul className="landing-compare-list">
                <li>❌ Excel</li>
                <li>❌ Cuadernos</li>
                <li>❌ No sabes cuánto ganas</li>
                <li>❌ Inventario desordenado</li>
                <li>❌ Cuentas olvidadas</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#22C55E' }}>Después</h3>
              <ul className="landing-compare-list">
                <li>✅ Todo desde el celular</li>
                <li>✅ Ventas organizadas</li>
                <li>✅ Inventario actualizado</li>
                <li>✅ Reportes automáticos</li>
                <li>✅ Sabes cuánto ganas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO EMPEZAR (reemplaza a testimonios, ver nota) */}
      <section className="landing-section">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2">Empieza en 3 pasos</h2>
          <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
            {pasos.map((p) => (
              <div key={p.n} className="landing-card">
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F2555A', margin: 0 }}>{p.n}</p>
                <p style={{ fontWeight: 600, color: '#1F3A5F', margin: '0.25rem 0' }}>{p.titulo}</p>
                <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="landing-cta">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 className="landing-h2" style={{ color: '#FFFFFF' }}>
            Empieza gratis. 30 días. Sin tarjeta. Sin compromiso.
          </h2>
          <Link to="/login">
            <button style={{ marginTop: '1.5rem', fontSize: '1rem', padding: '0.85rem 2rem' }}>Crear mi cuenta</button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div>
            <p style={{ fontWeight: 700, color: '#FFFFFF', margin: 0 }}>MiContaBol</p>
            <p style={{ color: '#93A5C4', fontSize: '0.85rem' }}>Mi contabilidad en el bolsillo.</p>
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
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', marginTop: '2.5rem' }}>
          © {new Date().getFullYear()} MiContaBol. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
