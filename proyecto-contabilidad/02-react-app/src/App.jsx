import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import MisEmpresas from './pages/MisEmpresas'
import NuevaEmpresa from './pages/NuevaEmpresa'
import EmpresaDashboard from './pages/EmpresaDashboard'
import PlanCuentas from './pages/PlanCuentas'
import Asientos from './pages/Asientos'
import NuevoAsiento from './pages/NuevoAsiento'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <MisEmpresas />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/empresas/:id/cuentas"
            element={
              <ProtectedRoute>
                <PlanCuentas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/asientos"
            element={
              <ProtectedRoute>
                <Asientos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/asientos/nuevo"
            element={
              <ProtectedRoute>
                <NuevoAsiento />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
