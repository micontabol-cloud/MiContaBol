import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const ACTUALIZADO = '8 de agosto de 2026'

export default function Terminos() {
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
        <h1 style={{ marginTop: 0 }}>Términos y condiciones</h1>
        <p style={{ color: '#64748B' }}>Última actualización: {ACTUALIZADO}</p>

        <p>
          Al crear una cuenta en MiContaBol aceptas estos términos. Están escritos para que se entiendan sin
          abogado; si algo no te queda claro, escríbenos antes de contratar.
        </p>

        <h2>1. Qué es MiContaBol</h2>
        <p>
          MiContaBol es una plataforma en línea para que administres tu negocio: ventas, compras, inventario,
          clientes, proveedores y contabilidad. El servicio lo presta <strong>Jose Mario Severiche</strong>, persona
          natural con cédula de identidad 6283636 SC, con domicilio en Barrio Las Palmas, Santa Cruz de la Sierra, Santa Cruz de la Sierra,
          Bolivia.
        </p>

        <h2>2. Qué NO es MiContaBol</h2>
        <p>Es importante que esto quede claro antes de contratar:</p>
        <ul>
          <li>
            <strong>No emite facturas fiscales.</strong> MiContaBol no está integrado con el sistema de facturación
            del Servicio de Impuestos Nacionales. Los comprobantes que genera son de uso interno para tu control.
          </li>
          <li>
            <strong>No reemplaza a tu contador.</strong> La plataforma organiza tu información contable, pero la
            revisión profesional, las declaraciones y el cumplimiento tributario siguen siendo responsabilidad tuya y
            de tu contador.
          </li>
          <li>
            <strong>No somos responsables de tus obligaciones tributarias.</strong> Tú decides qué registras y cómo
            lo declaras.
          </li>
        </ul>

        <h2>3. Tu cuenta</h2>
        <p>
          Para usar el servicio necesitas una cuenta con un correo válido. Eres responsable de mantener tu
          contraseña segura y de todo lo que ocurra desde tu cuenta.
        </p>
        <p>
          Si invitas a otras personas a tu negocio, eres responsable de lo que hagan dentro de él. Puedes quitarles
          el acceso en cualquier momento.
        </p>
        <p>Cada cuenta puede administrar un negocio, salvo que contrates un plan que permita más.</p>

        <h2>4. El mes de prueba</h2>
        <p>
          Al registrarte recibes <strong>un mes gratis del plan Negocio</strong>, sin necesidad de tarjeta ni de
          pago por adelantado.
        </p>
        <p>
          <strong>El mes empieza a correr cuando registras tu primera venta</strong>, no cuando te registras. Así
          puedes cargar tus productos con calma sin gastar días de prueba. Si pasan 90 días desde tu registro sin
          que registres ninguna venta, la prueba se cierra automáticamente.
        </p>
        <p>Al terminar la prueba, si no contratas un plan, tu cuenta pasa a modo solo lectura (punto 8).</p>

        <h2>5. Planes y pagos</h2>
        <p>
          Los planes y sus precios están publicados dentro de la aplicación, en la sección "Mi plan". Se contratan
          por trimestre o por año.
        </p>
        <ul>
          <li>
            <strong>El pago es por adelantado</strong>, mediante QR o transferencia bancaria, desde tu propio banco.
          </li>
          <li>
            <strong>No hay cobro automático.</strong> No guardamos datos de tu tarjeta ni te debitamos nada sin que
            tú lo hagas. Cada renovación la haces tú.
          </li>
          <li>
            <strong>La activación es manual.</strong> Después de que subas tu comprobante, verificamos que el pago
            llegó y activamos tu plan, normalmente el mismo día hábil.
          </li>
          <li>
            <strong>Si renuevas antes de que venza tu plan</strong>, los días que te quedaban se suman al período
            nuevo. No pierdes tiempo por pagar con anticipación.
          </li>
        </ul>
        <p>
          Si no podemos verificar un pago, te lo informaremos explicando el motivo para que puedas corregirlo.
        </p>

        <h2>6. Respaldo de tu pago</h2>
        <p>
          Por cada pago que realices te entregamos un <strong>recibo por el servicio prestado</strong>, con el
          detalle del plan contratado, el monto y el período cubierto.
        </p>
        <p>
          Si tu negocio necesita una factura fiscal para efectos tributarios, escríbenos antes de contratar para
          coordinarlo.
        </p>

        <h2>7. Devoluciones</h2>
        <p>
          Si en los <strong>primeros 7 días</strong> de tu primer período pagado consideras que el servicio no es
          para ti, te devolvemos el monto completo. Escríbenos y te explicaremos el proceso.
        </p>
        <p>
          Pasados esos 7 días, los períodos ya iniciados no son reembolsables, pero puedes dejar de renovar cuando
          quieras y seguirás usando el servicio hasta que termine el período que pagaste.
        </p>

        <h2>8. Qué pasa si tu plan vence</h2>
        <p>
          <strong>No borramos ni bloqueamos tu información.</strong> Tu cuenta pasa a modo solo lectura:
        </p>
        <ul>
          <li>
            <strong>Puedes seguir:</strong> viendo toda tu información, tus reportes, tu historial, tus clientes y
            tus catálogos.
          </li>
          <li>
            <strong>No puedes:</strong> registrar ventas, compras ni productos nuevos.
          </li>
        </ul>
        <p>Al renovar, todo vuelve a funcionar de inmediato, con tu información intacta.</p>

        <h2>9. Uso aceptable</h2>
        <p>No puedes usar MiContaBol para:</p>
        <ul>
          <li>Actividades ilegales o para registrar operaciones de origen ilícito</li>
          <li>Intentar acceder a datos de otros usuarios o vulnerar la seguridad del servicio</li>
          <li>Revender el servicio o dar acceso a terceros ajenos a tu negocio sin autorización</li>
          <li>Sobrecargar el sistema de forma deliberada o automatizada</li>
        </ul>
        <p>
          Si detectamos un uso así, podemos suspender la cuenta. Cuando sea posible, te avisaremos antes para que
          puedas corregirlo.
        </p>

        <h2>10. Tu información</h2>
        <p>
          La información que cargas es tuya. Puedes pedir una copia o su eliminación cuando quieras. El detalle de
          cómo la tratamos está en nuestra{' '}
          <Link to="/privacidad">política de privacidad</Link>, que forma parte de estos términos.
        </p>

        <h2>11. Disponibilidad del servicio</h2>
        <p>
          Trabajamos para que MiContaBol esté disponible de forma continua, pero no podemos garantizar que nunca se
          interrumpa. Puede haber pausas por mantenimiento, fallas de nuestros proveedores de infraestructura o
          causas fuera de nuestro control.
        </p>
        <p>Cuando el mantenimiento sea planificado, avisaremos con anticipación dentro de la aplicación.</p>

        <h2>12. Responsabilidad</h2>
        <p>
          El servicio se presta tal como está. Ponemos todo nuestro cuidado en que los cálculos y reportes sean
          correctos, pero <strong>la información que ingresas y las decisiones que tomas con ella son tu
          responsabilidad</strong>. Te recomendamos revisar tus reportes con tu contador.
        </p>
        <p>
          En la medida que la ley lo permita, nuestra responsabilidad total frente a cualquier reclamo se limita al
          monto que hayas pagado en los últimos 3 meses.
        </p>

        <h2>13. Cambios en el servicio y en los precios</h2>
        <p>
          Podemos mejorar, modificar o descontinuar funciones. Si eliminamos algo importante, avisaremos con
          anticipación.
        </p>
        <p>
          Si cambian los precios, <strong>el período que ya pagaste se respeta</strong>. El precio nuevo aplica
          recién en tu siguiente renovación, y te lo informaremos antes.
        </p>

        <h2>14. Cancelación</h2>
        <p>
          Puedes dejar de usar el servicio cuando quieras. Si quieres eliminar tu cuenta y tus datos, escríbenos y
          lo hacemos dentro de los 30 días.
        </p>
        <p>
          Podemos cancelar tu cuenta si incumples estos términos, avisándote con anticipación salvo casos graves. En
          ese caso, te daremos la oportunidad de descargar tu información.
        </p>

        <h2>15. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes del Estado Plurinacional de Bolivia. Cualquier controversia se
          someterá a los tribunales de Santa Cruz de la Sierra, Bolivia.
        </p>

        <h2>16. Contacto</h2>
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
          <Link to="/privacidad">Política de privacidad</Link> · <Link to="/">Volver al inicio</Link>
        </p>
      </main>
    </div>
  )
}
