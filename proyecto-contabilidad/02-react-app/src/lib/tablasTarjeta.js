// MiContaBol · tablas que en el celular se ven como tarjetas.
// Una tabla con className="tabla-cards" se dibuja como una lista de tarjetas en pantallas
// angostas (el CSS está en index.css). Este archivo solo copia el título de cada columna
// a cada celda (data-label) para que la tarjeta diga "Fecha: …", "Monto: …".
function etiquetar(tabla) {
  const titulos = Array.from(tabla.querySelectorAll('thead th')).map((th) => (th.textContent || '').trim())
  if (!titulos.length) return
  tabla.querySelectorAll('tbody tr').forEach((fila) => {
    const celdas = Array.from(fila.children)
    // Filas de detalle (una sola celda que ocupa todo el ancho): sin etiqueta.
    if (celdas.length === 1 || celdas.some((c) => c.colSpan > 1)) return
    celdas.forEach((td, i) => {
      const t = titulos[i] ?? ''
      if (td.getAttribute('data-label') !== t) td.setAttribute('data-label', t)
    })
  })
}

function revisar(raiz) {
  if (raiz.nodeType !== 1) return
  if (raiz.matches?.('table.tabla-cards')) etiquetar(raiz)
  raiz.querySelectorAll?.('table.tabla-cards').forEach(etiquetar)
  const t = raiz.closest?.('table.tabla-cards')
  if (t) etiquetar(t)
}

export function activarTablasTarjeta() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  let pendiente = false
  const cola = new Set()
  const vaciar = () => {
    pendiente = false
    cola.forEach(revisar)
    cola.clear()
  }
  new MutationObserver((cambios) => {
    for (const c of cambios) c.addedNodes.forEach((n) => cola.add(n.nodeType === 1 ? n : c.target))
    if (!pendiente) {
      pendiente = true
      requestAnimationFrame(vaciar)
    }
  }).observe(document.body, { childList: true, subtree: true })
  revisar(document.body)
}
