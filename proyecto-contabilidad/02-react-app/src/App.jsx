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
import Inventario from './pages/Inventario'
import Productos from './pages/Productos'
import NuevaVentaProducto from './pages/NuevaVentaProducto'
import NuevaCompraProducto from './pages/NuevaCompraProducto'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import AnalisisCosto from './pages/AnalisisCosto'
import Asientos from './pages/Asientos'
import NuevoAsiento from './pages/NuevoAsiento'
import LibroMayor from './pages/LibroMayor'
import BalanceComprobacion from './pages/BalanceComprobacion'
import EstadosFinancieros from './pages/EstadosFinancieros'
import Miembros from './pages/Miembros'

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
            path="/empresas/:id/inventario"
            element={
              <ProtectedRoute>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/inventario/productos"
            element={
              <ProtectedRoute>
                <Productos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/inventario/venta"
            element={
              <ProtectedRoute>
                <NuevaVentaProducto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/inventario/compra"
            element={
              <ProtectedRoute>
                <NuevaCompraProducto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/cuentas-por-cobrar"
            element={
              <ProtectedRoute>
                <CuentasPorCobrar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas/:id/analisis-costo"
            element={
              <ProtectedRoute>
                <AnalisisCosto />
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
          <Route
            path="/empresas/:id/miembros"
            element={
              <ProtectedRoute>
                <Miembros />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
