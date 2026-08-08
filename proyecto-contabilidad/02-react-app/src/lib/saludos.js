/**
 * Decide qué dice Boli al entrar, según la fecha, los hitos del
 * negocio y su estado actual.
 *
 * Las reglas se evalúan de la más específica a la más general: un hito
 * (primera venta, 100 ventas) gana sobre el saludo del día de la
 * semana, porque es el momento que de verdad vale celebrar.
 *
 * Tono: cálido pero profesional. Boli es un asistente, no un payaso —
 * mensajes cortos, sin diminutivos ni exceso de signos.
 */

const HITOS = [1000, 500, 250, 100, 50, 25, 10]

export function saludoDeBoli({
  nombre = '',
  fechaNacimiento = null,
  ventasHoy = 0,
  montoHoy = 0,
  totalVentasHistorico = 0,
  hayStockBajo = false,
  hayAgotados = false,
  fecha = new Date(),
} = {}) {
  const mes = fecha.getMonth() + 1
  const dia = fecha.getDate()
  const diaSemana = fecha.getDay() // 0 domingo, 1 lunes...

  // El nombre de pila hace que el saludo se sienta personal sin
  // resultar formal: "Pepe" en vez de "Pepe Severiche Rojas".
  const nombrePila = String(nombre || '').trim().split(/\s+/)[0] || ''
  const conNombre = nombrePila ? `, ${nombrePila}` : ''

  // --- Cumpleaños: gana sobre todo lo demás ---
  if (fechaNacimiento) {
    // Se parte el texto a mano para evitar que la zona horaria
    // corra la fecha un día.
    const [, mesNac, diaNac] = String(fechaNacimiento).split('-').map(Number)
    if (mesNac === mes && diaNac === dia) {
      return {
        mensaje: `🎂 ¡Feliz cumpleaños${conNombre}! Que sea un gran año para ti y tu negocio.`,
        pose: 'celebrando',
      }
    }
  }

  // --- Fechas especiales ---
  if (mes === 12 && (dia === 24 || dia === 25)) {
    return { mensaje: '🎄 ¡Feliz Navidad! Que sea una buena temporada para tu negocio.', pose: 'celebrando' }
  }
  if ((mes === 12 && dia === 31) || (mes === 1 && dia === 1)) {
    return { mensaje: '🎉 ¡Feliz año nuevo! Un año más para hacer crecer tu negocio.', pose: 'celebrando' }
  }

  // --- Hitos de ventas ---
  if (totalVentasHistorico === 1) {
    return { mensaje: '🥳 ¡Registraste tu primera venta! Así empiezan todos los negocios grandes.', pose: 'celebrando' }
  }
  const hito = HITOS.find((h) => totalVentasHistorico === h)
  if (hito) {
    return { mensaje: `🔥 ¡Ya llevas ${hito} ventas registradas! Vas muy bien.`, pose: 'celebrando' }
  }

  // --- Cómo va el día ---
  if (ventasHoy >= 10) {
    return {
      mensaje: `🚀 ¡Qué día! Ya llevas ${ventasHoy} ventas por Bs ${Number(montoHoy).toFixed(2)}.`,
      pose: 'celebrando',
    }
  }

  // --- Cosas que necesitan atención ---
  if (hayAgotados) {
    return { mensaje: 'Tienes productos agotados. Conviene reponerlos antes de perder ventas.', pose: 'alerta' }
  }
  if (hayStockBajo) {
    return { mensaje: 'Hay productos por acabarse. Échales un ojo cuando puedas.', pose: 'consejo' }
  }

  // --- Saludo del día de la semana ---
  if (diaSemana === 1) {
    return { mensaje: `🚀 ¡Buen inicio de semana${conNombre}! Aquí está tu resumen.`, pose: 'hola' }
  }
  if (diaSemana === 5) {
    return { mensaje: `💪 ¡Último esfuerzo de la semana${conNombre}!`, pose: 'hola' }
  }
  if (diaSemana === 6 || diaSemana === 0) {
    return { mensaje: `Buen fin de semana${conNombre}. Así va tu negocio.`, pose: 'hola' }
  }

  if (ventasHoy > 0) {
    return { mensaje: `Buen ritmo: ${ventasHoy} ${ventasHoy === 1 ? 'venta' : 'ventas'} hoy.`, pose: 'exito' }
  }

  return {
    mensaje: nombrePila ? `Hola${conNombre}. Aquí está el resumen de tu negocio.` : 'Aquí está el resumen de tu negocio.',
    pose: 'hola',
  }
}

/**
 * Pose característica de cada módulo, para que cada sección tenga su
 * propia personalidad.
 */
export const POSE_MODULO = {
  inicio: 'hola',
  ventas: 'exito',
  compras: 'revisando',
  inventario: 'revisando',
  clientes: 'agradecido',
  caja: 'exito',
  reportes: 'consejo',
  contabilidad: 'consejo',
}
