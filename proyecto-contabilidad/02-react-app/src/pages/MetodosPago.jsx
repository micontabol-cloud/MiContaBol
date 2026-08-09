import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const USOS = [
  { valor: 'ambos', etiqueta: 'Cobros y pagos' },
  { valor: 'cobro', etiqueta: 'Solo cobros' },
  { valor: 'pago', etiqueta: 'Solo pagos' },
]

export default function MetodosPago() {
  const { id: empresaId } = useParams()
  const [metodos, setMetodos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState('💰')
  const [cuentaId, setCuentaId] = useState('')
  const [uso, setUso] = useState('ambos')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    await supabase.rpc('crear_metodos_pago_default', { p_empresa_id: empresaId })

    const [{ data: mets, error: errMet }, { data: cts }] = await Promise.all([
      supabase.from('metodos_pago').select('*').eq('empresa_id', empresaId).order('orden'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .in('tipo', ['activo', 'pasivo'])
        .order('codigo'),
    ])

    if (errMet) setError(errMet.message)
    setMetodos(mets || [])
    setCuentas(cts || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function actualizarCuenta(metodoId, nuevaCuentaId) {
    setError(null)
    const { error } = await supabase
      .from('metodos_pago')
      .update({ cuenta_id: nuevaCuentaId || null })
      .eq('id', metodoId)
    if (error) return setError(error.message)
    cargar()
  }

  async function alternarActivo(m) {
    setError(null)
    const { error } = await supabase.from('metodos_pago').update({ activo: !m.activo }).eq('id', m.id)
    if (error) return setError(error.message)
    cargar()
  }

  async function agregar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('metodos_pago').insert({
      empresa_id: empresaId,
      nombre,
      icono: icono || '💰',
      cuenta_id: cuentaId || null,
      uso,
      orden: metodos.length + 1,
    })

    setGuardando(false)
    if (error) return setError(error.message)

    setNombre('')
    setIcono('💰')
    setCuentaId('')
    cargar()
  }

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h1>Formas de cobro y pago</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Cuando registras una venta eliges "Efectivo" o "QR" — nunca una cuenta contable. Aquí defines a qué cuenta
        va cada forma, una sola vez.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Forma</th>
              <th style={{ padding: '4px 8px' }}>Se registra en</th>
              <th style={{ padding: '4px 8px' }}>Uso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {metodos.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #E6ECF3', opacity: m.activo ? 1 : 0.5 }}>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                  {m.icono} {m.nombre}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {m.es_credito ? (
                    <span style={{ color: '#64748B', fontSize: '0.85rem' }}>
                      Cuentas por cobrar / pagar (automático)
                    </span>
                  ) : (
                    <select value={m.cuenta_id || ''} onChange={(e) => actualizarCuenta(m.id, e.target.value)}>
                      <option value="">-- Sin asignar --</option>
                      {cuentas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo} — {c.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                  {!m.es_credito && !m.cuenta_id && (
                    <span style={{ color: '#F59E0B', fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                      ⚠️ sin configurar
                    </span>
                  )}
                </td>
                <td style={{ padding: '6px 8px', color: '#64748B', fontSize: '0.85rem' }}>
                  {USOS.find((u) => u.valor === m.uso)?.etiqueta}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <button type="button" onClick={() => alternarActivo(m)}>
                    {m.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Agregar otra forma</h2>
      <form onSubmit={agregar} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label>
          Ícono
          <br />
          <input value={icono} onChange={(e) => setIcono(e.target.value)} style={{ width: 60 }} />
        </label>
        <label>
          Nombre
          <br />
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Cheque"
            style={{ width: 160 }}
          />
        </label>
        <label>
          Se registra en
          <br />
          <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Uso
          <br />
          <select value={uso} onChange={(e) => setUso(e.target.value)}>
            {USOS.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={guardando}>
          Agregar
        </button>
      </form>
    </main>
  )
}
