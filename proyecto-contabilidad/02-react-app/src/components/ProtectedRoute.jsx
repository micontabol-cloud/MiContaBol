import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { session, cargando } = useAuth()

  if (cargando) return <p style={{ fontFamily: 'sans-serif', padding: '2rem' }}>Cargando...</p>
  if (!session) return <Navigate to="/login" replace />

  return children
}
