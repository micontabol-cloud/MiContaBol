// ¿Estamos dentro de la app del celular (Android / iPhone)?
//
// La app de las tiendas solo sirve para entrar a la cuenta y mirar la
// página principal. Los precios, los planes, el mes gratis y el registro
// son SOLO de la web (así lo piden App Store y Google Play).
//
// Para probar el "modo app" desde el navegador de la compu, abre
//   https://micontabol.com/?app=1      (se queda activo en esa pestaña)
//   https://micontabol.com/?app=0      (lo apaga)
function detectar() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true
    const params = new URLSearchParams(window.location.search)
    if (params.get('app') === '1') sessionStorage.setItem('modo-app', '1')
    if (params.get('app') === '0') sessionStorage.removeItem('modo-app')
    return sessionStorage.getItem('modo-app') === '1'
  } catch {
    return false
  }
}

export const ES_APP = typeof window !== 'undefined' && detectar()
