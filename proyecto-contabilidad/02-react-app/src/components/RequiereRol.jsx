import { Link, useParams } from 'react-router-dom'
import { useRol, puedeConfigurar, esAdmin } from '../contexts/RolContext'
import BoliMascot from './BoliMascot'

/**
 * Envuelve una pantalla que no todos deberían abrir.
 *
 * nivel: 'configurar' (admin o contador) | 'admin'
 */
export default function RequiereRol({ nivel = 'configurar', children }) {
  const { id: empresaId } = useParams()
  const { rol, cargando } = useRol()

  if (cargando) {
    return (
      <main style={{ maxWidth: 700, fontFamily: 'sans-serif' }}>
        <p>Verificando permisos...</p>
      </main>
    )
  }

  const permitido = nivel === 'admin' ? esAdmin(rol) : puedeConfigurar(rol)

  if (!permitido) {
    return (
      <main style={{ maxWidth: 620, fontFamily: 'sans-serif', textAlign: 'center' }}>
        <BoliMascot pose="triste" size={120} style={{ margin: '0 auto 1rem' }} />
        <h1>Esta sección no está disponible para ti</h1>
        <p style={{ color: '#64748B' }}>
          {nivel === 'admin'
            ? 'Solo el dueño de la empresa puede entrar aquí.'
            : 'Solo el dueño o el contador pueden entrar aquí.'}{' '}
          Si necesitas acceso, pídele a quien administra la empresa que te cambie el rol.
        </p>
        <Link to={`/empresas/${empresaId}`}>
          <button className="btn-hero" style={{ marginTop: '1rem' }}>
            Volver al inicio
          </button>
        </Link>
      </main>
    )
  }

  return children
}
