import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import MisEmpresas from './pages/MisEmpresas'
import Admin from './pages/Admin'
import NuevaEmpresa from './pages/NuevaEmpresa'
import EmpresaDashboard from './pages/EmpresaDashboard'
import PlanCuentas from './pages/PlanCuentas'
import Comprobantes from './pages/Comprobantes'
import NuevoComprobante from './pages/NuevoComprobante'
import Asientos from './pages/Asientos'
import NuevoAsiento from './pages/NuevoAsiento'
import LibroMayor from './pages/LibroMayor'
import BalanceComprobacion from './pages/BalanceComprobacion'
import EstadosFinancieros from './pages/EstadosFinancieros'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
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
            path="/empresas/:id/comprobantes"
            element={
              <ProtectedRoute>
                <Comprobantes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/comprobantes/nuevo"
            element={
              <ProtectedRoute>
                <NuevoComprobante />
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
          <Route
            path="/empresas/:id/libro-mayor"
            element={
              <ProtectedRoute>
                <LibroMayor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/balance-comprobacion"
            element={
              <ProtectedRoute>
                <BalanceComprobacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/estados-financieros"
            element={
              <ProtectedRoute>
                <EstadosFinancieros />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
