/**
 * Cuando el comerciante crea una subcuenta, el ejemplo que ve debería
 * tener sentido para ESA cuenta. Un "ej. Banco Nacional MN 342432" no
 * ayuda si está desglosando Sueldos.
 *
 * Se busca por palabra clave en el nombre de la cuenta padre, y si no
 * hay coincidencia se cae a un ejemplo genérico según el tipo.
 */

const POR_NOMBRE = [
  { claves: ['caja chica'], ejemplo: 'Caja chica administración' },
  { claves: ['caja'], ejemplo: 'Caja sucursal Centro' },
  { claves: ['banco'], ejemplo: 'Banco Nacional MN 342432' },
  { claves: ['cobrar'], ejemplo: 'Clientes al crédito' },
  { claves: ['inventario', 'mercader'], ejemplo: 'Mercadería en tienda' },
  { claves: ['anticipo'], ejemplo: 'Anticipo Distribuidora Central' },
  { claves: ['mueble', 'enser'], ejemplo: 'Vitrinas y estanterías' },
  { claves: ['equipo', 'computac'], ejemplo: 'Computadora del mostrador' },
  { claves: ['vehículo', 'vehiculo'], ejemplo: 'Camioneta placa 1234-ABC' },
  { claves: ['depreciación', 'depreciacion'], ejemplo: 'Depreciación de vehículos' },
  { claves: ['pagar'], ejemplo: 'Distribuidora Central' },
  { claves: ['préstamo', 'prestamo'], ejemplo: 'Préstamo Banco Unión' },
  { claves: ['impuesto'], ejemplo: 'Cuota Régimen Simplificado' },
  { claves: ['sueldo', 'salario'], ejemplo: 'Sueldos de vendedores' },
  { claves: ['capital'], ejemplo: 'Aporte del socio' },
  { claves: ['resultado'], ejemplo: 'Utilidad gestión 2025' },
  { claves: ['venta'], ejemplo: 'Ventas al por mayor' },
  { claves: ['otros ingresos'], ejemplo: 'Alquiler de vitrina' },
  { claves: ['descuento', 'devoluc'], ejemplo: 'Descuentos por temporada' },
  { claves: ['costo de venta'], ejemplo: 'Costo de mercadería importada' },
  { claves: ['alquiler'], ejemplo: 'Alquiler del local' },
  { claves: ['servicio'], ejemplo: 'Luz eléctrica' },
  { claves: ['publicidad', 'marketing'], ejemplo: 'Publicidad en redes' },
  { claves: ['merma', 'pérdida', 'perdida'], ejemplo: 'Productos vencidos' },
  { claves: ['bancario'], ejemplo: 'Comisión por transferencias' },
  { claves: ['transporte', 'flete'], ejemplo: 'Fletes de proveedores' },
]

const POR_TIPO = {
  activo: 'Detalle del activo',
  pasivo: 'Detalle de la deuda',
  patrimonio: 'Detalle del patrimonio',
  ingreso: 'Tipo de ingreso',
  gasto: 'Tipo de gasto',
  orden: 'Detalle',
}

export function sugerenciaSubcuenta(nombrePadre = '', tipo = '') {
  const nombre = nombrePadre.toLowerCase()
  const encontrada = POR_NOMBRE.find((r) => r.claves.some((c) => nombre.includes(c)))
  if (encontrada) return encontrada.ejemplo
  return POR_TIPO[tipo] || 'Nombre de la subcuenta'
}

/**
 * Frase de ayuda que explica para qué sirve desglosar esa cuenta.
 */
export function ayudaSubcuenta(nombrePadre = '') {
  const nombre = nombrePadre.toLowerCase()

  if (nombre.includes('banco')) return 'Crea una subcuenta por cada cuenta bancaria que tengas.'
  if (nombre.includes('caja')) return 'Útil si manejas más de una caja o sucursal.'
  if (nombre.includes('cobrar')) return 'Puedes separar por tipo de cliente o por plazo.'
  if (nombre.includes('pagar')) return 'Una subcuenta por proveedor te deja ver a quién le debes más.'
  if (nombre.includes('servicio')) return 'Separa luz, agua, internet... así ves cuál te cuesta más.'
  if (nombre.includes('venta')) return 'Sirve para separar canales: mostrador, mayoreo, delivery.'
  if (nombre.includes('sueldo')) return 'Puedes separar por área: ventas, administración.'
  if (nombre.includes('vehículo') || nombre.includes('vehiculo')) return 'Una subcuenta por vehículo.'

  return 'Las subcuentas te dejan ver el detalle sin llenar de cuentas el nivel principal.'
}
