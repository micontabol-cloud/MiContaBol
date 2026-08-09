import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Los QR de cobro y los datos bancarios. Van al bucket público de
 * imágenes porque el cliente tiene que poder verlos para pagar — un QR
 * de cobro está hecho para compartirse.
 */
export default function ConfiguracionPagos() {
  const [config, setConfig] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(null)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [form, setForm] = useState({
    banco_nombre: '',
    banco_titular: '',
    banco_cuenta: '',
    whatsapp_soporte: '',
  })

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.from('configuracion_plataforma').select('*').single()
    if (error) setError(error.message)
    setConfig(data)
    if (data) {
      setForm({
        banco_nombre: data.banco_nombre || '',
        banco_titular: data.banco_titular || '',
        banco_cuenta: data.banco_cuenta || '',
        whatsapp_soporte: data.whatsapp_soporte || '',
      })
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function subirQR(e, ciclo) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setSubiendo(ciclo)

    const ext = archivo.name.split('.').pop()
    const ruta = `plataforma/qr-${ciclo}-${Date.now()}.${ext}`

    const { error: errSubida } = await supabase.storage.from('productos').upload(ruta, archivo, { upsert: true })

    if (errSubida) {
      setSubiendo(null)
      return setError(`No se pudo subir: ${errSubida.message}`)
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta)

    const { error: errRpc } = await supabase.rpc('guardar_configuracion_pagos', {
      [ciclo === 'trimestral' ? 'p_qr_trimestral_url' : 'p_qr_anual_url']: data.publicUrl,
    })

    setSubiendo(null)
    if (errRpc) return setError(errRpc.message)
    cargar()
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.rpc('guardar_configuracion_pagos', {
      p_banco_nombre: form.banco_nombre || null,
      p_banco_titular: form.banco_titular || null,
      p_banco_cuenta: form.banco_cuenta || null,
      p_whatsapp_soporte: form.whatsapp_soporte || null,
    })

    setGuardando(false)
    if (error) return setError(error.message)

    setAviso('Guardado.')
    setTimeout(() => setAviso(null), 3000)
    cargar()
  }

  if (cargando) return <p>Cargando configuración...</p>

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2>Cómo te pagan</h2>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Estos QR son los que ven tus clientes al elegir su plan.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        {[
          { ciclo: 'trimestral', label: 'QR para pago trimestral', url: config?.qr_trimestral_url },
          { ciclo: 'anual', label: 'QR para pago anual', url: config?.qr_anual_url },
        ].map((q) => (
          <div key={q.ciclo}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#1F3A5F' }}>{q.label}</p>
            {q.url ? (
              <img
                src={q.url}
                alt={q.label}
                style={{
                  width: 180,
                  height: 180,
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
                  width: 180,
                  height: 180,
                  borderRadius: 12,
                  background: '#F7F9FC',
                  border: '1px dashed #E6ECF3',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#A3AFBF',
                  fontSize: '0.85rem',
                }}
              >
                Sin QR
              </div>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => subirQR(e, q.ciclo)}
                disabled={subiendo === q.ciclo}
                style={{ fontSize: '0.78rem' }}
              />
              {subiendo === q.ciclo && (
                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>Subiendo...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={guardar} style={{ marginTop: '1.5rem', maxWidth: 420 }}>
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1F3A5F' }}>
          Datos para transferencia (opcional)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <label>
            Banco
            <br />
            <input
              value={form.banco_nombre}
              onChange={(e) => setForm({ ...form, banco_nombre: e.target.value })}
              placeholder="Banco Nacional de Bolivia"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Número de cuenta
            <br />
            <input
              value={form.banco_cuenta}
              onChange={(e) => setForm({ ...form, banco_cuenta: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            A nombre de
            <br />
            <input
              value={form.banco_titular}
              onChange={(e) => setForm({ ...form, banco_titular: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            WhatsApp de soporte
            <br />
            <input
              value={form.whatsapp_soporte}
              onChange={(e) => setForm({ ...form, whatsapp_soporte: e.target.value })}
              placeholder="591 70000000"
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <button className="btn-hero" type="submit" disabled={guardando} style={{ marginTop: '1rem' }}>
          Guardar
        </button>
      </form>
    </section>
  )
}
