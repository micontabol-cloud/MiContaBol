import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Eliminar una empresa borra todo en cascada y no se puede deshacer.
 * El diálogo hace tres cosas antes de permitirlo:
 *   1. Muestra exactamente cuánta información se va a perder
 *   2. Obliga a escribir la palabra ELIMINAR
 *   3. Pide el nombre de la empresa, para que no se borre la
 *      equivocada estando abiertas varias
 */
export default function EliminarEmpresa({ empresa, onCerrar, onEliminada }) {
  const [resumen, setResumen] = useState(null)
  const [confirmacion, setConfirmacion] = useState('')
  const [nombreEscrito, setNombreEscrito] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.rpc('resumen_empresa_admin', { p_empresa_id: empresa.id }).then(({ data, error }) => {
      if (error) setError(error.message)
      setResumen(data)
    })
  }, [empresa.id])

  const nombreCoincide = nombreEscrito.trim().toLowerCase() === empresa.nombre.trim().toLowerCase()
  const confirmacionOk = confirmacion.trim().toUpperCase() === 'ELIMINAR'
  const puedeEliminar = nombreCoincide && confirmacionOk && !eliminando

  async function eliminar() {
    setError(null)
    setEliminando(true)

    const { data, error } = await supabase.rpc('eliminar_empresa_admin', {
      p_empresa_id: empresa.id,
      p_confirmacion: confirmacion.trim().toUpperCase(),
    })

    setEliminando(false)

    if (error) {
      setError(error.message)
      return
    }

    onEliminada(data)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 26, 41, 0.55)',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
        zIndex: 100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '1.75rem',
          maxWidth: 520,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: 0, color: '#B91C1C' }}>Eliminar «{empresa.nombre}»</h2>
        <p style={{ color: '#64748B', marginTop: '0.4rem' }}>
          Esta acción <strong>no se puede deshacer</strong>.
        </p>

        {resumen && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '1rem 1.15rem',
              margin: '1.15rem 0',
            }}
          >
            <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: '#B91C1C' }}>Se va a borrar para siempre:</p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
              <li>
                <strong>{resumen.productos}</strong> productos
              </li>
              <li>
                <strong>{resumen.comprobantes}</strong> ventas y compras
              </li>
              <li>
                <strong>{resumen.asientos}</strong> asientos contables
              </li>
              <li>
                <strong>{resumen.clientes}</strong> clientes
              </li>
              <li>
                <strong>{resumen.catalogos}</strong> catálogos
              </li>
              <li>
                Acceso de <strong>{resumen.miembros}</strong>{' '}
                {resumen.miembros === 1 ? 'persona' : 'personas'}
              </li>
            </ul>

            {resumen.propietario && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.88rem', color: '#64748B' }}>
                Dueño: <strong>{resumen.propietario}</strong>
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <label>
            Escribe el nombre de la empresa: <strong>{empresa.nombre}</strong>
            <br />
            <input
              value={nombreEscrito}
              onChange={(e) => setNombreEscrito(e.target.value)}
              placeholder={empresa.nombre}
              style={{
                width: '100%',
                borderColor: nombreEscrito && !nombreCoincide ? '#EF4444' : undefined,
              }}
            />
          </label>

          <label>
            Escribe <strong>ELIMINAR</strong> para confirmar
            <br />
            <input
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="ELIMINAR"
              style={{
                width: '100%',
                borderColor: confirmacion && !confirmacionOk ? '#EF4444' : undefined,
              }}
            />
          </label>

          {error && <p style={{ color: '#EF4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={eliminar}
              disabled={!puedeEliminar}
              style={
                puedeEliminar
                  ? { background: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }
                  : undefined
              }
            >
              {eliminando ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
            <button type="button" onClick={onCerrar}>
              Cancelar
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#A3AFBF', margin: 0 }}>
            Las fotos de productos quedan en el almacenamiento y se limpian aparte desde Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
