import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MetodoPagoSelector from '../components/MetodoPagoSelector'
import AsientoPreview from '../components/AsientoPreview'

export default function NuevaCompraProducto() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [productos, setProductos] = useState([])
  const [controlanVenc, setControlanVenc] = useState(new Set())
  const [cuentas, setCuentas] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [proveedor, setProveedor] = useState('')
  const [concepto, setConcepto] = useState('')
  const [metodos, setMetodos] = useState([])
  const [metodoId, setMetodoId] = useState('')
  const [empresa, setEmpresa] = useState(null)
  const [lineas, setLineas] = useState([
    { clave: '', producto_id: '', variante_id: '', cantidad: '', costo_unitario: '', codigo_lote: '', fecha_vencimiento: '' },
  ])
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      await supabase.rpc('crear_metodos_pago_default', { p_empresa_id: empresaId })

      const [{ data: prods }, { data: cts }, { data: conVenc }, { data: mets }, { data: emp }] = await Promise.all([
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre_completo'),
        supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, tipo')
          .eq('empresa_id', empresaId)
          .eq('permite_movimiento', true)
          .eq('activo', true)
          .order('codigo'),
        supabase.from('productos').select('id').eq('empresa_id', empresaId).eq('controla_vencimiento', true),
        supabase
          .from('metodos_pago')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .in('uso', ['pago', 'ambos'])
          .order('orden'),
        supabase.from('empresas').select('*').eq('id', empresaId).single(),
      ])
      setProductos(prods || [])
      setControlanVenc(new Set((conVenc || []).map((p) => p.id)))
      setMetodos(mets || [])
      setEmpresa(emp)
      if (mets && mets.length > 0) setMetodoId((actual) => actual || mets[0].id)
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
    setLineas([
      ...lineas,
      { clave: '', producto_id: '', variante_id: '', cantidad: '', costo_unitario: '', codigo_lote: '', fecha_vencimiento: '' },
    ])
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const total = lineas.reduce((sum, l) => sum + (parseFloat(l.cantidad) || 0) * (parseFloat(l.costo_unitario) || 0), 0)

  const metodo = metodos.find((m) => m.id === metodoId)
  const esCredito = !!metodo?.es_credito
  const cuentaPorId = new Map(cuentas.map((c) => [c.id, c]))

  // Vista previa del asiento, explicado en lenguaje de comerciante.
  const preview = (() => {
    if (total <= 0 || !metodo) return null

    const cuentaInv = cuentaPorId.get(empresa?.cuenta_inventario_id)
    const cuentaPago = esCredito ? cuentaPorId.get(empresa?.cuenta_cxp_id) : cuentaPorId.get(metodo.cuenta_id)

    const faltantes = []
    if (!cuentaInv) faltantes.push('Inventario')
    if (!cuentaPago) faltantes.push(esCredito ? 'Cuentas por Pagar' : `la cuenta de "${metodo.nombre}"`)

    return {
      lineas: [
        {
          icono: '📦',
          frase: `Tu inventario sube en Bs ${total.toFixed(2)} — la mercadería ya es tuya.`,
          cuenta: cuentaInv,
          debe: total,
          haber: 0,
        },
        {
          icono: esCredito ? '🤝' : '💸',
          frase: esCredito
            ? `Le quedas debiendo Bs ${total.toFixed(2)} a ${proveedor || 'tu proveedor'}.`
            : `Salen Bs ${total.toFixed(2)} de ${cuentaPago?.nombre || metodo.nombre}.`,
          cuenta: cuentaPago,
          debe: 0,
          haber: total,
        },
      ],
      aviso:
        faltantes.length > 0
          ? `Falta configurar: ${faltantes.join(', ')}. Ve a Productos → Configuración de cuentas.`
          : null,
    }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!metodo) {
      setError('Selecciona cómo pagas.')
      return
    }
    if (esCredito && !proveedor.trim()) {
      setError('Una compra fiada necesita el nombre del proveedor, para saber a quién le debes.')
      return
    }
    if (!esCredito && !metodo.cuenta_id) {
      setError(`El método "${metodo.nombre}" todavía no tiene una cuenta asignada. Configúralo en Formas de pago.`)
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
        codigo_lote: l.codigo_lote || null,
        fecha_vencimiento: l.fecha_vencimiento || null,
      }))

    const { error } = await supabase.rpc('comprar_productos', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_proveedor: proveedor || null,
      p_concepto: concepto || null,
      p_cuenta_pago_id: esCredito ? null : metodo.cuenta_id,
      p_es_credito: esCredito,
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
            Proveedor {esCredito && <strong style={{ color: '#F2555A' }}>(obligatorio si es fiado)</strong>}
            <br />
            <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>

        <label>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        <MetodoPagoSelector metodos={metodos} valor={metodoId} onChange={setMetodoId} etiqueta="¿Cómo pagas?" />

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
            {lineas.map((l, i) =>
              controlanVenc.has(l.producto_id) ? (
                <tr key={`venc-${i}`}>
                  <td colSpan={5} style={{ padding: '0 8px 8px', background: '#F7F9FC' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        Lote de <strong>{productos.find((p) => `${p.producto_id}|${p.variante_id || ''}` === l.clave)?.nombre_completo}</strong>
                      </span>
                      <label>
                        Código de lote
                        <br />
                        <input
                          value={l.codigo_lote}
                          onChange={(e) => actualizarLinea(i, 'codigo_lote', e.target.value)}
                          placeholder="opcional"
                          style={{ width: 120 }}
                        />
                      </label>
                      <label>
                        Vence
                        <br />
                        <input
                          type="date"
                          required
                          value={l.fecha_vencimiento}
                          onChange={(e) => actualizarLinea(i, 'fecha_vencimiento', e.target.value)}
                        />
                      </label>
                    </div>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>

        <button type="button" onClick={agregarLinea} style={{ alignSelf: 'flex-start' }}>
          + Agregar producto
        </button>

        <p style={{ fontWeight: 'bold' }}>Total: {total.toFixed(2)}</p>

        {preview && <AsientoPreview lineas={preview.lineas} aviso={preview.aviso} />}

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" className="btn-hero" disabled={guardando} style={{ alignSelf: 'flex-start' }}>
          Registrar compra
        </button>
      </form>
    </main>
  )
}
