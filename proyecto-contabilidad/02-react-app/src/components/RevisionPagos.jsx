import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(0)}`

/**
 * Bandeja de pagos por revisar. El comprobante vive en un bucket
 * privado, así que se abre con un enlace firmado temporal en vez de
 * una URL pública.
 */
export default function RevisionPagos() {
  const [filtro, setFiltro] = useState('pendiente')
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(null)
  const [rechazando, setRechazando] = useState(null)
  const [motivo, setMotivo] = useState('')

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.rpc('solicitudes_pago_admin', { p_estado: filtro })
    if (error) setError(error.message)
    setSolicitudes(data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro])

  async function verComprobante(path) {
    // Enlace válido por 5 minutos: suficiente para revisarlo sin que
    // quede circulando un acceso permanente al comprobante.
    const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(path, 300)
    if (error) return setError(`No se pudo abrir el comprobante: ${error.message}`)
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function aprobar(s) {
    if (!window.confirm(`¿Confirmas que llegaron ${fmt(s.monto)} a tu cuenta?\n\nSe le activará el plan ${s.plan_nombre} ${s.ciclo}.`)) {
      return
    }

    setProcesando(s.id)
    const { data, error } = await supabase.rpc('aprobar_solicitud_pago', { p_solicitud_id: s.id })
    setProcesando(null)

    if (error) return setError(error.message)

    window.alert(`Activado. Su plan vence el ${data.vence_el}.`)
    cargar()
  }

  async function rechazar(s) {
    if (!motivo.trim()) {
      setError('Escribe el motivo: el cliente necesita saber qué corregir.')
      return
    }

    setProcesando(s.id)
    const { error } = await supabase.rpc('rechazar_solicitud_pago', {
      p_solicitud_id: s.id,
      p_motivo: motivo,
    })
    setProcesando(null)

    if (error) return setError(error.message)

    setRechazando(null)
    setMotivo('')
    cargar()
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente')

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>
          Pagos por revisar
          {filtro === 'pendiente' && pendientes.length > 0 && (
            <span
              style={{
                marginLeft: '0.6rem',
                background: '#F2555A',
                color: '#FFFFFF',
                borderRadius: 999,
                padding: '0.15rem 0.6rem',
                fontSize: '0.85rem',
              }}
            >
              {pendientes.length}
            </span>
          )}
        </h2>

        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobados</option>
          <option value="rechazada">Rechazados</option>
          <option value="todas">Todos</option>
        </select>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <p style={{ color: '#64748B' }}>
          {filtro === 'pendiente' ? 'No hay pagos esperando revisión.' : 'Nada por aquí.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {solicitudes.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6ECF3',
                borderRadius: 14,
                padding: '1rem 1.15rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                    {s.nombre || s.email}
                    {s.nombre && <span style={{ color: '#A3AFBF', fontWeight: 400 }}> · {s.email}</span>}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>
                    Plan <strong>{s.plan_nombre}</strong> · {s.ciclo} ·{' '}
                    <strong style={{ color: '#1F3A5F' }}>{fmt(s.monto)}</strong>
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#A3AFBF', fontSize: '0.82rem' }}>
                    Enviado el {new Date(s.created_at).toLocaleString('es-BO')}
                    {s.referencia && ` · Ref: ${s.referencia}`}
                  </p>
                  {s.nota_cliente && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem' }}>"{s.nota_cliente}"</p>
                  )}
                  {s.estado !== 'pendiente' && s.nota_admin && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      Tu nota: {s.nota_admin}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                  {s.estado === 'pendiente' ? (
                    <>
                      <button type="button" onClick={() => verComprobante(s.comprobante_path)}>
                        Ver comprobante
                      </button>
                      <button
                        className="btn-hero"
                        type="button"
                        onClick={() => aprobar(s)}
                        disabled={procesando === s.id}
                      >
                        Activar membresía
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRechazando(rechazando === s.id ? null : s.id)
                          setMotivo('')
                        }}
                        style={{ color: '#EF4444', borderColor: '#EF4444' }}
                      >
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <span
                      className="chip-estado"
                      style={
                        s.estado === 'aprobada'
                          ? { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                          : { background: 'rgba(239, 68, 68, 0.1)', color: '#B91C1C' }
                      }
                    >
                      {s.estado === 'aprobada' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                </div>
              </div>

              {rechazando === s.id && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E6ECF3' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    ¿Por qué lo rechazas? El cliente va a ver este mensaje.
                    <br />
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="ej. El monto no coincide con el plan elegido"
                      style={{ width: '100%', maxWidth: 420 }}
                    />
                  </label>
                  <button type="button" onClick={() => rechazar(s)} disabled={procesando === s.id}>
                    Confirmar rechazo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
