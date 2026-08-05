import { useEffect, useState } from 'react'

// Datos de muestra solo para la landing — no son de ninguna empresa real.
const paneles = [
  {
    label: 'Ventas del mes',
    valor: 'Bs 18.450',
    delta: '▲ 14% vs. mes anterior',
    deltaColor: '#22C55E',
    puntos: [22, 30, 26, 38, 34, 46, 55],
    mini: [
      { label: 'Ventas hoy', valor: '12' },
      { label: 'Ticket promedio', valor: 'Bs 154' },
    ],
  },
  {
    label: 'Caja + Bancos',
    valor: 'Bs 12.300',
    delta: '▲ 8% esta semana',
    deltaColor: '#22C55E',
    puntos: [30, 28, 34, 32, 40, 44, 48],
    mini: [
      { label: 'Ingresos', valor: 'Bs 21.400' },
      { label: 'Salidas', valor: 'Bs 9.100' },
    ],
  },
  {
    label: 'Productos en inventario',
    valor: '328',
    delta: '3 con poco stock',
    deltaColor: '#F59E0B',
    puntos: [40, 38, 42, 36, 44, 41, 46],
    mini: [
      { label: 'Categorías', valor: '12' },
      { label: 'Por vencer', valor: '2' },
    ],
  },
  {
    label: 'Clientes activos',
    valor: '154',
    delta: '▲ 11 este mes',
    deltaColor: '#22C55E',
    puntos: [18, 24, 28, 30, 36, 42, 50],
    mini: [
      { label: 'Por cobrar', valor: 'Bs 3.250' },
      { label: 'Al día', valor: '96%' },
    ],
  },
]

function LineaSuave({ puntos, color = '#F2555A' }) {
  const ancho = 340
  const alto = 74
  const max = Math.max(...puntos)
  const min = Math.min(...puntos)
  const rango = max - min || 1

  const coords = puntos.map((p, i) => {
    const x = (i / (puntos.length - 1)) * ancho
    const y = alto - ((p - min) / rango) * (alto - 12) - 6
    return [x, y]
  })

  // Curva suavizada: cada tramo usa la mitad del camino como control,
  // así la línea se ve fluida en vez de quebrada.
  let d = `M ${coords[0][0]} ${coords[0][1]}`
  for (let i = 1; i < coords.length; i++) {
    const [xPrev, yPrev] = coords[i - 1]
    const [x, y] = coords[i]
    const cx = (xPrev + x) / 2
    d += ` C ${cx} ${yPrev}, ${cx} ${y}, ${x} ${y}`
  }

  const area = `${d} L ${ancho} ${alto} L 0 ${alto} Z`

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} width="100%" height={alto} style={{ display: 'block', marginTop: '0.9rem' }}>
      <defs>
        <linearGradient id="fillLinea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#fillLinea)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1][0] - 2} cy={coords[coords.length - 1][1]} r="4" fill={color} />
    </svg>
  )
}

export default function LiveDashboard() {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    // Si el sistema pide reducir movimiento, no rotamos: se queda
    // fijo en el primer panel.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const t = setInterval(() => setIndice((i) => (i + 1) % paneles.length), 5000)
    return () => clearInterval(t)
  }, [])

  const p = paneles[indice]

  return (
    <div className="live-dashboard">
      <div className="live-tabs">
        {paneles.map((_, i) => (
          <div key={i} className={'live-tab' + (i === indice ? ' on' : '')} />
        ))}
      </div>

      <div className="live-panel" key={indice}>
        <p className="live-label">{p.label}</p>
        <p className="live-value">{p.valor}</p>
        <p className="live-delta" style={{ color: p.deltaColor }}>
          {p.delta}
        </p>

        <LineaSuave puntos={p.puntos} />

        <div className="live-mini-row">
          {p.mini.map((m) => (
            <div key={m.label} className="live-mini">
              <p className="live-label">{m.label}</p>
              <p style={{ margin: '0.1rem 0 0', fontWeight: 700, color: '#1F3A5F' }}>{m.valor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
