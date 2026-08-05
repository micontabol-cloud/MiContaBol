import { Link } from 'react-router-dom'
import BoliIcon from './BoliIcon'

export function Wordmark({ size = '1.05rem', dark = false }) {
  const baseColor = dark ? '#FFFFFF' : '#1F3A5F'
  return (
    <span style={{ fontWeight: 700, fontSize: size }}>
      <span style={{ color: baseColor }}>Mi</span>
      <span style={{ color: '#F2555A' }}>Conta</span>
      <span style={{ color: baseColor }}>Bol</span>
    </span>
  )
}

export default function Logo({ to = '/', iconSize = 28, textSize = '1.05rem', dark = false, showText = true }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <BoliIcon size={iconSize} dark={dark} />
      {showText && <Wordmark size={textSize} dark={dark} />}
    </Link>
  )
}
