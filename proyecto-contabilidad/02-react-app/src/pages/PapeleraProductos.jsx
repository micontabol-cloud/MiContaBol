import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function PapeleraProductos() {
  const { id: empresaId } = useParams()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [confirmacion, setConfirmacion] = useState('')

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.rpc('papelera_productos', { p_empresa_id: empresaId })
    if (error) setError(error.message)
    setItems(data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function restaurar(p) {
    setError(null)
    setProcesando(p.id)
    const { error } = await supabase.rpc('restaurar_producto', { p_producto_id: p.id })
    setProcesando(null)
    if (error) return setError(error.message)

    setAviso(`"${p.nombre}" volvió a tu inventario.`)
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  async function borrar(p) {
    setError(null)
    setProcesando(p.id)
    const { error } = await supabase.rpc('borrar_producto_definitivo', {
      p_producto_id: p.id,
      p_confirmacion: confirmacion.trim().toUpperCase(),
    })
    setProcesando(null)
    if (error) return setError(error.message)

    setBorrando(null)
    setConfirmacion('')
    setAviso(`"${p.nombre}" se borró definitivamente.`)
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>&larr; Productos</Link>
      </p>

      <h1>Papelera</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Productos eliminados. Puedes restaurarlos cuando quieras — no se pierde nada de su historial.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
          <BoliMascot pose="exito" size={110} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600, color: '#1F3A5F', margin: 0 }}>La papelera está vacía</p>
          <p style={{ color: '#64748B' }}>No has eliminado ningún producto.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6ECF3',
                borderRadius: 14,
                padding: '0.9rem 1.1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt=""
                    style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 10, opacity: 0.6 }}
                  />
                ) : (
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: '#F7F9FC', border: '1px solid #E6ECF3' }} />
                )}

                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#64748B' }}>{p.nombre}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#A3AFBF' }}>
                    {p.codigo}
                    {Number(p.stock) > 0 && ` · tenía ${Number(p.stock).toFixed(0)} en stock (${fmt(p.stock * p.costo)})`}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#A3AFBF' }}>
                    Eliminado el {new Date(p.eliminado_at).toLocaleDateString('es-BO')}
                    {p.eliminado_por && ` por ${p.eliminado_por}`}
                    {p.motivo && ` · "${p.motivo}"`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => restaurar(p)} disabled={procesando === p.id}>
                    Restaurar
                  </button>
                  {!p.tiene_movimientos && (
                    <button
                      type="button"
                      onClick={() => {
                        setBorrando(borrando === p.id ? null : p.id)
                        setConfirmacion('')
                      }}
                      style={{ color: '#B91C1C', borderColor: '#B91C1C', fontSize: '0.85rem' }}
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>

              {borrando === p.id && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E6ECF3' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Escribe <strong>BORRAR</strong> para eliminarlo para siempre
                    <br />
                    <input
                      value={confirmacion}
                      onChange={(e) => setConfirmacion(e.target.value)}
                      placeholder="BORRAR"
                      style={{ width: 180 }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => borrar(p)}
                    disabled={procesando === p.id || confirmacion.trim().toUpperCase() !== 'BORRAR'}
                    style={
                      confirmacion.trim().toUpperCase() === 'BORRAR'
                        ? { background: '#B91C1C', borderColor: '#B91C1C', color: '#FFFFFF' }
                        : undefined
                    }
                  >
                    Borrar para siempre
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1.75rem', fontSize: '0.88rem', color: '#A3AFBF', lineHeight: 1.5 }}>
        Los productos que ya se vendieron o compraron solo se pueden restaurar, no borrar del todo: sus ventas
        quedarían sin referencia y el kardex no cuadraría.
      </p>
    </main>
  )
}
