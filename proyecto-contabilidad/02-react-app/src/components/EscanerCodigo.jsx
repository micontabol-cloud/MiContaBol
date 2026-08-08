import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, X } from 'lucide-react'

/**
 * Lee códigos de barras por dos caminos, porque cada uno gana en un
 * escenario distinto:
 *
 *   - Lector láser USB o Bluetooth: se comporta como un teclado, así
 *     que basta con dejar un campo enfocado escuchando. Es lo más
 *     rápido y fiable para un mostrador con volumen.
 *   - Cámara del celular: no requiere comprar nada, ideal para
 *     inventariar caminando entre estantes.
 *
 * Se usa ZXing en vez de la API nativa del navegador porque esa última
 * no existe en Safari/iPhone.
 */
export default function EscanerCodigo({ onCodigo, autoFocus = true, placeholder = 'Escanea o escribe el código...' }) {
  const [texto, setTexto] = useState('')
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const videoRef = useRef(null)
  const controlsRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  useEffect(() => {
    if (!camaraActiva) return

    let cancelado = false
    const lector = new BrowserMultiFormatReader()

    async function iniciar() {
      try {
        const controls = await lector.decodeFromVideoDevice(
          undefined, // cámara por defecto (trasera en celular)
          videoRef.current,
          (resultado) => {
            if (resultado && !cancelado) {
              const valor = resultado.getText()
              // Vibra si el dispositivo lo permite: confirma el
              // escaneo sin tener que mirar la pantalla.
              if (navigator.vibrate) navigator.vibrate(60)
              onCodigo(valor)
            }
          }
        )
        controlsRef.current = controls
      } catch (err) {
        if (!cancelado) {
          setError(
            err?.name === 'NotAllowedError'
              ? 'No diste permiso para usar la cámara. Habilítalo en tu navegador e intenta de nuevo.'
              : `No se pudo abrir la cámara: ${err.message}`
          )
          setCamaraActiva(false)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      try {
        controlsRef.current?.stop()
      } catch {
        // el lector ya estaba detenido
      }
    }
  }, [camaraActiva, onCodigo])

  function manejarTecla(e) {
    // Los lectores láser terminan con Enter
    if (e.key === 'Enter') {
      e.preventDefault()
      const valor = texto.trim()
      if (valor) {
        onCodigo(valor)
        setTexto('')
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <input
          ref={inputRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={manejarTecla}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 200, fontSize: '1rem', padding: '0.7rem 0.9rem' }}
        />
        <button
          type="button"
          onClick={() => {
            setError(null)
            setCamaraActiva(!camaraActiva)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          {camaraActiva ? <X size={17} strokeWidth={1.8} /> : <Camera size={17} strokeWidth={1.8} />}
          {camaraActiva ? 'Cerrar cámara' : 'Usar cámara'}
        </button>
      </div>

      {error && <p style={{ color: '#EF4444', fontSize: '0.88rem', marginTop: '0.5rem' }}>{error}</p>}

      {camaraActiva && (
        <div
          style={{
            marginTop: '0.75rem',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #E6ECF3',
            background: '#000',
            position: 'relative',
          }}
        >
          <video ref={videoRef} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
          <div
            style={{
              position: 'absolute',
              inset: '18% 10%',
              border: '2px solid rgba(242, 85, 90, 0.9)',
              borderRadius: 12,
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.8rem', marginTop: '0.5rem' }}>
        Si tienes lector láser, solo dispara: escribe el código y lo toma solo.
      </p>
    </div>
  )
}
