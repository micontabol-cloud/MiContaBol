import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import MisEmpresas from './pages/MisEmpresas'
import Admin from './pages/Admin'
import NuevaEmpresa from './pages/NuevaEmpresa'
import EmpresaLayout from './pages/EmpresaLayout'
import EmpresaDashboard from './pages/EmpresaDashboard'
import PlanCuentas from './pages/PlanCuentas'
import Comprobantes from './pages/Comprobantes'
import NuevoComprobante from './pages/NuevoComprobante'
import Ventas from './pages/Ventas'
import Compras from './pages/Compras'
import Inventario from './pages/Inventario'
import Productos from './pages/Productos'
import ProductoDetalle from './pages/ProductoDetalle'
import NuevaVentaProducto from './pages/NuevaVentaProducto'
import NuevaCompraProducto from './pages/NuevaCompraProducto'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import MetodosPago from './pages/MetodosPago'
import CuentasPorPagar from './pages/CuentasPorPagar'
import Caja from './pages/Caja'
import AnalisisCosto from './pages/AnalisisCosto'
import Asientos from './pages/Asientos'
import NuevoAsiento from './pages/NuevoAsiento'
import LibroMayor from './pages/LibroMayor'
import BalanceComprobacion from './pages/BalanceComprobacion'
import EstadosFinancieros from './pages/EstadosFinancieros'
import Reportes from './pages/Reportes'
import Miembros from './pages/Miembros'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
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
            <Route path="ventas" element={<Ventas />} />
            <Route path="ventas/nueva-simple" element={<NuevoComprobante />} />
            <Route path="compras" element={<Compras />} />
            <Route path="compras/nueva-simple" element={<NuevoComprobante />} />
            <Route path="comprobantes" element={<Comprobantes />} />
            <Route path="comprobantes/nuevo" element={<NuevoComprobante />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="inventario/productos" element={<Productos />} />
            <Route path="inventario/productos/:productoId" element={<ProductoDetalle />} />
            <Route path="inventario/venta" element={<NuevaVentaProducto />} />
            <Route path="inventario/compra" element={<NuevaCompraProducto />} />
            <Route path="cuentas-por-cobrar" element={<CuentasPorCobrar />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="formas-de-pago" element={<MetodosPago />} />
            <Route path="cuentas-por-pagar" element={<CuentasPorPagar />} />
            <Route path="caja" element={<Caja />} />
            <Route path="analisis-costo" element={<AnalisisCosto />} />
            <Route path="asientos" element={<Asientos />} />
            <Route path="asientos/nuevo" element={<NuevoAsiento />} />
            <Route path="libro-mayor" element={<LibroMayor />} />
            <Route path="balance-comprobacion" element={<BalanceComprobacion />} />
            <Route path="estados-financieros" element={<EstadosFinancieros />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="miembros" element={<Miembros />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
