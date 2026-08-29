import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, QrCode, MessageCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 0 })}`

// Las seis cosas que resuelve. Todo lo demás suma una vez que ya
// está interesado; en la landing solo compite por atención.
const seisCosas = [
  { icon: '💰', titulo: 'Sabes cuánto ganas', texto: 'Tu utilidad real, descontando lo que te costó la mercadería.' },
  { icon: '📦', titulo: 'Controlas tu inventario', texto: 'Cada venta descuenta sola. Sabes qué reponer antes de quedarte sin nada.' },
  { icon: '🛒', titulo: 'Vendes rápido', texto: 'Buscas por nombre, color o talla. O escaneas el código de barras.' },
  { icon: '📱', titulo: 'Compartes tu catálogo', texto: 'Un enlace por WhatsApp y un QR para tu vitrina.' },
  { icon: '💳', titulo: 'Sabes quién te debe', texto: 'Ventas fiadas y abonos, con el saldo siempre al día.' },
  { icon: '📊', titulo: 'Tu contador recibe todo listo', texto: 'Estados financieros armados, en PDF o Excel.' },
]

const antes = [
  { icon: '📓', texto: 'Ventas en un cuaderno' },
  { icon: '📦', texto: 'Stock "más o menos"' },
  { icon: '💵', texto: 'Confundes ventas con ganancias' },
  { icon: '📸', texto: 'Fotos una por una por WhatsApp' },
  { icon: '🧾', texto: 'Una bolsa de papeles para el contador' },
  { icon: '🤔', texto: '"Creo que este mes me fue bien"' },
]

const despues = [
  { icon: '📱', texto: 'Ventas registradas en segundos' },
  { icon: '📦', texto: 'Stock exacto, siempre' },
  { icon: '💰', texto: 'Ganancia real en cada venta' },
  { icon: '🔗', texto: 'Catálogo con enlace y QR' },
  { icon: '📊', texto: 'Contabilidad lista para tu contador' },
  { icon: '😎', texto: '"Este mes gané Bs 5.430"' },
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

/* Pantalla de venta dibujada, no una captura: se ve nítida en
   cualquier tamaño y no depende de subir imágenes. */
function PantallaVenta() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(15, 26, 41, 0.18)',
        padding: '1.4rem',
        maxWidth: 380,
        width: '100%',
        border: '1px solid var(--color-border)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>
        Esto es lo que va a pasar
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {[
          ['💰', 'Entran Bs 580,00 a Caja.'],
          ['📈', 'Registras Bs 580,00 como venta del mes.'],
          ['📦', 'Salen Bs 347,00 de tu inventario.'],
          ['📉', 'Tu inventario baja en Bs 347,00.'],
        ].map(([icono, texto]) => (
          <li key={texto} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
            <span aria-hidden="true">{icono}</span>
            <span style={{ color: 'var(--color-text)' }}>{texto}</span>
          </li>
        ))}
      </ul>

      <div style={{ borderTop: '1px solid var(--color-border)', margin: '1rem 0 0', paddingTop: '0.9rem' }}>
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>
          Tu ganancia en esta venta: Bs 233,00
        </p>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          Margen del 40%
        </p>
      </div>

      <button className="btn-hero" type="button" style={{ width: '100%', marginTop: '1.1rem' }}>
        Registrar venta
      </button>
    </div>
  )
}

/* Los tres números del inventario */
function TarjetaInventario() {
  const datos = [
    { label: 'Te costó', valor: 'Bs 12.400', nota: 'Lo que pagaste por lo que tienes' },
    { label: 'Si vendes todo', valor: 'Bs 24.800', nota: 'A tus precios actuales' },
    { label: 'Ganarías', valor: 'Bs 12.400', nota: 'Margen promedio de 50%', destacado: true },
  ]

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.4rem',
      }}
    >
      <p style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
        Cuánta plata tienes en el estante
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {datos.map((d) => (
          <div
            key={d.label}
            style={
              d.destacado
                ? {
                    background: 'rgba(34, 197, 94, 0.07)',
                    border: '1px solid rgba(34, 197, 94, 0.28)',
                    borderRadius: 12,
                    padding: '0.7rem 0.85rem',
                  }
                : undefined
            }
          >
            <p className="stat-label" style={{ margin: 0 }}>{d.label}</p>
            <p
              style={{
                margin: '0.15rem 0 0',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: d.destacado ? 'var(--color-success)' : 'var(--color-navy)',
              }}
            >
              {d.valor}
            </p>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-disabled)' }}>
              {d.nota}
            </p>
          </div>
        ))}
      </div>

      <p style={{ margin: '1rem 0 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
        Esos <strong>Bs 12.400</strong> son plata tuya que está quieta en el estante: no la puedes usar hasta
        vender. Por eso conviene que rote, no que crezca.
      </p>
    </div>
  )
}

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
              <a href="#como-funciona">
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

          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <PantallaVenta />
            <BoliMascot
              pose="hola"
              size={82}
              style={{ position: 'absolute', bottom: -18, left: -10, filter: 'drop-shadow(0 6px 14px rgba(15,26,41,0.3))' }}
            />
          </div>
        </div>
      </section>

      {/* 2 — EL MOMENTO WOW */}
      <section className="landing-section" id="como-funciona">
        <div className="landing-container landing-grid-2">
          <div>
            <h2 className="landing-h2">Antes de confirmar una venta, ya sabes cuánto ganaste.</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.75rem', fontSize: '1.05rem', lineHeight: 1.55 }}>
              Tú solo registras la venta. MiContaBol hace el resto:
            </p>

            <ul className="lista-check">
              {[
                'descuenta el inventario',
                'actualiza tu caja',
                'calcula tu ganancia real',
                'registra la contabilidad',
                'suma a lo que te deben, si fue fiado',
              ].map((t) => (
                <li key={t}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <p
              style={{
                marginTop: '1.5rem',
                padding: '1rem 1.15rem',
                background: 'var(--color-bg-secondary)',
                borderLeft: '3px solid var(--color-coral)',
                borderRadius: 12,
                fontSize: '1.02rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                lineHeight: 1.5,
              }}
            >
              Sin asientos. Sin debe. Sin haber.
              <br />
              <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                MiContaBol habla como comerciante, no como contador.
              </span>
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PantallaVenta />
          </div>
        </div>
      </section>

      {/* 3 — LAS SEIS COSAS */}
      <section className="landing-section bg-gris">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Seis cosas que dejas de adivinar</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            No es un sistema contable con mil opciones. Resuelve lo que un comerciante necesita todos los días.
          </p>

          <div className="landing-grid-3" style={{ marginTop: '2rem' }}>
            {seisCosas.map((f) => (
              <div key={f.titulo} className="landing-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.9rem' }}>{f.icon}</div>
                <p style={{ fontWeight: 700, color: 'var(--color-navy)', margin: '0.5rem 0 0.25rem' }}>{f.titulo}</p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                  {f.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — CATÁLOGO Y QR */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            Convierte tu vitrina en un catálogo digital.
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: 620, margin: '0.5rem auto 0' }}>
            Tu cliente escanea el QR pegado en tu local, mira tus productos con foto y precio, y te escribe
            directo por WhatsApp.
          </p>

          {/* El recorrido, dibujado */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginTop: '2.25rem',
            }}
          >
            {[
              { icon: <QrCode size={30} strokeWidth={1.6} />, label: 'QR en tu vitrina' },
              { icon: '📱', label: 'Escanea con su celular' },
              { icon: '👀', label: 'Ve tus productos' },
              { icon: <MessageCircle size={30} strokeWidth={1.6} />, label: 'Te escribe por WhatsApp' },
            ].map((paso, i, arr) => (
              <div key={paso.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '1.1rem 1rem',
                    width: 145,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.7rem',
                      color: 'var(--color-navy)',
                      display: 'flex',
                      justifyContent: 'center',
                      minHeight: 34,
                      alignItems: 'center',
                    }}
                  >
                    {paso.icon}
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                    {paso.label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={20} strokeWidth={2} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          {/* Estadísticas del catálogo */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
              maxWidth: 700,
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
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)' }}>{s.valor}</p>
                <p className="stat-label" style={{ margin: '0.2rem 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '1.25rem' }}>
            Y te dice qué productos miran y cuáles no. Si algo tiene muchas visitas y ninguna consulta, el problema
            es el precio o la foto.
          </p>
        </div>
      </section>

      {/* 5 — TU INVENTARIO ES PLATA */}
      <section className="landing-section bg-tint">
        <div className="landing-container landing-grid-2">
          <div>
            <h2 className="landing-h2">Tu inventario también es plata.</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.75rem', fontSize: '1.05rem', lineHeight: 1.55 }}>
              MiContaBol te muestra cuánto dinero tienes metido en mercadería, cuánto vale vendida, y qué necesitas
              reponer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              {[
                ['Stock automático', 'Cada venta descuenta sola.'],
                ['Variantes', 'Talla, color y presentación.'],
                ['Avisos', 'Sabes qué reponer antes de quedarte sin nada.'],
                ['Costo real', 'Cuánto tienes invertido de verdad.'],
              ].map(([t, d]) => (
                <div key={t}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.95rem' }}>{t}</p>
                  <p style={{ margin: '0.15rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          <TarjetaInventario />
        </div>
      </section>

      {/* 6 — ANTES / DESPUÉS */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Lo que cambia</h2>

          <div className="landing-grid-2" style={{ marginTop: '2rem', alignItems: 'stretch' }}>
            <div
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
              }}
            >
              <p style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Antes de MiContaBol
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {antes.map((a) => (
                  <li key={a.texto} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                    <span>{a.texto}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '2px solid var(--color-coral)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-card)',
                padding: '1.5rem',
              }}
            >
              <p style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--color-coral)' }}>Con MiContaBol</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {despues.map((d) => (
                  <li key={d.texto} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', color: 'var(--color-text)', fontWeight: 500 }}>
                    <span style={{ fontSize: '1.2rem' }}>{d.icon}</span>
                    <span>{d.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — CÓMO PASO MI INFORMACIÓN */}
      <section className="landing-section bg-gris">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>
            ¿Y cómo paso lo que ya tengo?
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: 620, margin: '0.5rem auto 0' }}>
            Es la primera pregunta de todo el que ya tiene su negocio andando. Aquí está la respuesta.
          </p>

          <div className="landing-grid-3" style={{ marginTop: '2rem', alignItems: 'start' }}>
            {[
              {
                icon: '📊',
                titulo: 'Si tienes un Excel',
                texto: 'Se importa en un solo paso. El sistema te muestra una vista previa antes de confirmar, así ves si algo quedó mal antes de que entre.',
              },
              {
                icon: '📓',
                titulo: 'Si tienes un cuaderno',
                texto: 'Empiezas con los veinte o treinta productos que más vendes. El resto los cargas cuando los vendas. Nadie carga trescientos en un día, y no hace falta.',
              },
              {
                icon: '🤝',
                titulo: 'No lo haces solo',
                texto: 'En el plan Negocio nos sentamos 90 minutos contigo: cargamos tus productos, tus saldos y quién te debe. Sales con tu negocio adentro.',
              },
            ].map((c) => (
              <div key={c.titulo} className="landing-card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '2rem' }}>{c.icon}</div>
                <p style={{ fontWeight: 700, color: 'var(--color-navy)', margin: '0.5rem 0 0.35rem' }}>{c.titulo}</p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                  {c.texto}
                </p>
              </div>
            ))}
          </div>

          {/* El miedo real no es la carga de datos, es dejar lo que
              ya funciona. Decirlo tú primero baja la resistencia. */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.4rem 1.6rem',
              marginTop: '1.75rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <BoliMascot pose="consejo" size={72} />
            <p style={{ margin: 0, flex: 1, minWidth: 240, fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
              <strong style={{ color: 'var(--color-navy)' }}>No tienes que dejar tu cuaderno de golpe.</strong>{' '}
              Anota en los dos durante una semana. Cuando veas que los números cuadran, sueltas el cuaderno.
            </p>
          </div>
        </div>
      </section>

      {/* 8 — PLANES */}
      <section className="landing-section" id="precios">
        <div className="landing-container">
          <h2 className="landing-h2" style={{ textAlign: 'center' }}>Empieza gratis. Crece cuando lo necesites.</h2>

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
            <div className="landing-grid-3" style={{ marginTop: '2.25rem', alignItems: 'start' }}>
              {planes.map((p) => {
                const recomendado = p.codigo === 'negocio'
                const precio = ciclo === 'anual' ? p.precio_anual : p.precio_trimestral
                const meses = ciclo === 'anual' ? 12 : 3

                return (
                  <div
                    key={p.codigo}
                    className="landing-card"
                    style={{
                      textAlign: 'left',
                      position: 'relative',
                      border: recomendado ? '2px solid var(--color-coral)' : undefined,
                      transform: recomendado ? 'scale(1.04)' : undefined,
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
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                        {fmt(precio)}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {ciclo === 'anual' ? ' /año' : ' /trimestre'}
                      </span>
                    </p>
                    <p style={{ margin: '0.15rem 0 1.1rem', fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      Equivale a {fmt(Math.round(precio / meses))} al mes
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li style={{ fontSize: '0.88rem' }}>
                        <strong>
                          {p.limite_productos ? `${p.limite_productos} productos` : 'Productos ilimitados'}
                        </strong>
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

          {/* El trial que empieza después: va aquí, pegado al precio,
              porque es justo donde aparece la duda. */}
          <div
            style={{
              background: 'var(--color-navy)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              marginTop: '2.5rem',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            <h3 style={{ color: '#FFFFFF', fontSize: '1.4rem', margin: 0 }}>Tu mes gratis no empieza hoy.</h3>
            <p style={{ color: '#D5DEEA', margin: '0.75rem auto 0', maxWidth: 540, lineHeight: 1.6 }}>
              Empieza cuando registres tu primera venta. Carga tus productos con calma, configura tu negocio,
              aprende a usarlo. Cuando estés listo para vender, recién ahí corren tus 30 días.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '1.5rem',
                color: '#C7D2E0',
                fontSize: '0.9rem',
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

      {/* 9 — PREGUNTAS Y CIERRE */}
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

      {/* CTA final */}
      <section className="landing-cta">
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <BoliMascot pose="agradecido" size={110} style={{ margin: '0 auto 1.25rem' }} />
          <h2 className="landing-h2" style={{ color: '#FFFFFF', fontSize: '2.1rem' }}>
            Deja de adivinar cómo está tu negocio.
            <br />
            Empieza a verlo en números.
          </h2>
          <Link to="/login">
            <button className="btn-hero btn-lg" style={{ marginTop: '1.5rem' }}>
              Probar MiContaBol gratis
            </button>
          </Link>
          <p style={{ color: '#C7D2E0', fontSize: '0.9rem', marginTop: '1rem' }}>
            Sin tarjeta · 1 mes del plan Negocio · Tus datos son tuyos
          </p>
        </div>
      </section>

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
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#precios">Precios</a>
            <a href="#preguntas">Preguntas</a>
          </div>
          <div>
            <p className="landing-footer-heading">Recursos</p>
            <a href="#">Centro de ayuda</a>
          </div>
          <div>
            <p className="landing-footer-heading">Contacto</p>
            <a href="#">WhatsApp</a>
            <a href="#">Instagram</a>
          </div>
          <div>
            <p className="landing-footer-heading">Legal</p>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.8rem', marginTop: '2rem' }}>
          © {new Date().getFullYear()} MiContaBol. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  )
}
