import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import RequiereRol from './components/RequiereRol'
import Landing from './pages/Landing'
import CatalogoPublico from './pages/CatalogoPublico'
import Privacidad from './pages/Privacidad'
import Terminos from './pages/Terminos'
import Catalogos from './pages/Catalogos'
import CatalogoEditor from './pages/CatalogoEditor'
import IdentidadNegocio from './pages/IdentidadNegocio'
import PerfilEmpresa from './pages/PerfilEmpresa'
import Login from './pages/Login'
import MisEmpresas from './pages/MisEmpresas'
import Perfil from './pages/Perfil'
import Suscripcion from './pages/Suscripcion'
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
import ImportarProductos from './pages/ImportarProductos'
import PapeleraProductos from './pages/PapeleraProductos'
import ConteosFisicos from './pages/ConteosFisicos'
import ConteoDetalle from './pages/ConteoDetalle'
import NuevaVentaProducto from './pages/NuevaVentaProducto'
import NuevaCompraProducto from './pages/NuevaCompraProducto'
import CuentasPorCobrar from './pages/CuentasPorCobrar'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import MetodosPago from './pages/MetodosPago'
import CuentasPorPagar from './pages/CuentasPorPagar'
import Caja from './pages/Caja'
import Bancos from './pages/Bancos'
import Personal from './pages/Personal'
import Promotores from './pages/Promotores'
import ConsignacionPromotor from './pages/ConsignacionPromotor'
import PromotorInicio from './pages/PromotorInicio'
import PromotorCatalogo from './pages/PromotorCatalogo'
import PromotorVender from './pages/PromotorVender'
import PromotorVentas from './pages/PromotorVentas'
import PromotorCuenta from './pages/PromotorCuenta'
import PromotorComisiones from './pages/PromotorComisiones'
import ActivosFijos from './pages/ActivosFijos'
import Conciliacion from './pages/Conciliacion'
import AnalisisCosto from './pages/AnalisisCosto'
import Asientos from './pages/Asientos'
import NuevoAsiento from './pages/NuevoAsiento'
import LibroMayor from './pages/LibroMayor'
import BalanceComprobacion from './pages/BalanceComprobacion'
import EstadosFinancieros from './pages/EstadosFinancieros'
import Reportes from './pages/Reportes'
import ResultadoOperativo from './pages/ResultadoOperativo'
import CierreContable from './pages/CierreContable'
import Miembros from './pages/Miembros'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Catálogo público: se abre sin iniciar sesión */}
          <Route path="/c/:slug" element={<CatalogoPublico />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
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
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suscripcion"
            element={
              <ProtectedRoute>
                <Suscripcion />
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
            <Route
              path="cuentas"
              element={
                <RequiereRol>
                  <PlanCuentas />
                </RequiereRol>
              }
            />
            <Route path="ventas" element={<Ventas />} />
            <Route path="ventas/nueva-simple" element={<NuevoComprobante />} />
            <Route path="compras" element={<Compras />} />
            <Route path="compras/nueva-simple" element={<NuevoComprobante />} />
            <Route path="comprobantes" element={<Comprobantes />} />
            <Route path="comprobantes/nuevo" element={<NuevoComprobante />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="inventario/productos" element={<Productos />} />
            <Route path="inventario/productos/:productoId" element={<ProductoDetalle />} />
            <Route path="inventario/importar" element={<ImportarProductos />} />
            <Route
              path="inventario/papelera"
              element={
                <RequiereRol>
                  <PapeleraProductos />
                </RequiereRol>
              }
            />
            <Route path="inventario/conteos" element={<ConteosFisicos />} />
            <Route path="inventario/conteos/:conteoId" element={<ConteoDetalle />} />
            <Route path="inventario/venta" element={<NuevaVentaProducto />} />
            <Route path="inventario/compra" element={<NuevaCompraProducto />} />
            <Route path="cuentas-por-cobrar" element={<CuentasPorCobrar />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="catalogos" element={<Catalogos />} />
            <Route path="catalogos/identidad" element={<IdentidadNegocio />} />
            <Route path="catalogos/:catalogoId" element={<CatalogoEditor />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route
              path="formas-de-pago"
              element={
                <RequiereRol>
                  <MetodosPago />
                </RequiereRol>
              }
            />
            <Route path="cuentas-por-pagar" element={<CuentasPorPagar />} />
            <Route path="caja" element={<Caja />} />
            <Route
              path="personal"
              element={
                <RequiereRol>
                  <Personal />
                </RequiereRol>
              }
            />
            {/* Quienes venden por fuera, con mercadería tuya */}
            <Route
              path="promotores"
              element={
                <RequiereRol>
                  <Promotores />
                </RequiereRol>
              }
            />
            <Route
              path="promotores/:promotorId/mercaderia"
              element={
                <RequiereRol>
                  <ConsignacionPromotor />
                </RequiereRol>
              }
            />

            {/* Las pantallas del promotor. Sin RequiereRol: las
                funciones que llaman ya verifican que quien entra
                sea promotor, y este componente exige roles
                internos que el promotor no tiene. */}
            <Route path="promotor" element={<PromotorInicio />} />
            <Route path="promotor/catalogo" element={<PromotorCatalogo />} />
            <Route path="promotor/vender" element={<PromotorVender />} />
            <Route path="promotor/ventas" element={<PromotorVentas />} />
            <Route path="promotor/cuenta" element={<PromotorCuenta />} />
            <Route path="promotor/comisiones" element={<PromotorComisiones />} />
            {/* Bienes del negocio: vitrinas, vehículos, computadoras */}
            <Route
              path="activos"
              element={
                <RequiereRol>
                  <ActivosFijos />
                </RequiereRol>
              }
            />
            <Route
              path="bancos"
              element={
                <RequiereRol>
                  <Bancos />
                </RequiereRol>
              }
            />
            <Route
              path="bancos/conciliacion/:conciliacionId"
              element={
                <RequiereRol>
                  <Conciliacion />
                </RequiereRol>
              }
            />
            <Route
              path="analisis-costo"
              element={
                <RequiereRol>
                  <AnalisisCosto />
                </RequiereRol>
              }
            />
            <Route
              path="asientos"
              element={
                <RequiereRol>
                  <Asientos />
                </RequiereRol>
              }
            />
            <Route
              path="asientos/nuevo"
              element={
                <RequiereRol>
                  <NuevoAsiento />
                </RequiereRol>
              }
            />
            <Route
              path="libro-mayor"
              element={
                <RequiereRol>
                  <LibroMayor />
                </RequiereRol>
              }
            />
            <Route
              path="balance-comprobacion"
              element={
                <RequiereRol>
                  <BalanceComprobacion />
                </RequiereRol>
              }
            />
            <Route
              path="estados-financieros"
              element={
                <RequiereRol>
                  <EstadosFinancieros />
                </RequiereRol>
              }
            />
            <Route
              path="reportes"
              element={
                <RequiereRol>
                  <Reportes />
                </RequiereRol>
              }
            />
            {/* ¿Gana tu negocio? — el estado de resultados con EBITDA */}
            <Route
              path="resultado-operativo"
              element={
                <RequiereRol>
                  <ResultadoOperativo />
                </RequiereRol>
              }
            />
            <Route
              path="cierre"
              element={
                <RequiereRol>
                  <CierreContable />
                </RequiereRol>
              }
            />
            <Route
              path="perfil-empresa"
              element={
                <RequiereRol nivel="admin">
                  <PerfilEmpresa />
                </RequiereRol>
              }
            />
            <Route
              path="miembros"
              element={
                <RequiereRol nivel="admin">
                  <Miembros />
                </RequiereRol>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
