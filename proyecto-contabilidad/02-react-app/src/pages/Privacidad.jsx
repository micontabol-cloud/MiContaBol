import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const ACTUALIZADO = '8 de agosto de 2026'

export default function Privacidad() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E6ECF3', padding: '1rem 0' }}>
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
        <h1 style={{ marginTop: 0 }}>Política de privacidad</h1>
        <p style={{ color: '#64748B' }}>Última actualización: {ACTUALIZADO}</p>

        <p>
          En MiContaBol guardamos la información de tu negocio: tus ventas, tus productos, tus clientes y tus
          números. Sabemos que es información sensible, y este documento explica en palabras claras qué hacemos con
          ella y qué no.
        </p>

        <h2>Lo más importante, en resumen</h2>
        <ul>
          <li>
            <strong>Tu información es tuya.</strong> No la vendemos, no la compartimos con anunciantes ni la usamos
            para otra cosa que no sea hacer funcionar el servicio.
          </li>
          <li>
            <strong>Nadie más ve tus números.</strong> Solo tú y las personas que tú invites a tu negocio, con el
            nivel de acceso que tú les des.
          </li>
          <li>
            <strong>Puedes pedir tus datos o su eliminación</strong> cuando quieras, escribiéndonos.
          </li>
        </ul>

        <h2>Qué información guardamos</h2>

        <h3>De tu cuenta</h3>
        <p>
          Tu correo electrónico, y si decides completarlos: tu nombre, tu teléfono, tu foto de perfil y tu fecha de
          nacimiento. La fecha de nacimiento se usa únicamente para saludarte en tu cumpleaños dentro de la
          aplicación.
        </p>
        <p>
          <strong>Estos datos personales solo los ves tú.</strong> No son visibles para los otros miembros de tu
          negocio ni para nuestro equipo de soporte.
        </p>

        <h3>De tu negocio</h3>
        <p>
          Los datos de tu empresa, tus productos, tu inventario, tus ventas y compras, tus movimientos contables, y
          la información de contacto que registres de tus clientes y proveedores.
        </p>

        <h3>De tus pagos</h3>
        <p>
          Cuando pagas tu plan, guardamos el comprobante que subes, el monto y la fecha. Los comprobantes se
          almacenan en un espacio privado: solo tú y la persona que verifica el pago pueden abrirlos, y se acceden
          mediante enlaces temporales que caducan a los pocos minutos.
        </p>
        <p>
          <strong>No guardamos datos de tarjetas de crédito ni claves bancarias</strong>, porque el pago lo haces
          directamente desde la aplicación de tu banco.
        </p>

        <h3>De uso del servicio</h3>
        <p>
          Registramos información técnica básica para que el servicio funcione y para detectar problemas: fechas de
          acceso y errores del sistema.
        </p>

        <h2>Sobre la información de tus clientes</h2>
        <p>
          Cuando registras a un cliente tuyo en MiContaBol, esa información es <strong>tuya y tu
          responsabilidad</strong>. Nosotros solo la almacenamos por encargo tuyo para que puedas usar el servicio.
        </p>
        <p>
          Eso significa que tú eres quien debe asegurarse de tener el consentimiento de tus clientes para guardar sus
          datos, y de usarlos de forma legítima. Nosotros no los usamos para nada más ni los compartimos con nadie.
        </p>

        <h2>Los catálogos públicos</h2>
        <p>
          Si publicas un catálogo, su enlace es público: cualquier persona que lo tenga puede abrirlo, sin necesidad
          de contraseña. Eso es intencional, porque el catálogo está hecho para compartirse.
        </p>
        <p>
          <strong>Lo que se muestra en un catálogo público es únicamente:</strong> el nombre del producto, su foto,
          su precio y si hay disponibilidad o no.
        </p>
        <p>
          <strong>Lo que nunca se muestra:</strong> tus costos, tus márgenes de ganancia, la cantidad exacta de
          stock, tus proveedores, tus ventas, tus clientes ni ninguna información contable. Solo aparecen los
          productos que tú eliges explícitamente, y al despublicar el catálogo el enlace deja de funcionar de
          inmediato.
        </p>
        <p>
          De las visitas a tus catálogos guardamos solo el evento (qué catálogo, qué producto, cuándo), sin
          direcciones IP ni datos de quien visita. Nos alcanza para darte estadísticas útiles sin almacenar
          información personal de gente que ni siquiera usa el servicio.
        </p>

        <h2>Quién puede ver tu información</h2>

        <h3>Las personas que tú invites</h3>
        <p>
          Puedes invitar a otras personas a tu negocio con distintos roles. Un operador puede registrar ventas pero
          no ve tus reportes financieros ni tu contabilidad. Un contador ve la contabilidad pero no puede cambiar la
          configuración de la empresa. Tú decides quién entra y con qué acceso, y puedes quitarlo cuando quieras.
        </p>

        <h3>Nuestro equipo</h3>
        <p>
          Para poder darte soporte, nuestro equipo tiene acceso <strong>de solo lectura</strong> a los datos de
          negocio. No podemos modificar, borrar ni registrar nada en tu cuenta.
        </p>
        <p>
          <strong>No tenemos acceso a tus datos personales de perfil</strong> —tu fecha de nacimiento y tu teléfono
          personal— porque no hacen falta para dar soporte.
        </p>

        <h3>Proveedores de infraestructura</h3>
        <p>
          MiContaBol funciona sobre servicios de terceros que almacenan y procesan la información por encargo
          nuestro: <strong>Supabase</strong> (base de datos y archivos) y <strong>Vercel</strong> (alojamiento de la
          aplicación). Sus servidores pueden estar fuera de Bolivia. Estos proveedores no usan tu información para
          fines propios.
        </p>

        <h3>Autoridades</h3>
        <p>
          Solo entregaríamos información si nos lo exige una orden judicial o una autoridad competente conforme a
          la ley boliviana. Si eso ocurre y la ley nos lo permite, te avisaremos.
        </p>

        <h2>Qué NO hacemos con tu información</h2>
        <ul>
          <li>No la vendemos ni la alquilamos a nadie</li>
          <li>No la compartimos con anunciantes</li>
          <li>No la usamos para publicidad dirigida</li>
          <li>No mostramos anuncios dentro de la aplicación</li>
          <li>No cruzamos los datos de un negocio con los de otro</li>
        </ul>

        <h2>Seguridad</h2>
        <p>Las medidas concretas que aplicamos:</p>
        <ul>
          <li>Toda la comunicación viaja cifrada (HTTPS)</li>
          <li>
            Las contraseñas se guardan cifradas mediante nuestro proveedor de autenticación; ni siquiera nosotros
            podemos verlas
          </li>
          <li>
            La separación entre negocios se aplica en la base de datos, no solo en la aplicación: aunque alguien
            manipulara el navegador, no podría acceder a datos de otro negocio
          </li>
          <li>Los comprobantes de pago se guardan en un espacio privado con acceso mediante enlaces temporales</li>
          <li>Nuestro proveedor de base de datos realiza respaldos automáticos</li>
        </ul>
        <p>
          Aun así, ningún sistema es completamente invulnerable. Si llegara a ocurrir un incidente de seguridad que
          afecte tu información, te lo comunicaremos.
        </p>

        <h2>Cuánto tiempo guardamos tu información</h2>
        <p>
          Mientras tu cuenta exista. Si tu plan vence, <strong>no borramos nada</strong>: tu cuenta queda en modo
          solo lectura y puedes seguir consultando toda tu información.
        </p>
        <p>
          Si pides eliminar tu cuenta, borramos tus datos dentro de los 30 días siguientes, salvo la información que
          debamos conservar por obligaciones legales o contables.
        </p>

        <h2>Tus derechos</h2>
        <p>Puedes pedirnos en cualquier momento:</p>
        <ul>
          <li>Una copia de tu información</li>
          <li>Corregir datos incorrectos</li>
          <li>Eliminar tu cuenta y tus datos</li>
          <li>Aclaraciones sobre cómo tratamos tu información</li>
        </ul>
        <p>
          Escríbenos a <strong>josemario_severiche@hotmail.com</strong> o por WhatsApp al <strong>+591 75026410</strong>. Respondemos
          dentro de los 15 días hábiles.
        </p>

        <h2>Cookies</h2>
        <p>
          Usamos únicamente lo necesario para mantener tu sesión iniciada. No usamos cookies de publicidad ni de
          seguimiento entre sitios.
        </p>

        <h2>Menores de edad</h2>
        <p>
          MiContaBol está dirigido a personas mayores de 18 años que administran un negocio. No recopilamos
          información de menores de forma consciente.
        </p>

        <h2>Cambios a esta política</h2>
        <p>
          Si hacemos cambios importantes, te avisaremos dentro de la aplicación antes de que entren en vigor. La
          fecha de última actualización siempre está al inicio de este documento.
        </p>

        <h2>Contacto</h2>
        <p>
          <strong>Jose Mario Severiche</strong>
          <br />
          Cédula de identidad: 6283636 SC
          <br />
          Barrio Las Palmas, Santa Cruz de la Sierra
          <br />
          Correo: josemario_severiche@hotmail.com
          <br />
          WhatsApp: +591 75026410
        </p>

        <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #E6ECF3' }} />

        <p style={{ fontSize: '0.9rem' }}>
          <Link to="/terminos">Términos y condiciones</Link> · <Link to="/">Volver al inicio</Link>
        </p>
      </main>
    </div>
  )
}
