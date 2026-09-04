import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotorVender() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [catalogo, setCatalogo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [cliente, setCliente] = useState('')
  const [nota, setNota] = useState('')
  const [lineas, setLineas] = useState([{ clave: '', cantidad: '1', precio: '' }])
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase.rpc('catalogo_promotor')
      if (err) setError(err.message)
      setCatalogo(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const productos = catalogo?.productos || []

  const porClave = useMemo(() => {
    const m = new Map()
    productos.forEach((p) => m.set(`${p.producto_id}|${p.variante_id || ''}`, p))
    return m
  }, [productos])

  function actualizar(i, campo, valor) {
    const nuevas = [...lineas]
    nuevas[i] = { ...nuevas[i], [campo]: valor }

    // Al elegir producto, el precio sugerido se pone solo
    if (campo === 'clave') {
      const p = porClave.get(valor)
      if (p) nuevas[i].precio = String(p.precio_publico)
    }

    setLineas(nuevas)
  }

  const totales = lineas.reduce(
    (acc, l) => {
      const p = porClave.get(l.clave)
      if (!p) return acc

      const cant = parseFloat(l.cantidad) || 0
      const precio = parseFloat(l.precio) || 0

      acc.cobras += cant * precio
      acc.debes += cant * Number(p.precio_mayorista)
      return acc
    },
    { cobras: 0, debes: 0 }
  )

  const ganancia = totales.cobras - totales.debes

  // Enter avanza al siguiente campo en vez de enviar la venta
  function manejarEnter(e) {
    if (e.key !== 'Enter') return
    if (e.target.tagName === 'TEXTAREA') return
    e.preventDefault()

    const campos = Array.from(e.currentTarget.querySelectorAll('input, select')).filter((el) => !el.disabled)
    const i = campos.indexOf(document.activeElement)
    if (i >= 0 && i < campos.length - 1) campos[i + 1].focus()
  }

  async function guardar(e) {
    e.preventDefault()

    const payload = lineas
      .filter((l) => l.clave && parseFloat(l.cantidad) > 0)
      .map((l) => {
        const [producto_id, variante_id] = l.clave.split('|')
        return {
          producto_id,
          variante_id: variante_id || null,
          cantidad: parseFloat(l.cantidad),
          precio_unitario: parseFloat(l.precio) || null,
        }
      })

    if (payload.length === 0) {
      setError('Elige al menos un producto.')
      return
    }

    setError(null)
    setGuardando(true)

    const { data, error } = await supabase.rpc('vender_como_promotor', {
      p_fecha: new Date().toISOString().slice(0, 10),
      p_cliente: cliente || null,
      p_lineas: payload,
      p_nota: nota || null,
    })

    setGuardando(false)
    if (error) return setError(error.message)

    setResultado(data)
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  // Confirmación después de vender
  if (resultado) {
    return (
      <main style={{ maxWidth: 640, fontFamily: 'sans-serif' }}>
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.07)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 16,
            padding: '1.75rem',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#15803D' }}>Venta registrada</p>

          <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem' }}>
              <span style={{ color: '#64748B' }}>Cobraste al cliente</span>
              <strong>{fmt(resultado.cobraste)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem' }}>
              <span style={{ color: '#64748B' }}>Le debes al negocio</span>
              <strong style={{ color: '#F59E0B' }}>{fmt(resultado.debes)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(34,197,94,0.3)',
                paddingTop: '0.6rem',
                fontSize: '1.1rem',
              }}
            >
              <span style={{ fontWeight: 700, color: '#15803D' }}>Tu ganancia</span>
              <strong style={{ color: '#22C55E', fontSize: '1.3rem' }}>{fmt(resultado.tu_ganancia)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-hero"
              onClick={() => {
                setResultado(null)
                setLineas([{ clave: '', cantidad: '1', precio: '' }])
                setCliente('')
                setNota('')
              }}
            >
              Registrar otra venta
            </button>
            <button type="button" onClick={() => navigate(`/empresas/${empresaId}/promotor`)}>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <p>
        <Link
          to={`/empresas/${empresaId}/promotor`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Volver
        </Link>
      </p>

      <h1 style={{ margin: 0 }}>Registrar una venta</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 1.5rem' }}>
        Anota lo que vendiste para que quede claro cuánto le debes al negocio.
      </p>

      {productos.length === 0 ? (
        <p
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 12,
            padding: '1rem 1.15rem',
            color: '#8a5a00',
            lineHeight: 1.55,
          }}
        >
          No tienes mercadería para vender. Pídele al dueño que te entregue productos.
        </p>
      ) : (
        <form onSubmit={guardar} onKeyDown={manejarEnter}>
          <label style={{ display: 'block', marginBottom: '1.25rem' }}>
            ¿A quién le vendiste? (opcional)
            <br />
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              style={{ width: '100%', maxWidth: 320 }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lineas.map((l, i) => {
              const p = porClave.get(l.clave)
              const cant = parseFloat(l.cantidad) || 0
              const precio = parseFloat(l.precio) || 0

              return (
                <div
                  key={i}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6ECF3',
                    borderRadius: 14,
                    padding: '1rem 1.15rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label style={{ flex: 1, minWidth: 200 }}>
                      Producto
                      <br />
                      <select
                        value={l.clave}
                        onChange={(e) => actualizar(i, 'clave', e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">-- Elige --</option>
                        {productos.map((prod) => {
                          const k = `${prod.producto_id}|${prod.variante_id || ''}`
                          return (
                            <option key={k} value={k}>
                              {prod.nombre}
                              {prod.observaciones ? ` · ${prod.observaciones}` : ''} — quedan {prod.disponible}
                            </option>
                          )
                        })}
                      </select>
                    </label>

                    <label>
                      Cantidad
                      <br />
                      <input
                        type="number"
                        min="1"
                        max={p?.disponible}
                        value={l.cantidad}
                        onChange={(e) => actualizar(i, 'cantidad', e.target.value)}
                        style={{ width: 85 }}
                      />
                    </label>

                    <label>
                      ¿En cuánto lo vendiste?
                      <br />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.precio}
                        onChange={(e) => actualizar(i, 'precio', e.target.value)}
                        style={{ width: 120 }}
                      />
                    </label>

                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLineas(lineas.filter((_, j) => j !== i))}
                        aria-label="Quitar"
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <Trash2 size={15} strokeWidth={1.9} />
                      </button>
                    )}
                  </div>

                  {p && cant > 0 && (
                    <p style={{ margin: '0.7rem 0 0', fontSize: '0.88rem', color: '#64748B' }}>
                      Le pagas <strong>{fmt(cant * Number(p.precio_mayorista))}</strong> al negocio · te quedas con{' '}
                      <strong style={{ color: '#22C55E' }}>
                        {fmt(cant * precio - cant * Number(p.precio_mayorista))}
                      </strong>
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setLineas([...lineas, { clave: '', cantidad: '1', precio: '' }])}
            style={{ marginTop: '0.85rem' }}
          >
            + Agregar otro producto
          </button>

          {/* Resumen */}
          {totales.cobras > 0 && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.28)',
                borderRadius: 16,
                padding: '1.15rem 1.3rem',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Cobras al cliente</span>
                  <strong>{fmt(totales.cobras)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Le pagas al negocio</span>
                  <strong style={{ color: '#F59E0B' }}>{fmt(totales.debes)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(34,197,94,0.3)',
                    paddingTop: '0.5rem',
                  }}
                >
                  <strong style={{ color: '#15803D' }}>Tu ganancia</strong>
                  <strong style={{ color: '#22C55E', fontSize: '1.15rem' }}>{fmt(ganancia)}</strong>
                </div>
              </div>
            </div>
          )}

          <label style={{ display: 'block', marginTop: '1.25rem' }}>
            Nota (opcional)
            <br />
            <input value={nota} onChange={(e) => setNota(e.target.value)} style={{ width: '100%', maxWidth: 400 }} />
          </label>

          {error && <p style={{ color: '#EF4444' }}>{error}</p>}

          <button
            className="btn-hero"
            type="submit"
            disabled={guardando || totales.cobras <= 0}
            style={{ marginTop: '1.25rem', width: '100%', maxWidth: 320, padding: '0.9rem' }}
          >
            {guardando ? 'Registrando...' : 'Registrar venta'}
          </button>
        </form>
      )}
    </main>
  )
}
