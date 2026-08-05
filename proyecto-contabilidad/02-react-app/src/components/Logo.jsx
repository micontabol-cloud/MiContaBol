import { Link } from 'react-router-dom'

export function Wordmark({ size = '1.05rem', dark = false }) {
  const baseColor = dark ? '#FFFFFF' : '#1F3A5F'
  return (
    <span style={{ fontWeight: 700, fontSize: size, letterSpacing: '-0.01em' }}>
      <span style={{ color: baseColor }}>Mi</span>
      <span style={{ color: '#F2555A' }}>Conta</span>
      <span style={{ color: baseColor }}>Bol</span>
    </span>
  )
}

// El bolsillo de Boli es azul marino, igual que el sidebar: sobre fondo
// oscuro se perdería, así que ahí va dentro de un cuadro claro
// redondeado (como un app icon).
export function LogoIsotipo({ size = 32, dark = false }) {
  if (dark) {
    const caja = Math.round(size * 1.3)
    return (
      <span
        style={{
          width: caja,
          height: caja,
          borderRadius: Math.round(caja * 0.28),
          background: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img src="/boli/boli-hola.png" alt="" width={size} style={{ height: 'auto', display: 'block' }} />
      </span>
    )
  }

  return (
    <img src="/boli/boli-hola.png" alt="" width={size} style={{ height: 'auto', display: 'block', flexShrink: 0 }} />
  )
}

export default function Logo({ to = '/', iconSize = 34, textSize = '1.15rem', dark = false, showText = true }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
      <LogoIsotipo size={iconSize} dark={dark} />
      {showText && <Wordmark size={textSize} dark={dark} />}
    </Link>
  )
}
