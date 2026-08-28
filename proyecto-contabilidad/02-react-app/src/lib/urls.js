/**
 * Dirección pública del sitio, la que se comparte con los clientes.
 *
 * Vercel genera dos tipos de dirección: la de producción, que es
 * pública, y las de vista previa, que pueden pedir iniciar sesión. Si
 * el enlace se armara con la dirección actual, un catálogo creado
 * desde una vista previa generaría un enlace inservible.
 *
 * Para fijarla, en Vercel → Settings → Environment Variables:
 *   VITE_PUBLIC_URL = https://micontabol.com
 * marcándola para Production, Preview y Development.
 */
const configurada = import.meta.env.VITE_PUBLIC_URL

export const URL_PUBLICA = (configurada || window.location.origin).replace(/\/+$/, '')

/** Enlace completo de un catálogo, listo para compartir. */
export function enlaceCatalogo(slug) {
  return `${URL_PUBLICA}/c/${slug}`
}

/** Lo que se muestra antes del nombre al editarlo: "misitio.com/c/" */
export function prefijoCatalogo() {
  return `${URL_PUBLICA}/c/`
}

/**
 * Detecta si estamos en una dirección de vista previa de Vercel.
 *
 * Producción es siempre "nombre.vercel.app". Las vistas previas
 * agregan tramos —la rama, el usuario, o un código aleatorio— y ese
 * código puede quedar en cualquier posición, no solo al final.
 */
export function esVistaPrevia() {
  const host = window.location.hostname
  if (!host.endsWith('.vercel.app')) return false

  const nombre = host.replace('.vercel.app', '')
  const tramos = nombre.split('-')

  if (tramos.includes('git')) return true

  const pareceCodigo = (t) =>
    t.length >= 8 && /[0-9]/.test(t) && /[a-z]/.test(t) && !/^[a-z]+$/.test(t)

  return tramos.some(pareceCodigo)
}

/** True si el sitio ya tiene su dirección pública configurada. */
export function tieneUrlConfigurada() {
  return Boolean(configurada)
}
