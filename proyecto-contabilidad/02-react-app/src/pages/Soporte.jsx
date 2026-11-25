import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const CORREO = 'josemario_severiche@hotmail.com'
const WHATSAPP = '+591 75026410'
const WHATSAPP_LINK = 'https://wa.me/59175026410'

// Página pública (sin iniciar sesión). Las tiendas de apps piden una
// dirección de soporte a la que cualquier persona pueda entrar.
export default function Soporte() {
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
        <h1 style={{ marginTop: 0 }}>Soporte</h1>
        <p style={{ color: '#64748B' }}>¿Tienes una duda o algo no funciona como esperabas? Escríbenos.</p>

        <h2>Cómo contactarnos</h2>
        <ul>
          <li>
            Correo: <a href={`mailto:${CORREO}?subject=Soporte%20MiContaBol`}><strong>{CORREO}</strong></a>
          </li>
          <li>
            WhatsApp: <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><strong>{WHATSAPP}</strong></a>
          </li>
        </ul>
        <p>
          Para ayudarte más rápido, cuéntanos el correo con el que entras a MiContaBol, qué estabas haciendo y, si
          puedes, mándanos una captura de pantalla.
        </p>

        <h2>Preguntas comunes</h2>

        <h3>No puedo iniciar sesión</h3>
        <p>
          Revisa que el correo esté bien escrito y que la contraseña sea la correcta (cuidado con las mayúsculas). Si
          sigue sin funcionar, escríbenos desde el correo de tu cuenta y te ayudamos.
        </p>

        <h3>Quiero una copia de mi información</h3>
        <p>
          Tu información es tuya. Escríbenos desde el correo de tu cuenta y te la entregamos. Más detalle en nuestra{' '}
          <Link to="/privacidad">política de privacidad</Link>.
        </p>

        <h3>Quiero eliminar mi cuenta</h3>
        <p>
          Puedes pedirlo en cualquier momento. Mira cómo se hace y qué datos se borran en{' '}
          <Link to="/eliminar-cuenta">Eliminar mi cuenta</Link>.
        </p>

        <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #E6ECF3' }} />

        <p style={{ fontSize: '0.9rem' }}>
          <Link to="/privacidad">Privacidad</Link> · <Link to="/terminos">Términos</Link> ·{' '}
          <Link to="/eliminar-cuenta">Eliminar mi cuenta</Link> · <Link to="/">Volver al inicio</Link>
        </p>
      </main>
    </div>
  )
}
