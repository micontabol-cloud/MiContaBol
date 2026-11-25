import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import RequiereRol from './components/RequiereRol'
import Landing from './pages/Landing'
import Login from './pages/Login'
import EmpresaLayout from './pages/EmpresaLayout'

// Carga diferida: cada pantalla se descarga solo cuando se entra a ella.
// Si después de publicar una versión nueva el archivo viejo ya no existe,
// se recarga la página una sola vez para traer la versión actual.
function cargar(importar) {
  return lazy(() =>
    importar()
      .then((modulo) => {
        try {
          sessionStorage.removeItem('recarga-por-version')
        } catch {
          // sin acceso a storage
        }
        return modulo
      })
      .catch((error) => {
        try {
          if (!sessionStorage.getItem('recarga-por-version')) {
            sessionStorage.setItem('recarga-por-version', '1')
            window.location.reload()
            return new Promise(() => {})
          }
        } catch {
          // sin acceso a storage
        }
        throw error
      })
  )
}

function Cargando() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: '0.9rem',
      }}
    >
      Cargando…
    </div>
  )
}

const CatalogoPublico = cargar(() => import('./pages/CatalogoPublico'))
const Privacidad = cargar(() => import('./pages/Privacidad'))
const Terminos = cargar(() => import('./pages/Terminos'))
const Catalogos = cargar(() => import('./pages/Catalogos'))
const CatalogoEditor = cargar(() => import('./pages/CatalogoEditor'))
const IdentidadNegocio = cargar(() => import('./pages/IdentidadNegocio'))
const PerfilEmpresa = cargar(() => import('./pages/PerfilEmpresa'))
const MisEmpresas = cargar(() => import('./pages/MisEmpresas'))
const Perfil = cargar(() => import('./pages/Perfil'))
const Suscripcion = cargar(() => import('./pages/Suscripcion'))
const Admin = cargar(() => import('./pages/Admin'))
const NuevaEmpresa = cargar(() => import('./pages/NuevaEmpresa'))
const EmpresaDashboard = cargar(() => import('./pages/EmpresaDashboard'))
const PlanCuentas = cargar(() => import('./pages/PlanCuentas'))
const Comprobantes = cargar(() => import('./pages/Comprobantes'))
const NuevoComprobante = cargar(() => import('./pages/NuevoComprobante'))
const Ventas = cargar(() => import('./pages/Ventas'))
const Compras = cargar(() => import('./pages/Compras'))
const Inventario = cargar(() => import('./pages/Inventario'))
const Productos = cargar(() => import('./pages/Productos'))
const ProductoDetalle = cargar(() => import('./pages/ProductoDetalle'))
const ImportarProductos = cargar(() => import('./pages/ImportarProductos'))
const PapeleraProductos = cargar(() => import('./pages/PapeleraProductos'))
const ConteosFisicos = cargar(() => import('./pages/ConteosFisicos'))
const ConteoDetalle = cargar(() => import('./pages/ConteoDetalle'))
const NuevaVentaProducto = cargar(() => import('./pages/NuevaVentaProducto'))
const NuevaCompraProducto = cargar(() => import('./pages/NuevaCompraProducto'))
const CuentasPorCobrar = cargar(() => import('./pages/CuentasPorCobrar'))
const Clientes = cargar(() => import('./pages/Clientes'))
const Proveedores = cargar(() => import('./pages/Proveedores'))
const MetodosPago = cargar(() => import('./pages/MetodosPago'))
const CuentasPorPagar = cargar(() => import('./pages/CuentasPorPagar'))
const Caja = cargar(() => import('./pages/Caja'))
const Bancos = cargar(() => import('./pages/Bancos'))
const Personal = cargar(() => import('./pages/Personal'))
const Promotores = cargar(() => import('./pages/Promotores'))
const ConsignacionPromotor = cargar(() => import('./pages/ConsignacionPromotor'))
const PromotorInicio = cargar(() => import('./pages/PromotorInicio'))
const PromotorCatalogo = cargar(() => import('./pages/PromotorCatalogo'))
const PromotorVender = cargar(() => import('./pages/PromotorVender'))
const PromotorVentas = cargar(() => import('./pages/PromotorVentas'))
const PromotorCuenta = cargar(() => import('./pages/PromotorCuenta'))
const PromotorComisiones = cargar(() => import('./pages/PromotorComisiones'))
const ActivosFijos = cargar(() => import('./pages/ActivosFijos'))
const Conciliacion = cargar(() => import('./pages/Conciliacion'))
const AnalisisCosto = cargar(() => import('./pages/AnalisisCosto'))
const Asientos = cargar(() => import('./pages/Asientos'))
const NuevoAsiento = cargar(() => import('./pages/NuevoAsiento'))
const LibroMayor = cargar(() => import('./pages/LibroMayor'))
const BalanceComprobacion = cargar(() => import('./pages/BalanceComprobacion'))
const EstadosFinancieros = cargar(() => import('./pages/EstadosFinancieros'))
const Reportes = cargar(() => import('./pages/Reportes'))
const ResultadoOperativo = cargar(() => import('./pages/ResultadoOperativo'))
const CierreContable = cargar(() => import('./pages/CierreContable'))
const Miembros = cargar(() => import('./pages/Miembros'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Cargando />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
