// Dictado por voz para Boli.
//
//  - En la web usa el reconocimiento de voz del propio navegador (Chrome, Edge,
//    Safari). No cuesta nada y no sale de ahí.
//  - En la app del celular (iPhone / Android) el navegador interno NO trae voz,
//    así que se usa el plugin de Capacitor (ver vozNativa.js).
//
// Siempre devuelve el texto en pantalla para que la persona lo revise antes de
// enviarlo: nunca se manda una pregunta sola.
import { ES_APP } from './plataforma'

const RecWeb = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export function vozDisponible() {
  return ES_APP || !!RecWeb
}

/**
 * Empieza a escuchar.
 *   onTexto(texto)  — lo que se va entendiendo (se llama varias veces)
 *   onFin()         — dejó de escuchar (por silencio o porque se tocó parar)
 *   onError(codigo) — 'permiso' | 'sin_voz' | 'no_disponible' | 'otro'
 * Devuelve { parar() }.
 */
export async function iniciarVoz({ onTexto, onFin, onError }) {
  if (ES_APP) {
    const { iniciarVozNativa } = await import('./vozNativa')
    return iniciarVozNativa({ onTexto, onFin, onError })
  }

  if (!RecWeb) {
    onError('no_disponible')
    onFin()
    return { parar() {} }
  }

  const rec = new RecWeb()
  const idioma = (navigator.language || '').toLowerCase().startsWith('es') ? navigator.language : 'es-BO'
  rec.lang = idioma
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1

  rec.onresult = (e) => {
    let t = ''
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
    onTexto(t.trim())
  }
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') onError('permiso')
    else if (e.error === 'no-speech' || e.error === 'aborted') onError('sin_voz')
    else onError('otro')
  }
  rec.onend = () => onFin()

  try {
    rec.start()
  } catch {
    onError('otro')
    onFin()
  }
  return {
    parar() {
      try {
        rec.stop()
      } catch {
        /* ya estaba detenido */
      }
    },
  }
}
