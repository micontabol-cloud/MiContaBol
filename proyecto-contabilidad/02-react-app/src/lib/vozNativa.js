// Dictado por voz DENTRO de la app del celular.
// Necesita el plugin:  npm i @capacitor-community/speech-recognition  y  npx cap sync
// (ver LEEME.txt). Solo se descarga cuando alguien toca el micrófono en la app.
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

export async function iniciarVozNativa({ onTexto, onFin, onError }) {
  let terminado = false
  const terminar = () => {
    if (terminado) return
    terminado = true
    SpeechRecognition.removeAllListeners().catch(() => {})
    onFin()
  }

  try {
    const { available } = await SpeechRecognition.available()
    if (!available) {
      onError('no_disponible')
      terminar()
      return { parar() {} }
    }

    let permiso = await SpeechRecognition.checkPermissions()
    if (permiso.speechRecognition !== 'granted') permiso = await SpeechRecognition.requestPermissions()
    if (permiso.speechRecognition !== 'granted') {
      onError('permiso')
      terminar()
      return { parar() {} }
    }

    await SpeechRecognition.removeAllListeners()
    await SpeechRecognition.addListener('partialResults', (d) => {
      const t = d?.matches?.[0]
      if (t) onTexto(String(t).trim())
    })
    await SpeechRecognition.addListener('listeningState', (d) => {
      if (d?.status === 'stopped') terminar()
    })

    // es-MX: entiende bien el español de Latinoamérica en iPhone y en Android.
    await SpeechRecognition.start({ language: 'es-MX', maxResults: 1, partialResults: true, popup: false })
  } catch (e) {
    console.error('Voz nativa:', e)
    onError('otro')
    terminar()
  }

  return {
    parar() {
      SpeechRecognition.stop().catch(() => {})
      terminar()
    },
  }
}
