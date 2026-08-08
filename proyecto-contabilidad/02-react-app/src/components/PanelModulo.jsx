import BoliMascot from './BoliMascot'

/**
 * Encabezado de un módulo que responde una pregunta concreta antes de
 * mostrar datos. Mismo patrón en Inventario, Ventas, Compras, Clientes
 * y Caja.
 *
 * hallazgos: [{ color, texto }] — lo que necesita atención hoy
 * acciones:  [{ to, label, principal }]
 */
export default function PanelModulo({ titulo, pregunta, pose = 'hola', hallazgos = [], mensajeVacio, acciones = null }) {
  const hayHallazgos = hallazgos.length > 0

  return (
    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <BoliMascot pose={pose} size={78} />
      <div style={{ flex: 1, minWidth: 280 }}>
        <h1 style={{ margin: 0 }}>{titulo}</h1>
        <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>{pregunta}</p>

        {hayHallazgos ? (
          <ul className="lista-check" style={{ marginTop: '0.9rem' }}>
            {hallazgos.map((h, i) => (
              <li key={i}>
                <span style={{ color: h.color || '#64748B', fontWeight: 700 }}>●</span>
                <span>{h.texto}</span>
              </li>
            ))}
          </ul>
        ) : (
          mensajeVacio && (
            <p style={{ marginTop: '0.9rem', color: '#22C55E', fontWeight: 600 }}>{mensajeVacio}</p>
          )
        )}

        {acciones && (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>{acciones}</div>
        )}
      </div>
    </div>
  )
}
