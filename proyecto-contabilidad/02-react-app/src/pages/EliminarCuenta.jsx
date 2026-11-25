import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const CORREO = 'josemario_severiche@hotmail.com'
const WHATSAPP = '+591 75026410'

const ASUNTO = 'Eliminar mi cuenta de MiContaBol'
const MENSAJE =
  'Hola, quiero eliminar mi cuenta de MiContaBol.\n\nCorreo de mi cuenta: (escríbelo aquí)\n\nGracias.'
const ENLACE = `mailto:${CORREO}?subject=${encodeURIComponent(ASUNTO)}&body=${encodeURIComponent(MENSAJE)}`

// Página pública (sin iniciar sesión). Google Play exige una página que
// explique cómo pedir la eliminación de la cuenta y qué datos se borran.
// Los plazos y excepciones son los mismos de la política de privacidad.
export default function EliminarCuenta() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: 'sans-serif' }}>
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E6ECF3',
          padding: '1rem 0',
          paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1.5rem' }}>
          <Logo iconSize={32} />
        </div>
      </header>

      <main
        style={{
          maxWidth: 780,
          margin: '2.5rem auto',
          padding: '2.5rem',
          background: '#FFFFFF',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          lineHeight: 1.65,
          color: '#253046',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Eliminar mi cuenta</h1>
        <p style={{ color: '#64748B' }}>
          Puedes pedir que eliminemos tu cuenta de MiContaBol y tus datos cuando quieras.
        </p>

        <h2>Cómo pedirlo</h2>
        <ol>
          <li>
            Escríbenos <strong>desde el correo con el que entras a MiContaBol</strong>, para que podamos confirmar que
            la cuenta es tuya.
          </li>
          <li>
            Usa el asunto <strong>“{ASUNTO}”</strong>.
          </li>
          <li>Te confirmamos por el mismo medio cuando esté hecho.</li>
        </ol>

        <p>
          <a
            href={ENLACE}
            style={{
              display: 'inline-block',
              background: '#F2555A',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '0.75rem 1.25rem',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            Pedir la eliminación por correo
          </a>
        </p>
        <p style={{ color: '#64748B', fontSize: '0.92rem' }}>
          También puedes escribirnos por WhatsApp al <strong>{WHATSAPP}</strong> o al correo{' '}
          <strong>{CORREO}</strong>.
        </p>

        <h2>Qué datos se eliminan</h2>
        <ul>
          <li>Tu cuenta: correo, nombre, teléfono, foto de perfil y fecha de nacimiento, si los completaste.</li>
          <li>
            La información de tu negocio: ventas, compras, productos, inventario, clientes, proveedores y movimientos
            de caja.
          </li>
          <li>Tu catálogo público y su código QR.</li>
        </ul>

        <h2>Cuánto tarda y qué podemos conservar</h2>
        <p>
          Borramos tus datos <strong>dentro de los 30 días siguientes</strong> a tu pedido. La única excepción es la
          información que debamos conservar por obligaciones legales o contables.
        </p>
        <p>
          <strong>Esta acción no se puede deshacer.</strong> Si antes quieres llevarte una copia de tu información,
          pídela en el mismo mensaje y te la enviamos antes de eliminar.
        </p>

        <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #E6ECF3' }} />

        <p style={{ fontSize: '0.9rem' }}>
          <Link to="/privacidad">Privacidad</Link> · <Link to="/terminos">Términos</Link> ·{' '}
          <Link to="/soporte">Soporte</Link> · <Link to="/">Volver al inicio</Link>
        </p>
      </main>
    </div>
  )
}
