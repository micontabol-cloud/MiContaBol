import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
        Cuando registras una venta eliges "Efectivo" o "QR" — nunca una cuenta contable. Aquí defines dónde entra el
        dinero de cada forma, una sola vez.
      </p>

      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 14,
          padding: '1rem 1.15rem',
          margin: '1.25rem 0',
          fontSize: '0.92rem',
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#1F3A5F' }}>Cómo suele configurarse</p>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#64748B' }}>
          <li>
            <strong>Efectivo</strong> → tu caja, porque el billete queda en el negocio
          </li>
          <li>
            <strong>QR y transferencia</strong> → la cuenta bancaria donde te llega
          </li>
          <li>
            <strong>Tarjeta</strong> → la cuenta donde te deposita el banco
          </li>
          <li>
            <strong>Fiado</strong> → no lleva cuenta: el sistema lo manda solo a cuentas por cobrar
          </li>
        </ul>
        <p style={{ margin: '0.7rem 0 0', color: '#64748B' }}>
          Si tienes varias cuentas bancarias, apunta cada forma a la que corresponda: es lo que permite conciliar
          después.
        </p>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cuentas.filter((c) => /banco/i.test(c.nombre)).length === 0 && (
        <p
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 12,
            padding: '0.8rem 0.95rem',
            fontSize: '0.9rem',
            color: '#1e40af',
            lineHeight: 1.5,
          }}
        >
          Todavía no tienes cuentas bancarias registradas. Si cobras por QR, transferencia o tarjeta,{' '}
          <Link to={`/empresas/${empresaId}/bancos`}>agrégalas en Bancos</Link> y vuelve aquí: aparecerán en la lista
          para elegirlas.
        </p>
      )}

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
                  {(() => {
                    if (m.es_credito || !m.cuenta_id) return null
                    const c = cuentas.find((x) => x.id === m.cuenta_id)
                    if (!c) return null

                    // Efectivo en el banco, o QR en caja, casi siempre es un error
                    const esEfectivo = /efectivo/i.test(m.nombre)
                    const esDigital = /qr|transfer|tarjeta|banco/i.test(m.nombre)
                    const cuentaEsCaja = /caja/i.test(c.nombre)
                    const cuentaEsBanco = /banco/i.test(c.nombre)

                    if (esEfectivo && cuentaEsBanco) {
                      return (
                        <span style={{ color: '#F59E0B', fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                          ⚠️ el efectivo suele ir a caja, no al banco
                        </span>
                      )
                    }
                    if (esDigital && cuentaEsCaja) {
                      return (
                        <span style={{ color: '#F59E0B', fontSize: '0.78rem', marginLeft: '0.4rem' }}>
                          ⚠️ esto llega al banco, no a la caja
                        </span>
                      )
                    }
                    return null
                  })()}
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
