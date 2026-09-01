/**
 * Trabajador de servicio de MiContaBol.
 *
 * Su único propósito hoy es habilitar la instalación como app:
 * el navegador solo ofrece "Agregar a pantalla de inicio" si
 * existe uno registrado.
 *
 * A propósito NO guarda páginas en caché. MiContaBol muestra
 * saldos, stock y ventas: mostrar datos viejos de una caché
 * sería peor que no mostrar nada. Si no hay internet, que el
 * navegador avise.
 */

const VERSION = 'micontabol-v1'

self.addEventListener('install', (evento) => {
  // Toma control de inmediato, sin esperar a que se cierren
  // las pestañas viejas
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (evento) => {
  // Todo va directo a la red. Sin caché, sin datos viejos.
  return
})
