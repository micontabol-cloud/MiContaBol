// Dado el plan de cuentas y una lista de movimientos (ya filtrados por
// fecha si aplica), calcula total debe, total haber y saldo por cuenta.
// El saldo depende de la naturaleza contable de cada cuenta.
export function calcularSaldosPorCuenta(cuentas, movimientos) {
  const porCuenta = new Map()

  cuentas.forEach((c) => {
    porCuenta.set(c.id, { ...c, total_debe: 0, total_haber: 0 })
  })

  movimientos.forEach((m) => {
    const fila = porCuenta.get(m.cuenta_id)
    if (!fila) return
    fila.total_debe += Number(m.debe)
    fila.total_haber += Number(m.haber)
  })

  return Array.from(porCuenta.values()).map((f) => ({
    ...f,
    saldo: f.naturaleza === 'deudora' ? f.total_debe - f.total_haber : f.total_haber - f.total_debe,
  }))
}
