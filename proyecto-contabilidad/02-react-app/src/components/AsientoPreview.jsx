import { useState } from 'react'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

/**
 * Traduce un asiento contable a lenguaje de comerciante.
 *
 * lineas: [{ cuenta: {codigo, nombre}, debe, haber, frase }]
 *   `frase` es la explicación en español simple de esa línea.
 * ganancia: número opcional — si viene, se muestra destacado.
 */
export default function AsientoPreview({ titulo = 'Esto es lo que va a pasar', lineas, ganancia, aviso }) {
  const [verDetalle, setVerDetalle] = useState(false)

  const totalDebe = lineas.reduce((s, l) => s + Number(l.debe || 0), 0)
  const totalHaber = lineas.reduce((s, l) => s + Number(l.haber || 0), 0)
  const cuadra = Math.abs(totalDebe - totalHaber) < 0.005

  return (
    <div
      style={{
        background: '#F7F9FC',
        border: '1px solid #E6ECF3',
        borderRadius: 16,
        padding: '1rem 1.15rem',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F', fontSize: '0.95rem' }}>{titulo}</p>

      {aviso && (
        <p
          style={{
            margin: '0.6rem 0 0',
            padding: '0.5rem 0.7rem',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 10,
            color: '#8a5a00',
            fontSize: '0.85rem',
          }}
        >
          ⚠️ {aviso}
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {lineas.map((l, i) => (
          <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.92rem' }}>
            <span aria-hidden="true">{l.icono || '•'}</span>
            <span>{l.frase}</span>
          </li>
        ))}
      </ul>

      {ganancia !== undefined && ganancia !== null && (
        <p
          style={{
            margin: '0.85rem 0 0',
            paddingTop: '0.7rem',
            borderTop: '1px solid #E6ECF3',
            fontWeight: 700,
            color: ganancia >= 0 ? '#22C55E' : '#EF4444',
            fontSize: '1rem',
          }}
        >
          {ganancia >= 0 ? 'Tu ganancia en esta venta: ' : 'Pérdida en esta venta: '}
          {fmt(Math.abs(ganancia))}
        </p>
      )}

      <button
        type="button"
        onClick={() => setVerDetalle(!verDetalle)}
        style={{
          marginTop: '0.85rem',
          background: 'transparent',
          border: 'none',
          color: '#64748B',
          padding: 0,
          fontSize: '0.82rem',
          fontWeight: 500,
          textDecoration: 'underline',
        }}
      >
        {verDetalle ? 'Ocultar detalle contable' : 'Ver detalle contable'}
      </button>

      {verDetalle && (
        <div style={{ marginTop: '0.7rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '3px 6px' }}>Cuenta</th>
                <th style={{ padding: '3px 6px', textAlign: 'right' }}>Debe</th>
                <th style={{ padding: '3px 6px', textAlign: 'right' }}>Haber</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '3px 6px' }}>
                    {l.cuenta ? `${l.cuenta.codigo} — ${l.cuenta.nombre}` : <em style={{ color: '#A3AFBF' }}>sin definir</em>}
                  </td>
                  <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                    {Number(l.debe) > 0 ? Number(l.debe).toFixed(2) : ''}
                  </td>
                  <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                    {Number(l.haber) > 0 ? Number(l.haber).toFixed(2) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700 }}>
                <td style={{ padding: '3px 6px' }}>Totales</td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{totalDebe.toFixed(2)}</td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{totalHaber.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: cuadra ? '#22C55E' : '#EF4444' }}>
            {cuadra ? '✓ El asiento cuadra' : '⚠️ El asiento no cuadra'}
          </p>
        </div>
      )}
    </div>
  )
}
