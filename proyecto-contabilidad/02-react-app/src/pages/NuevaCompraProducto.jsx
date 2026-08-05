import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NuevaCompraProducto() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [proveedor, setProveedor] = useState('')
  const [concepto, setConcepto] = useState('')
  const [cuentaPagoId, setCuentaPagoId] = useState('')
  const [lineas, setLineas] = useState([{ clave: '', producto_id: '', variante_id: '', cantidad: '', costo_unitario: '' }])
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      const [{ data: prods }, { data: cts }] = await Promise.all([
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre_completo'),
        supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, tipo')
          .eq('empresa_id', empresaId)
          .eq('permite_movimiento', true)
          .eq('activo', true)
          .order('codigo'),
      ])
      setProductos(prods || [])
      setCuentas((cts || []).filter((c) => c.tipo === 'activo' || c.tipo === 'pasivo'))
    }
    cargar()
  }, [empresaId])

  // Cada opción del selector es "producto_id|variante_id" — así una
  // misma lista muestra productos simples y variantes juntos.
  function actualizarLinea(i, campo, valor) {
    const nuevas = [...lineas]
    nuevas[i] = { ...nuevas[i], [campo]: valor }
    if (campo === 'clave') {
      const item = productos.find((p) => `${p.producto_id}|${p.variante_id || ''}` === valor)
      if (item) {
        nuevas[i].producto_id = item.producto_id
        nuevas[i].variante_id = item.variante_id || ''
        nuevas[i].costo_unitario = item.costo_fijo
      }
    }
    setLineas(nuevas)
  }

  function agregarLinea() {
    setLineas([...lineas, { clave: '', producto_id: '', variante_id: '', cantidad: '', costo_unitario: '' }])
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const total = lineas.reduce((sum, l) => sum + (parseFloat(l.cantidad) || 0) * (parseFloat(l.costo_unitario) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!cuentaPagoId) {
      setError('Selecciona con qué cuenta pagas.')
      return
    }

    setGuardando(true)

    const lineasPayload = lineas
      .filter((l) => l.producto_id)
      .map((l) => ({
        producto_id: l.producto_id,
        variante_id: l.variante_id || null,
        cantidad: parseFloat(l.cantidad) || 0,
        costo_unitario: parseFloat(l.costo_unitario) || 0,
      }))

    const { error } = await supabase.rpc('comprar_productos', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_proveedor: proveedor || null,
      p_concepto: concepto || null,
      p_cuenta_pago_id: cuentaPagoId,
      p_lineas: lineasPayload,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/compras`)
  }

  return (
    <main style={{ maxWidth: 760, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/compras`}>&larr; Volver</Link>
      </p>
      <h1>Nueva compra de inventario</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label>
            Fecha
            <br />
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            Proveedor
            <br />
            <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>

        <label>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        <label>
          Cuenta con la que pagas
          <br />
          <select required value={cuentaPagoId} onChange={(e) => setCuentaPagoId(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Producto</th>
              <th style={{ padding: '4px 8px' }}>Cantidad</th>
              <th style={{ padding: '4px 8px' }}>Costo unitario</th>
              <th style={{ padding: '4px 8px' }}>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => {
              const subtotal = (parseFloat(l.cantidad) || 0) * (parseFloat(l.costo_unitario) || 0)
              return (
                <tr key={i}>
                  <td style={{ padding: '4px 8px' }}>
                    <select required value={l.clave} onChange={(e) => actualizarLinea(i, 'clave', e.target.value)}>
                      <option value="">-- Selecciona --</option>
                      {productos.map((p) => {
                        const clave = `${p.producto_id}|${p.variante_id || ''}`
                        return (
                          <option key={clave} value={clave}>
                            {p.codigo} — {p.nombre_completo}
                          </option>
                        )
                      })}
                    </select>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
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
                      value={l.costo_unitario}
                      onChange={(e) => actualizarLinea(i, 'costo_unitario', e.target.value)}
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

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" disabled={guardando}>
          Registrar compra
        </button>
      </form>
    </main>
  )
}
