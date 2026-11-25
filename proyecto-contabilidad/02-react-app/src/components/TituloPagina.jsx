import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Nombre de cada pantalla: sale en la pestaña del navegador y en el historial (botón atrás).
// Cada línea es [cómo termina la dirección, nombre]. La empresa va después de /empresas/<id>.
const EMPRESA = [
  ['', 'Inicio'],
  ['/cuentas', 'Plan de cuentas'],
  ['/ventas', 'Ventas'],
  ['/ventas/nueva-simple', 'Nueva venta'],
  ['/compras', 'Compras'],
  ['/compras/nueva-simple', 'Nueva compra'],
  ['/comprobantes', 'Comprobantes'],
  ['/comprobantes/nuevo', 'Nuevo comprobante'],
  ['/inventario', 'Inventario'],
  ['/inventario/productos', 'Productos'],
  ['/inventario/productos/*', 'Producto'],
  ['/inventario/importar', 'Importar productos'],
  ['/inventario/papelera', 'Papelera de productos'],
  ['/inventario/conteos', 'Conteo físico'],
  ['/inventario/conteos/*', 'Conteo de inventario'],
  ['/inventario/venta', 'Vender'],
  ['/inventario/compra', 'Comprar mercadería'],
  ['/cuentas-por-cobrar', 'Cuentas por cobrar'],
  ['/cuentas-por-pagar', 'Cuentas por pagar'],
  ['/clientes', 'Clientes'],
  ['/proveedores', 'Proveedores'],
  ['/catalogos', 'Catálogos'],
  ['/catalogos/identidad', 'Identidad del negocio'],
  ['/catalogos/*', 'Editar catálogo'],
  ['/formas-de-pago', 'Formas de pago'],
  ['/caja', 'Caja'],
  ['/personal', 'Personal'],
  ['/promotores', 'Promotores'],
  ['/promotores/*', 'Mercadería del promotor'],
  ['/promotor', 'Mi resumen'],
  ['/promotor/catalogo', 'Qué puedo vender'],
  ['/promotor/vender', 'Vender'],
  ['/promotor/ventas', 'Mis ventas'],
  ['/promotor/cuenta', 'Mi cuenta'],
  ['/promotor/comisiones', 'Lo que he ganado'],
  ['/activos', 'Bienes del negocio'],
  ['/bancos', 'Bancos'],
  ['/bancos/conciliacion/*', 'Conciliación bancaria'],
  ['/analisis-costo', 'Análisis de costo'],
  ['/asientos', 'Asientos'],
  ['/asientos/nuevo', 'Nuevo asiento'],
  ['/libro-mayor', 'Libro mayor'],
  ['/balance-comprobacion', 'Balance de comprobación'],
  ['/estados-financieros', 'Estados financieros'],
  ['/reportes', 'Resumen de reportes'],
  ['/resultado-operativo', '¿Gana tu negocio?'],
  ['/cierre', 'Cierre de ejercicio'],
  ['/perfil-empresa', 'Mi negocio'],
  ['/miembros', 'Miembros'],
]

const GENERAL = {
  '/login': 'Iniciar sesión',
  '/privacidad': 'Política de privacidad',
  '/terminos': 'Términos y condiciones',
  '/soporte': 'Soporte',
  '/eliminar-cuenta': 'Eliminar mi cuenta',
  '/admin': 'Administración',
  '/empresas': 'Mis negocios',
  '/empresas/nueva': 'Nuevo negocio',
  '/perfil': 'Mi perfil',
  '/suscripcion': 'Mi plan',
}

function nombreDe(ruta) {
  const limpia = ruta.replace(/\/+$/, '') || '/'
  if (GENERAL[limpia]) return GENERAL[limpia]
  const m = limpia.match(/^\/empresas\/[^/]+(\/.*)?$/)
  if (!m) return null
  const resto = m[1] || ''
  for (const [patron, nombre] of EMPRESA) {
    if (patron.endsWith('/*')) {
      const base = patron.slice(0, -2)
      if (resto.startsWith(base + '/') && resto.split('/').length === base.split('/').length + 1) return nombre
      // /promotores/<id>/mercaderia
      if (base === '/promotores' && /^\/promotores\/[^/]+\/mercaderia$/.test(resto)) return nombre
      if (base === '/bancos/conciliacion' && resto.startsWith(base + '/')) return nombre
    } else if (resto === patron) return nombre
  }
  return null
}

export default function TituloPagina() {
  const { pathname } = useLocation()
  const tipo = useNavigationType()

  useEffect(() => {
    // El catálogo público pone su propio título; la página principal conserva el de index.html.
    if (pathname === '/' || pathname.startsWith('/c/')) return
    const nombre = nombreDe(pathname)
    if (nombre) document.title = `${nombre} · MiContaBol`
  }, [pathname])

  // Pantalla nueva = arriba. Con el botón atrás, el navegador respeta donde ibas.
  useEffect(() => {
    if (tipo === 'PUSH') window.scrollTo(0, 0)
  }, [pathname, tipo])

  return null
}
