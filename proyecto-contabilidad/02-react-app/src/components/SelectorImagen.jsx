import { useEffect, useState } from 'react'
import { Upload, Images, Trash2, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

/**
 * Campo para poner una imagen: subir una nueva o reutilizar alguna que
 * ya se haya subido antes. Sin esto, el mismo logo hay que subirlo de
 * nuevo para usarlo de portada.
 *
 * empresaId nulo = biblioteca personal (foto de perfil).
 */
export default function SelectorImagen({
  valor,
  onCambiar,
  empresaId = null,
  uso = 'otro',
  carpeta = 'imagenes',
  nombreSugerido = null,
  alto = 150,
  redondo = false,
  etiqueta = 'Imagen',
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [abierta, setAbierta] = useState(false)
  const [biblioteca, setBiblioteca] = useState([])
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false)
  const [error, setError] = useState(null)

  async function cargarBiblioteca() {
    setCargandoBiblioteca(true)
    const { data, error } = await supabase.rpc('mis_imagenes', { p_empresa_id: empresaId })
    if (error) setError(error.message)
    setBiblioteca(data || [])
    setCargandoBiblioteca(false)
  }

  useEffect(() => {
    if (abierta) cargarBiblioteca()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta])

  async function subir(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setSubiendo(true)

    const ext = archivo.name.split('.').pop()
    const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: errSubida } = await supabase.storage.from('productos').upload(ruta, archivo)

    if (errSubida) {
      setSubiendo(false)
      setError(`No se pudo subir: ${errSubida.message}`)
      return
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta)

    // Queda en la biblioteca para poder reutilizarla después
    await supabase.rpc('guardar_imagen', {
      p_url: data.publicUrl,
      p_ruta: ruta,
      p_empresa_id: empresaId,
      p_nombre: nombreSugerido || archivo.name,
      p_uso: uso,
    })

    setSubiendo(false)
    onCambiar(data.publicUrl)
  }

  async function quitarDeBiblioteca(img) {
    // Solo se saca de la biblioteca; donde ya se usó, sigue funcionando
    await supabase.from('imagenes').delete().eq('id', img.id)
    cargarBiblioteca()
  }

  return (
    <div>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#1F3A5F' }}>{etiqueta}</p>

      {valor ? (
        <div
          style={{
            width: redondo ? alto : 'auto',
            height: alto,
            minWidth: redondo ? alto : 140,
            maxWidth: redondo ? alto : 240,
            borderRadius: redondo ? '50%' : 12,
            background: `url(${valor}) center/cover`,
            border: '1px solid #E6ECF3',
          }}
        />
      ) : (
        <div
          style={{
            width: redondo ? alto : 200,
            height: alto,
            borderRadius: redondo ? '50%' : 12,
            background: '#F7F9FC',
            border: '1px dashed #E6ECF3',
            display: 'grid',
            placeItems: 'center',
            color: '#A3AFBF',
            fontSize: '0.85rem',
          }}
        >
          Sin imagen
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: '1px solid var(--color-navy)',
            borderRadius: 12,
            padding: '0.5rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-navy)',
            cursor: subiendo ? 'wait' : 'pointer',
            background: '#FFFFFF',
          }}
        >
          <Upload size={15} strokeWidth={1.8} />
          {subiendo ? 'Subiendo...' : 'Subir nueva'}
          <input type="file" accept="image/*" onChange={subir} disabled={subiendo} style={{ display: 'none' }} />
        </label>

        <button
          type="button"
          onClick={() => setAbierta(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Images size={15} strokeWidth={1.8} />
          Elegir de mis imágenes
        </button>

        {valor && (
          <button type="button" onClick={() => onCambiar(null)} style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Quitar
          </button>
        )}
      </div>

      {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', margin: '0.4rem 0 0' }}>{error}</p>}

      {/* Biblioteca */}
      {abierta && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierta(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 26, 41, 0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
            zIndex: 110,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '1.5rem',
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Mis imágenes</h2>
              <button type="button" onClick={() => setAbierta(false)}>
                Cerrar
              </button>
            </div>

            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Todo lo que subiste antes. Toca una para usarla aquí.
            </p>

            {cargandoBiblioteca ? (
              <p>Cargando...</p>
            ) : biblioteca.length === 0 ? (
              <p style={{ color: '#64748B' }}>
                Todavía no has subido imágenes. Usa "Subir nueva" y quedarán guardadas aquí para reutilizarlas.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {biblioteca.map((img) => {
                  const elegida = img.url === valor
                  return (
                    <div key={img.id} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onCambiar(img.url)
                          setAbierta(false)
                        }}
                        title={img.nombre || ''}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: 12,
                          background: `url(${img.url}) center/cover`,
                          border: elegida ? '3px solid #F2555A' : '1px solid #E6ECF3',
                          padding: 0,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        {elegida && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              background: '#F2555A',
                              color: '#FFFFFF',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Check size={13} strokeWidth={3} />
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => quitarDeBiblioteca(img)}
                        title="Sacar de la biblioteca"
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          background: 'rgba(255,255,255,0.92)',
                          border: '1px solid #E6ECF3',
                          borderRadius: 8,
                          padding: '0.2rem 0.3rem',
                          color: '#EF4444',
                          cursor: 'pointer',
                          lineHeight: 0,
                        }}
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <p style={{ color: '#A3AFBF', fontSize: '0.82rem', marginTop: '1rem' }}>
              Quitar una imagen de aquí no la borra de donde ya la estés usando.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
