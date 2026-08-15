import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Muestra una imagen en grande sobre el resto de la pantalla.
 * Se cierra al tocar fuera, con la X, o con Escape.
 */
export default function VisorImagen({ url, alt = '', onCerrar }) {
  useEffect(() => {
    function alPresionar(e) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPresionar)

    // Evita que la página de atrás se desplace mientras se mira la foto
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = overflowPrevio
    }
  }, [onCerrar])

  if (!url) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 26, 41, 0.85)',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1.25rem',
        zIndex: 120,
        cursor: 'zoom-out',
      }}
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
      >
        <X size={20} strokeWidth={2} />
      </button>

      <img
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 12,
          cursor: 'default',
        }}
      />

      {alt && (
        <p
          style={{
            position: 'absolute',
            bottom: 20,
            color: 'rgba(255,255,255,0.75)',
            fontSize: '0.9rem',
            margin: 0,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {alt}
        </p>
      )}
    </div>
  )
}
