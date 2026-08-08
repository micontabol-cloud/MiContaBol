// Interpretación propia y simplificada del concepto de Boli (teléfono
// asomando de un bolsillo), NO una copia de la ilustración del
// diseñador. Reemplazar por los assets reales (PNG transparente o SVG,
// exportados pose por pose) en cuanto estén disponibles — ver el resto
// de la app: este componente se usa en Logo.jsx y en el favicon.
export default function BoliIcon({ size = 32, dark = false }) {
  const pocketColor = dark ? '#2E5C8A' : '#1F3A5F'
  const strokeColor = dark ? '#F7F9FC' : '#1F3A5F'
  const phoneColor = '#F7F9FC'
  const faceColor = dark ? '#1F3A5F' : '#253046'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 28 C8 24 11 22 15 22 H49 C53 22 56 24 56 28 V54 C56 58 53 60 49 60 H15 C11 60 8 58 8 54 Z"
        fill={pocketColor}
      />
      <path
        d="M8 28 C8 24 11 22 15 22 H49 C53 22 56 24 56 28"
        stroke={strokeColor}
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
      <rect x="20" y="6" width="24" height="34" rx="7" fill={phoneColor} stroke={strokeColor} strokeWidth="2" />
      <circle cx="28" cy="22" r="2.2" fill={faceColor} />
      <circle cx="36" cy="22" r="2.2" fill={faceColor} />
      <path d="M27 28 Q32 32 37 28" stroke={faceColor} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
