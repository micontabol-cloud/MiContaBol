import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(0)}`

const CICLOS = { trimestral: 'Trimestral', anual: 'Anual' }

export default function ConfiguracionPagos() {
  const [config, setConfig] = useState(null)
  const [qrs, setQrs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(null)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function cargar() {
    const [{ data: c }, { data: q }] = await Promise.all([
      supabase.from('configuracion_plataforma').select('*').eq('id', 1).single(),
      supabase.rpc('qr_planes_admin'),
    ])
    setConfig(c || {})
    setQrs(q || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function subirQr(planCodigo, ciclo, archivo) {
    if (!archivo) return

    const clave = `${planCodigo}-${ciclo}`
    setSubiendo(clave)
    setError(null)

    const ext = archivo.name.split('.').pop()
    const ruta = `qr-${planCodigo}-${ciclo}-${Date.now()}.${ext}`

    const { error: errSubida } = await supabase.storage
      .from('qr-pagos')
      .upload(ruta, archivo, { upsert: true })

    if (errSubida) {
      setSubiendo(null)
      setError(`No se pudo subir: ${errSubida.message}`)
      return
    }

    const { data: pub } = supabase.storage.from('qr-pagos').getPublicUrl(ruta)

    const { error: errRpc } = await supabase.rpc('guardar_qr_plan', {
      p_plan_codigo: planCodigo,
      p_ciclo: ciclo,
      p_url: pub.publicUrl,
    })

    setSubiendo(null)

    if (errRpc) return setError(errRpc.message)

    setAviso('QR actualizado.')
    setTimeout(() => setAviso(null), 4000)
    cargar()
  }

  async function quitarQr(planCodigo, ciclo) {
    const { error } = await supabase.rpc('guardar_qr_plan', {
      p_plan_codigo: planCodigo,
      p_ciclo: ciclo,
      p_url: null,
    })
    if (error) return setError(error.message)
    cargar()
  }

  async function guardarDatos(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const { error } = await supabase
      .from('configuracion_plataforma')
      .update({
        banco_nombre: config.banco_nombre || null,
        banco_cuenta: config.banco_cuenta || null,
        banco_titular: config.banco_titular || null,
        banco_nit: config.banco_nit || null,
        whatsapp_soporte: config.whatsapp_soporte || null,
        actualizado_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setGuardando(false)

    if (error) return setError(error.message)

    setAviso('Datos guardados.')
    setTimeout(() => setAviso(null), 4000)
  }

  if (cargando) {
    return (
      <section style={{ marginTop: '2.5rem' }}>
        <h2>Cómo te pagan</h2>
        <p style={{ color: '#64748B' }}>Cargando...</p>
      </section>
    )
  }

  const cargados = qrs.filter((q) => q.qr_url).length

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2>Cómo te pagan</h2>
      <p style={{ color: '#64748B', marginTop: '-0.4rem' }}>
        Un QR para cada plan, con su monto exacto. El cliente escanea y no puede equivocarse de importe.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && (
        <p
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: '0.6rem 0.85rem',
            color: '#15803D',
            fontSize: '0.9rem',
          }}
        >
          {aviso}
        </p>
      )}

      {cargados === 0 && (
        <p
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 12,
            padding: '0.8rem 0.95rem',
            fontSize: '0.9rem',
            color: '#8a5a00',
            lineHeight: 1.55,
          }}
        >
          Todavía no cargaste ningún QR. Puedes empezar solo con <strong>Negocio trimestral</strong>, que va a ser
          la mayoría de tus ventas — los demás se pueden agregar después.
        </p>
      )}

      {/* Un bloque por plan */}
      {Object.values(
        qrs.reduce((acc, q) => {
          acc[q.plan_codigo] = acc[q.plan_codigo] || { nombre: q.plan_nombre, orden: q.orden, items: [] }
          acc[q.plan_codigo].items.push(q)
          return acc
        }, {})
      )
        .sort((a, b) => a.orden - b.orden)
        .map((grupo) => (
          <div
            key={grupo.nombre}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 16,
              padding: '1.15rem 1.25rem',
              marginTop: '1rem',
            }}
          >
            <p style={{ margin: '0 0 0.9rem', fontWeight: 700, color: '#1F3A5F' }}>Plan {grupo.nombre}</p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {grupo.items.map((q) => {
                const clave = `${q.plan_codigo}-${q.ciclo}`
                return (
                  <div key={clave} style={{ width: 190 }}>
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#64748B' }}>
                      {CICLOS[q.ciclo]} · <strong style={{ color: '#1F3A5F' }}>{fmt(q.monto)}</strong>
                    </p>

                    {q.qr_url ? (
                      <img
                        src={q.qr_url}
                        alt={`QR ${grupo.nombre} ${q.ciclo}`}
                        style={{
                          width: 190,
                          height: 190,
                          objectFit: 'contain',
                          background: '#FFFFFF',
                          border: '1px solid #E6ECF3',
                          borderRadius: 12,
                          padding: '0.4rem',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 190,
                          height: 190,
                          borderRadius: 12,
                          background: '#F7F9FC',
                          border: '1px dashed #E6ECF3',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#A3AFBF',
                          fontSize: '0.82rem',
                          textAlign: 'center',
                          padding: '1rem',
                        }}
                      >
                        Sin QR
                        <br />
                        <span style={{ fontSize: '0.75rem' }}>(usa el general)</span>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => subirQr(q.plan_codigo, q.ciclo, e.target.files?.[0])}
                      disabled={subiendo === clave}
                      style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem' }}
                    />

                    {q.qr_url && (
                      <button
                        type="button"
                        onClick={() => quitarQr(q.plan_codigo, q.ciclo)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          padding: 0,
                          fontSize: '0.8rem',
                          textDecoration: 'underline',
                          marginTop: '0.35rem',
                        }}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      {/* Datos para transferencia */}
      <form
        onSubmit={guardarDatos}
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          padding: '1.15rem 1.25rem',
          marginTop: '1.25rem',
        }}
      >
        <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: '#1F3A5F' }}>Datos para transferencia</p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#64748B' }}>
          Se muestran debajo del QR, para quien prefiera transferir.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label>
            Banco
            <br />
            <input
              value={config.banco_nombre || ''}
              onChange={(e) => setConfig({ ...config, banco_nombre: e.target.value })}
              placeholder="Banco Nacional de Bolivia"
              style={{ width: 230 }}
            />
          </label>

          <label>
            Número de cuenta
            <br />
            <input
              value={config.banco_cuenta || ''}
              onChange={(e) => setConfig({ ...config, banco_cuenta: e.target.value })}
              style={{ width: 190 }}
            />
          </label>

          <label>
            A nombre de
            <br />
            <input
              value={config.banco_titular || ''}
              onChange={(e) => setConfig({ ...config, banco_titular: e.target.value })}
              style={{ width: 220 }}
            />
          </label>

          <label>
            NIT o CI
            <br />
            <input
              value={config.banco_nit || ''}
              onChange={(e) => setConfig({ ...config, banco_nit: e.target.value })}
              style={{ width: 150 }}
            />
          </label>

          <label>
            WhatsApp de soporte
            <br />
            <input
              value={config.whatsapp_soporte || ''}
              onChange={(e) => setConfig({ ...config, whatsapp_soporte: e.target.value })}
              placeholder="591 75026410"
              style={{ width: 180 }}
            />
          </label>
        </div>

        <button className="btn-hero" type="submit" disabled={guardando} style={{ marginTop: '1rem' }}>
          {guardando ? 'Guardando...' : 'Guardar datos'}
        </button>
      </form>
    </section>
  )
}
