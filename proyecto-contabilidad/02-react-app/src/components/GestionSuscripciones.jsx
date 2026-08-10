import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ESTADOS = {
  prueba: { label: 'En prueba', fondo: 'rgba(59, 130, 246, 0.12)', color: '#1e40af' },
  activa: { label: 'Activa', fondo: 'rgba(34, 197, 94, 0.12)', color: '#15803D' },
  vencida: { label: 'Vencida', fondo: 'rgba(239, 68, 68, 0.1)', color: '#B91C1C' },
  cancelada: { label: 'Cancelada', fondo: '#F7F9FC', color: '#64748B' },
  sin_iniciar: { label: 'Sin iniciar', fondo: '#F7F9FC', color: '#A3AFBF' },
}

function diasHasta(fecha) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24))
}

/**
 * Cuentas de la plataforma con su plan. Permite corregir a mano el
 * plan, el estado o la fecha de vencimiento — para cortesías,
 * correcciones o pagos que llegaron por otro canal.
 */
export default function GestionSuscripciones() {
  const [cuentas, setCuentas] = useState([])
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ plan_codigo: '', estado: '', vence_el: '', motivo: '' })
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: c, error: errC }, { data: p }] = await Promise.all([
      supabase.rpc('cuentas_admin'),
      supabase.from('planes').select('codigo, nombre').order('orden'),
    ])
    if (errC) setError(errC.message)
    setCuentas(c || [])
    setPlanes(p || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirEdicion(c) {
    setEditando(c.usuario_id)
    setForm({
      plan_codigo: c.plan_codigo || 'negocio',
      estado: c.estado === 'sin_iniciar' ? 'prueba' : c.estado,
      vence_el: c.vence_el || '',
      motivo: '',
    })
    setError(null)
  }

  // Suma días desde la fecha que ya tenía, o desde hoy si ya venció:
  // nadie debería perder días que le quedaban.
  function extenderDias(dias, estado = 'activa', motivoSugerido = '') {
    const base = form.vence_el ? new Date(form.vence_el) : new Date()
    const desde = base > new Date() ? base : new Date()
    desde.setDate(desde.getDate() + dias)

    setForm({
      ...form,
      vence_el: desde.toISOString().slice(0, 10),
      estado,
      // Sugerimos el motivo solo si todavía no escribió nada
      motivo: form.motivo.trim() ? form.motivo : motivoSugerido,
    })
  }

  async function guardar(c) {
    if (!form.motivo.trim()) {
      setError('Escribe el motivo del cambio. Queda registrado para poder revisarlo después.')
      return
    }

    setError(null)
    setGuardando(true)

    const { error } = await supabase.rpc('cambiar_suscripcion_admin', {
      p_usuario_id: c.usuario_id,
      p_plan_codigo: form.plan_codigo,
      p_estado: form.estado,
      p_vence_el: form.vence_el || null,
      p_motivo: form.motivo,
    })

    setGuardando(false)
    if (error) return setError(error.message)

    setEditando(null)
    setAviso(`Actualizado el plan de ${c.email}.`)
    setTimeout(() => setAviso(null), 5000)
    cargar()
  }

  const visibles = cuentas.filter((c) => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return (c.email || '').toLowerCase().includes(q) || (c.nombre || '').toLowerCase().includes(q)
  })

  const resumen = {
    activas: cuentas.filter((c) => c.estado === 'activa').length,
    prueba: cuentas.filter((c) => c.estado === 'prueba').length,
    vencidas: cuentas.filter((c) => c.estado === 'vencida').length,
  }

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2>Cuentas y planes</h2>

      <div className="stat-grid" style={{ margin: '1rem 0' }}>
        <div className="stat-card">
          <p className="stat-label">Cuentas</p>
          <p className="stat-value">{cuentas.length}</p>
        </div>
        <div className="stat-card destacada-utilidad">
          <p className="stat-label">Activas</p>
          <p className="stat-value" style={{ color: '#22C55E' }}>{resumen.activas}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">En prueba</p>
          <p className="stat-value">{resumen.prueba}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Vencidas</p>
          <p className="stat-value" style={{ color: resumen.vencidas > 0 ? '#EF4444' : undefined }}>
            {resumen.vencidas}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por correo o nombre..."
          style={{ flex: 1, minWidth: 220 }}
        />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="prueba">En prueba</option>
          <option value="vencida">Vencidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <p style={{ color: '#64748B' }}>Ninguna cuenta coincide.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {visibles.map((c) => {
            const est = ESTADOS[c.estado] || ESTADOS.sin_iniciar
            const dias = diasHasta(c.vence_el)
            const porVencer = dias !== null && dias >= 0 && dias <= 7

            return (
              <div
                key={c.usuario_id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 14,
                  padding: '0.9rem 1.1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 230 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                      {c.nombre || c.email}
                      {c.nombre && <span style={{ color: '#A3AFBF', fontWeight: 400 }}> · {c.email}</span>}
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#64748B' }}>
                      <span
                        className="chip-estado"
                        style={{ background: est.fondo, color: est.color, marginRight: '0.5rem' }}
                      >
                        {est.label}
                      </span>
                      Plan <strong>{c.plan_nombre}</strong>
                      {c.ciclo && ` · ${c.ciclo}`}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#A3AFBF' }}>
                      {c.vence_el ? (
                        <>
                          {c.estado === 'vencida' ? 'Venció el' : 'Vence el'} {c.vence_el}
                          {dias !== null && dias >= 0 && (
                            <span style={{ color: porVencer ? '#F59E0B' : undefined, fontWeight: porVencer ? 700 : 400 }}>
                              {' '}
                              ({dias} {dias === 1 ? 'día' : 'días'})
                            </span>
                          )}
                        </>
                      ) : c.estado === 'prueba' && !c.prueba_iniciada ? (
                        'Prueba sin arrancar (aún no vendió)'
                      ) : (
                        'Sin fecha de vencimiento'
                      )}
                      {' · '}
                      {c.negocios} {c.negocios === 1 ? 'negocio' : 'negocios'} · {c.ventas} ventas
                    </p>
                  </div>

                  <button type="button" onClick={() => (editando === c.usuario_id ? setEditando(null) : abrirEdicion(c))}>
                    {editando === c.usuario_id ? 'Cerrar' : 'Cambiar plan'}
                  </button>
                </div>

                {editando === c.usuario_id && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <label>
                        Plan
                        <br />
                        <select
                          value={form.plan_codigo}
                          onChange={(e) => setForm({ ...form, plan_codigo: e.target.value })}
                        >
                          {planes.map((p) => (
                            <option key={p.codigo} value={p.codigo}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Estado
                        <br />
                        <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                          <option value="activa">Activa</option>
                          <option value="prueba">En prueba</option>
                          <option value="vencida">Vencida</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </label>

                      <label>
                        Vence el
                        <br />
                        <input
                          type="date"
                          value={form.vence_el}
                          onChange={(e) => setForm({ ...form, vence_el: e.target.value })}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Activar por:</span>
                      <button type="button" onClick={() => extenderDias(90)} style={{ fontSize: '0.85rem' }}>
                        + 3 meses
                      </button>
                      <button type="button" onClick={() => extenderDias(365)} style={{ fontSize: '0.85rem' }}>
                        + 1 año
                      </button>
                      <button type="button" onClick={() => extenderDias(15)} style={{ fontSize: '0.85rem' }}>
                        + 15 días
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Regalar:</span>
                      <button
                        type="button"
                        onClick={() => extenderDias(30, 'activa', 'Cortesía de 30 días')}
                        style={{ fontSize: '0.85rem', borderColor: '#22C55E', color: '#15803D' }}
                      >
                        + 30 días gratis
                      </button>
                      <button
                        type="button"
                        onClick={() => extenderDias(30, 'prueba', 'Prueba extendida un mes')}
                        style={{ fontSize: '0.85rem', borderColor: '#3B82F6', color: '#1e40af' }}
                      >
                        + 1 mes de prueba
                      </button>
                    </div>

                    <p style={{ margin: '0.45rem 0 0', fontSize: '0.8rem', color: '#A3AFBF', maxWidth: 480 }}>
                      <strong>30 días gratis</strong> lo deja como cliente activo con el plan que elijas —
                      úsalo para cortesías o compensaciones. <strong>1 mes de prueba</strong> lo mantiene en
                      estado de prueba, para alguien que todavía está evaluando.
                    </p>

                    <label style={{ display: 'block', marginTop: '0.75rem' }}>
                      Motivo del cambio
                      <br />
                      <input
                        value={form.motivo}
                        onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                        placeholder="ej. Pagó por transferencia fuera del sistema"
                        style={{ width: '100%', maxWidth: 460 }}
                      />
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      <button className="btn-hero" type="button" onClick={() => guardar(c)} disabled={guardando}>
                        Guardar cambio
                      </button>
                      <button type="button" onClick={() => setEditando(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
