import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NuevaVentaProducto() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [cliente, setCliente] = useState('')
  const [concepto, setConcepto] = useState('')
  const [esCredito, setEsCredito] = useState(false)
  const [cuentaCobroId, setCuentaCobroId] = useState('')
  const [lineas, setLineas] = useState([{ producto_id: '', cantidad: '', precio_unitario: '' }])
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      const [{ data: prods }, { data: cts }] = await Promise.all([
        supabase.from('productos').select('*').eq('empresa_id', empresaId).eq('activo', true).order('codigo'),
        supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, tipo')
          .eq('empresa_id', empresaId)
          .eq('permite_movimiento', true)
          .eq('activo', true)
          .order('codigo'),
      ])
      setProductos(prods || [])
      setCuentas((cts || []).filter((c) => c.tipo === 'activo'))
    }
    cargar()
  }, [empresaId])

  function actualizarLinea(i, campo, valor) {
    const nuevas = [...lineas]
    nuevas[i] = { ...nuevas[i], [campo]: valor }
    if (campo === 'producto_id') {
      const prod = productos.find((p) => p.id === valor)
      if (prod) nuevas[i].precio_unitario = prod.precio_venta
    }
    setLineas(nuevas)
  }

  function agregarLinea() {
    setLineas([...lineas, { producto_id: '', cantidad: '', precio_unitario: '' }])
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const total = lineas.reduce((sum, l) => sum + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (esCredito && !cliente.trim()) {
      setError('Una venta a crédito necesita el nombre del cliente.')
      return
    }
    if (!esCredito && !cuentaCobroId) {
      setError('Selecciona con qué cuenta se recibe el pago.')
      return
    }

    setGuardando(true)

    const lineasPayload = lineas
      .filter((l) => l.producto_id)
      .map((l) => ({
        producto_id: l.producto_id,
        cantidad: parseFloat(l.cantidad) || 0,
        precio_unitario: parseFloat(l.precio_unitario) || 0,
      }))

    const { error } = await supabase.rpc('vender_productos', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_cliente: cliente || null,
      p_concepto: concepto || null,
      p_es_credito: esCredito,
      p_cuenta_cobro_id: esCredito ? null : cuentaCobroId,
      p_lineas: lineasPayload,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/inventario`)
  }

  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario`}>&larr; Volver</Link>
      </p>
      <h1>Nueva venta de productos</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label>
            Fecha
            <br />
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            Cliente {esCredito && '(obligatorio para venta a crédito)'}
            <br />
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>

        <label>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        <label>
          <input type="checkbox" checked={esCredito} onChange={(e) => setEsCredito(e.target.checked)} /> Venta a
          crédito (se registra como cuenta por cobrar en vez de cobro inmediato)
        </label>

        {!esCredito && (
          <label>
            Cuenta que recibe el pago
            <br />
            <select required value={cuentaCobroId} onChange={(e) => setCuentaCobroId(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Producto</th>
              <th style={{ padding: '4px 8px' }}>Cantidad</th>
              <th style={{ padding: '4px 8px' }}>Precio unitario</th>
              <th style={{ padding: '4px 8px' }}>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => {
              const prod = productos.find((p) => p.id === l.producto_id)
              const subtotal = (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0)
              return (
                <tr key={i}>
                  <td style={{ padding: '4px 8px' }}>
                    <select required value={l.producto_id} onChange={(e) => actualizarLinea(i, 'producto_id', e.target.value)}>
                      <option value="">-- Selecciona --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} — {p.nombre} (stock: {Number(p.stock_actual).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max={prod?.stock_actual}
                      value={l.cantidad}
                      onChange={(e) => actualizarLinea(i, 'cantidad', e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={l.precio_unitario}
                      onChange={(e) => actualizarLinea(i, 'precio_unitario', e.target.value)}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>{subtotal.toFixed(2)}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {lineas.length > 1 && (
                      <button type="button" onClick={() => quitarLinea(i)}>
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <button type="button" onClick={agregarLinea} style={{ alignSelf: 'flex-start' }}>
          + Agregar producto
        </button>

        <p style={{ fontWeight: 'bold' }}>Total: {total.toFixed(2)}</p>

        {error && <p style={{ color: '#a33' }}>{error}</p>}

        <button type="submit" disabled={guardando}>
          Registrar venta
        </button>
      </form>
    </main>
  )
}
