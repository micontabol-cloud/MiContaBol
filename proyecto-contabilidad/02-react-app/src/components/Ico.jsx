import {
  AlertTriangle,
  Banknote,
  Cake,
  Camera,
  CheckCircle2,
  Clock,
  Handshake,
  Landmark,
  MapPin,
  MessageCircle,
  Package,
  PartyPopper,
  Receipt,
  Tag,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

// Un solo estilo de iconos en toda la app (Lucide). Recibe el emoji que antes se escribía y dibuja
// su ícono; si no lo conoce (por ejemplo, un emoji que eligió el usuario) lo muestra tal cual.
const MAPA = {
  '⚠': AlertTriangle,
  '✅': CheckCircle2,
  '🎉': PartyPopper,
  '📍': MapPin,
  '🕒': Clock,
  '💬': MessageCircle,
  '📷': Camera,
  '👍': ThumbsUp,
  '📈': TrendingUp,
  '📉': TrendingDown,
  '🧾': Receipt,
  '🏦': Landmark,
  '🤝': Handshake,
  '💰': Banknote,
  '💸': Banknote,
  '📦': Package,
  '🏷': Tag,
  '🎂': Cake,
}

const limpio = (e) => String(e ?? '').replace(/\uFE0F/g, '').trim()

export default function Ico({ e, size = 16, fallback = null, style }) {
  const Icono = MAPA[limpio(e)]
  if (!Icono) return <span aria-hidden="true">{e || fallback}</span>
  return (
    <Icono
      size={size}
      strokeWidth={2}
      aria-hidden="true"
      style={{ verticalAlign: '-0.18em', flexShrink: 0, ...style }}
    />
  )
}
