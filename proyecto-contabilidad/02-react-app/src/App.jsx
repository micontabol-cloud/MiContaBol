import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import MisEmpresas from './pages/MisEmpresas'
import Admin from './pages/Admin'
import NuevaEmpresa from './pages/NuevaEmpresa'
import EmpresaLayout from './pages/EmpresaLayout'
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

          {/* Todas las pantallas de una empresa comparten el sidebar */}
          <Route
            path="/empresas/:id"
            element={
              <ProtectedRoute>
                <EmpresaLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmpresaDashboard />} />
            <Route path="cuentas" element={<PlanCuentas />} />
            <Route path="comprobantes" element={<Comprobantes />} />
            <Route path="comprobantes/nuevo" element={<NuevoComprobante />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="inventario/productos" element={<Productos />} />
            <Route path="inventario/venta" element={<NuevaVentaProducto />} />
            <Route path="inventario/compra" element={<NuevaCompraProducto />} />
            <Route path="cuentas-por-cobrar" element={<CuentasPorCobrar />} />
            <Route path="analisis-costo" element={<AnalisisCosto />} />
            <Route path="asientos" element={<Asientos />} />
            <Route path="asientos/nuevo" element={<NuevoAsiento />} />
            <Route path="libro-mayor" element={<LibroMayor />} />
            <Route path="balance-comprobacion" element={<BalanceComprobacion />} />
            <Route path="estados-financieros" element={<EstadosFinancieros />} />
            <Route path="miembros" element={<Miembros />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
