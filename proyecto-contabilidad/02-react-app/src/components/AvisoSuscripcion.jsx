import { Link } from 'react-router-dom'
import BoliMascot from './BoliMascot'

/**
 * Aviso del estado de la suscripción. Solo aparece cuando hay algo que
 * hacer: quedan pocos días o ya venció. Un banner permanente se vuelve
 * ruido y la gente deja de verlo justo cuando importa.
 */
export default function AvisoSuscripcion({ suscripcion }) {
  if (!suscripcion) return null

  const { estado, dias_restantes: dias, prueba_iniciada } = suscripcion
  const vencida = estado === 'vencida'
  const porVencer = (estado === 'prueba' || estado === 'activa') && dias !== null && dias <= 7 && dias >= 0

  // Si la prueba ni siquiera arrancó, no hay nada que avisar
  if (!vencida && !porVencer) return null
  if (estado === 'prueba' && !prueba_iniciada) return null

  const color = vencida ? '#EF4444' : dias <= 2 ? '#EF4444' : '#F59E0B'
  const fondo = vencida ? 'rgba(239, 68, 68, 0.07)' : 'rgba(245, 158, 11, 0.1)'

  return (
    <section
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        background: fondo,
        border: `1px solid ${color}55`,
        borderRadius: 16,
        padding: '1rem 1.2rem',
        marginTop: '1.25rem',
      }}
    >
      <BoliMascot pose={vencida ? 'triste' : 'alerta'} size={54} />

      <div style={{ flex: 1, minWidth: 240 }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
          {vencida
            ? 'Tu suscripción venció'
            : estado === 'prueba'
            ? dias === 0
              ? 'Tu mes gratis termina hoy'
              : `Te ${dias === 1 ? 'queda' : 'quedan'} ${dias} ${dias === 1 ? 'día' : 'días'} de prueba`
            : `Tu plan vence en ${dias} ${dias === 1 ? 'día' : 'días'}`}
        </p>
        <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>
          {vencida
            ? 'Tu información sigue aquí intacta. Renueva para volver a registrar ventas y productos.'
            : 'Elige tu plan para seguir sin interrupciones. Toda tu información se mantiene.'}
        </p>
      </div>

      <Link to="/suscripcion">
        <button className="btn-hero">{vencida ? 'Renovar' : 'Ver planes'}</button>
      </Link>
    </section>
  )
}
