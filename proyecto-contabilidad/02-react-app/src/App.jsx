import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import NuevaEmpresa from './pages/NuevaEmpresa'
import EmpresaDashboard from './pages/EmpresaDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/empresas/nueva"
            element={
              <ProtectedRoute>
                <NuevaEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id"
            element={
              <ProtectedRoute>
                <EmpresaDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
