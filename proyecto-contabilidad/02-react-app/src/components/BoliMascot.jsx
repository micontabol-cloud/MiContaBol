const poses = {
  hola: 'Hola',
  exito: 'Éxito',
  consejo: 'Consejo',
  pensando: 'Pensando',
  revisando: 'Revisando',
  alerta: 'Alerta',
  agradecido: 'Agradecido',
  celebrando: 'Celebrando',
  triste: 'Triste',
}

// Boli real (ilustración del diseñador), para apariciones grandes:
// saludos, estados vacíos, momentos destacados. Para el logo/isotipo
// pequeño (sidebar, favicon) se sigue usando BoliIcon.jsx — el detalle
// de esta ilustración no se ve bien reducido a 24px.
export default function BoliMascot({ pose = 'hola', size = 96, style }) {
  return (
    <img
      src={`/boli/boli-${pose}.png`}
      alt={`Boli — ${poses[pose] || pose}`}
      width={size}
      style={{ display: 'block', height: 'auto', ...style }}
    />
  )
}
