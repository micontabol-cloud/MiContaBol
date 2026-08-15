import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MetodoPagoSelector from '../components/MetodoPagoSelector'
import AsientoPreview from '../components/AsientoPreview'
import SelectorContacto from '../components/SelectorContacto'
import EscanerCodigo from '../components/EscanerCodigo'
import BuscadorProductos from '../components/BuscadorProductos'
import { useRol, puedeConfigurar } from '../contexts/RolContext'

// La preferencia de ocultar montos es del DISPOSITIVO, no de la
// cuenta: la computadora del mostrador la ve el cliente, la del
// escritorio no.
const CLAVE_OCULTAR = 'micontabol_ocultar_montos'

export default function NuevaVentaProducto() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()
  const { rol } = useRol()

  // El vendedor nunca ve costos ni márgenes
  const puedeVerCostos = puedeConfigurar(rol)

  // Por defecto vienen ocultos. Si alguien olvida activarlo, el costo
  // es que un cliente vea tu margen; al revés, solo hay que tocar un
  // botón. Los valores por defecto van del lado seguro.
  const [ocultarManual, setOcultarManual] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_OCULTAR) !== 'no'
    } catch {
      return true
    }
  })

  const ocultarSensibles = !puedeVerCostos || ocultarManual

  function cambiarOcultar(valor) {
    setOcultarManual(valor)
    try {
      window.localStorage.setItem(CLAVE_OCULTAR, valor ? 'si' : 'no')
    } catch {
      // Si el navegador no deja guardar, igual funciona en esta sesión
    }
  }

  const [productos, setProductos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [metodos, setMetodos] = useState([])
  const [cuentasBanco, setCuentasBanco] = useState([])
  const [cuentaDestino, setCuentaDestino] = useState('')
  const [empresa, setEmpresa] = useState(null)
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [clienteId, setClienteId] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [concepto, setConcepto] = useState('')
  const [metodoId, setMetodoId] = useState('')
  const [descuento, setDescuento] = useState('')
  const [esOtroIngreso, setEsOtroIngreso] = useState(false)
  const [lineas, setLineas] = useState([
    { clave: '', producto_id: '', variante_id: '', cantidad: '', precio_unitario: '' },
  ])
  const [error, setError] = useState(null)
  const [avisoEscaneo, setAvisoEscaneo] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      // Si la empresa todavía no tiene métodos de cobro, se crean los
      // de siempre (efectivo, QR, tarjeta, fiado) apuntando a sus
      // cuentas de Caja y Bancos.
      await supabase.rpc('crear_metodos_pago_default', { p_empresa_id: empresaId })

      const [{ data: prods }, { data: cts }, { data: mets }, { data: emp }, { data: bancos }] = await Promise.all([
        supabase.from('vista_stock').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre_completo'),
        supabase
          .from('plan_cuentas')
          .select('id, codigo, nombre, tipo')
          .eq('empresa_id', empresaId)
          .eq('permite_movimiento', true)
          .eq('activo', true)
          .order('codigo'),
        supabase
          .from('metodos_pago')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .in('uso', ['cobro', 'ambos'])
          .order('orden'),
        supabase.from('empresas').select('*').eq('id', empresaId).single(),
        supabase.rpc('saldos_bancarios', { p_empresa_id: empresaId }),
      ])

      setProductos(prods || [])
      setCuentas(cts || [])
      setMetodos(mets || [])
      setEmpresa(emp)
      setCuentasBanco((bancos || []).filter((b) => b.activo))
      if (mets && mets.length > 0) setMetodoId((actual) => actual || mets[0].id)
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
        nuevas[i].precio_unitario = item.precio_venta
      }
    }
    setLineas(nuevas)
  }

  // Agregar al carrito: si el producto ya estaba, le suma uno más, que
  // es lo que espera quien pasa varias unidades iguales.
  function agregarProducto(item) {
    setAvisoEscaneo(null)
    const clave = `${item.producto_id}|${item.variante_id || ''}`

    setLineas((prev) => {
      const existente = prev.findIndex((l) => l.clave === clave)
      if (existente >= 0) {
        const copia = [...prev]
        copia[existente] = {
          ...copia[existente],
          cantidad: String((parseFloat(copia[existente].cantidad) || 0) + 1),
        }
        return copia
      }

      const nueva = {
        clave,
        producto_id: item.producto_id,
        variante_id: item.variante_id || '',
        cantidad: '1',
        precio_unitario: item.precio_venta,
      }

      // Si la primera fila está vacía, la usamos en vez de agregar otra
      const primeraVacia = prev.findIndex((l) => !l.producto_id)
      if (primeraVacia >= 0) {
        const copia = [...prev]
        copia[primeraVacia] = nueva
        return copia
      }

      return [...prev, nueva]
    })
  }

  function agregarPorCodigo(codigo) {
    const limpio = codigo.trim().toLowerCase()
    const item = productos.find(
      (p) => (p.codigo_barras || '').toLowerCase() === limpio || (p.codigo || '').toLowerCase() === limpio
    )

    if (!item) {
      setAvisoEscaneo(`No encontré ningún producto con el código "${codigo}".`)
      return
    }

    agregarProducto(item)
  }

  function agregarLinea() {
    setLineas([...lineas, { clave: '', producto_id: '', variante_id: '', cantidad: '', precio_unitario: '' }])
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const metodo = metodos.find((m) => m.id === metodoId)
  const esCredito = !!metodo?.es_credito

  // El método define a dónde entra el dinero, pero si hay varias
  // cuentas bancarias el vendedor puede necesitar cambiarla: el QR de
  // hoy puede llegar a un banco distinto al de siempre.
  const cuentaMetodo = metodo?.cuenta_id || ''
  const cuentaEfectiva = cuentaDestino || cuentaMetodo
  const metodoEsBancario = cuentasBanco.some((b) => b.cuenta_id === cuentaMetodo)
  const puedeElegirBanco = !esCredito && cuentasBanco.length > 1 && (metodoEsBancario || !cuentaMetodo)

  const bruto = lineas.reduce(
    (sum, l) => sum + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0),
    0
  )
  const descuentoNum = Math.min(parseFloat(descuento) || 0, bruto)
  const total = bruto - descuentoNum

  const costoTotal = lineas.reduce((sum, l) => {
    const item = productos.find((p) => `${p.producto_id}|${p.variante_id || ''}` === l.clave)
    return sum + (parseFloat(l.cantidad) || 0) * Number(item?.costo_fijo || 0)
  }, 0)

  const cuentaPorId = useMemo(() => new Map(cuentas.map((c) => [c.id, c])), [cuentas])

  // Arma la vista previa del asiento en lenguaje de comerciante.
  const preview = useMemo(() => {
    if (total <= 0) return null

    const cuentaCobro = esCredito ? cuentaPorId.get(empresa?.cuenta_cxc_id) : cuentaPorId.get(cuentaEfectiva)
    const cuentaVentas = cuentaPorId.get(
      esOtroIngreso ? empresa?.cuenta_otros_ingresos_id : empresa?.cuenta_ventas_id
    )
    const cuentaDescuentos = cuentaPorId.get(empresa?.cuenta_descuentos_id)
    const cuentaCosto = cuentaPorId.get(empresa?.cuenta_costo_ventas_id)
    const cuentaInv = cuentaPorId.get(empresa?.cuenta_inventario_id)

    const faltantes = []
    if (!cuentaCobro) {
      faltantes.push(
        esCredito
          ? 'la cuenta de Cuentas por Cobrar'
          : `dónde entra el dinero de "${metodo?.nombre}" — se configura en Formas de pago`
      )
    }
    if (!cuentaVentas) faltantes.push(esOtroIngreso ? 'Otros Ingresos' : 'Ventas')
    if (descuentoNum > 0 && !cuentaDescuentos) faltantes.push('Descuentos en Ventas')
    if (!cuentaCosto) faltantes.push('Costo de Ventas')
    if (!cuentaInv) faltantes.push('Inventario')

    const lineasPreview = [
      {
        icono: esCredito ? '🤝' : '💰',
        frase: esCredito
          ? `${nombreCliente || 'El cliente'} te queda debiendo Bs ${total.toFixed(2)}.`
          : `Entran Bs ${total.toFixed(2)} a ${cuentaCobro?.nombre || metodo?.nombre || 'tu cuenta'}.`,
        cuenta: cuentaCobro,
        debe: total,
        haber: 0,
      },
      ...(descuentoNum > 0
        ? [
            {
              icono: '🏷️',
              frase: `Le hiciste Bs ${descuentoNum.toFixed(2)} de descuento — queda registrado aparte.`,
              cuenta: cuentaDescuentos,
              debe: descuentoNum,
              haber: 0,
            },
          ]
        : []),
      {
        icono: '📈',
        frase: esOtroIngreso
          ? `Registras Bs ${bruto.toFixed(2)} como otro ingreso (no es una venta normal).`
          : `Registras Bs ${bruto.toFixed(2)} como venta del mes.`,
        cuenta: cuentaVentas,
        debe: 0,
        haber: bruto,
      },
      {
        icono: '📦',
        frase: `Salen Bs ${costoTotal.toFixed(2)} de tu inventario (lo que te costó la mercadería).`,
        fraseOculta: 'Sale de tu inventario lo que te costó la mercadería.',
        sensible: true,
        cuenta: cuentaCosto,
        debe: costoTotal,
        haber: 0,
      },
      {
        icono: '📉',
        frase: `Tu inventario baja en Bs ${costoTotal.toFixed(2)}.`,
        fraseOculta: 'Tu inventario baja por esta venta.',
        sensible: true,
        cuenta: cuentaInv,
        debe: 0,
        haber: costoTotal,
      },
    ]

    return {
      lineas: lineasPreview,
      ganancia: total - costoTotal,
      aviso:
        faltantes.length > 0
          ? `Falta configurar: ${faltantes.join(', ')}. Ve a Inventario → Productos → Configuración de cuentas.`
          : null,
    }
  }, [total, bruto, descuentoNum, costoTotal, esCredito, esOtroIngreso, metodo, cuentaEfectiva, empresa, cuentaPorId, nombreCliente])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!metodo) {
      setError('Selecciona cómo te pagan.')
      return
    }
    if (esCredito && !clienteId) {
      setError('Una venta fiada necesita saber quién es el cliente, para poder cobrarle después.')
      return
    }
    if (!esCredito && !cuentaEfectiva) {
      setError(
        `Falta definir dónde entra el dinero de "${metodo.nombre}". Ve a Formas de pago en el menú y asígnale su cuenta.`
      )
      return
    }

    setGuardando(true)

    const lineasPayload = lineas
      .filter((l) => l.producto_id)
      .map((l) => ({
        producto_id: l.producto_id,
        variante_id: l.variante_id || null,
        cantidad: parseFloat(l.cantidad) || 0,
        precio_unitario: parseFloat(l.precio_unitario) || 0,
      }))

    const { error } = await supabase.rpc('vender_productos', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_cliente: nombreCliente || null,
      p_cliente_id: clienteId,
      p_concepto: concepto || null,
      p_es_credito: esCredito,
      p_cuenta_cobro_id: esCredito ? null : cuentaEfectiva,
      p_lineas: lineasPayload,
      p_descuento: descuentoNum,
      p_cuenta_ingreso_id: esOtroIngreso ? empresa?.cuenta_otros_ingresos_id : empresa?.cuenta_ventas_id,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/ventas`)
  }

  return (
    <main style={{ maxWidth: 780, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/ventas`}>&larr; Volver</Link>
      </p>
      <h1>Nueva venta</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label>
            Fecha
            <br />
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <div style={{ flex: 1, minWidth: 220 }}>
            <SelectorContacto
              empresaId={empresaId}
              tipo="cliente"
              valor={clienteId}
              onChange={setClienteId}
              onChangeNombre={setNombreCliente}
              obligatorio={esCredito}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <BuscadorProductos productos={productos} onElegir={agregarProducto} />

          <details style={{ fontSize: '0.9rem' }}>
            <summary style={{ cursor: 'pointer', color: '#64748B' }}>Escanear con lector o cámara</summary>
            <div style={{ marginTop: '0.6rem' }}>
              <EscanerCodigo
                onCodigo={agregarPorCodigo}
                autoFocus={false}
                placeholder="Escanea el código de barras..."
              />
            </div>
          </details>

          {avisoEscaneo && <p style={{ color: '#F59E0B', fontSize: '0.88rem', margin: 0 }}>{avisoEscaneo}</p>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Producto</th>
              <th style={{ padding: '4px 8px' }}>Cantidad</th>
              <th style={{ padding: '4px 8px' }}>Precio</th>
              <th style={{ padding: '4px 8px' }}>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => {
              const prod = productos.find((p) => `${p.producto_id}|${p.variante_id || ''}` === l.clave)
              const subtotal = (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio_unitario) || 0)
              return (
                <tr key={i}>
                  <td style={{ padding: '4px 8px' }}>
                    <select required value={l.clave} onChange={(e) => actualizarLinea(i, 'clave', e.target.value)}>
                      <option value="">-- Selecciona --</option>
                      {productos.map((p) => {
                        const clave = `${p.producto_id}|${p.variante_id || ''}`
                        const etiquetas = [p.categoria_nombre, p.observaciones].filter(Boolean).join(' · ')
                        return (
                          <option key={clave} value={clave}>
                            {p.nombre_completo}
                            {etiquetas && ` [${etiquetas}]`} — stock {Number(p.stock_actual).toFixed(0)}
                          </option>
                        )
                      })}
                    </select>

                    {prod && (prod.categoria_nombre || prod.observaciones) && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.35rem',
                          flexWrap: 'wrap',
                          marginTop: '0.25rem',
                          fontSize: '0.78rem',
                        }}
                      >
                        {prod.categoria_nombre && (
                          <span
                            style={{
                              background: '#F7F9FC',
                              border: '1px solid #E6ECF3',
                              borderRadius: 999,
                              padding: '0.05rem 0.45rem',
                              color: '#64748B',
                              fontWeight: 600,
                            }}
                          >
                            {prod.categoria_nombre}
                          </span>
                        )}
                        {prod.observaciones && (
                          <span style={{ color: '#A3AFBF', alignSelf: 'center' }}>{prod.observaciones}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px 8px', verticalAlign: 'top' }}>
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

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label>
            Descuento (opcional)
            <br />
            <input
              type="number"
              step="0.01"
              min="0"
              max={bruto}
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
              placeholder="0.00"
              style={{ width: 110 }}
            />
          </label>
          <div>
            {descuentoNum > 0 && (
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                Subtotal Bs {bruto.toFixed(2)} − descuento Bs {descuentoNum.toFixed(2)}
              </p>
            )}
            <p style={{ fontWeight: 700, fontSize: '1.3rem', color: '#1F3A5F', margin: 0 }}>
              Total: Bs {total.toFixed(2)}
            </p>
          </div>
        </div>

        <MetodoPagoSelector
          metodos={metodos}
          valor={metodoId}
          onChange={(id) => {
            setMetodoId(id)
            setCuentaDestino('')
          }}
          etiqueta="¿Cómo te pagan?"
        />

        {puedeElegirBanco && (
          <label>
            ¿A qué cuenta entra?
            <br />
            <select value={cuentaEfectiva} onChange={(e) => setCuentaDestino(e.target.value)} style={{ minWidth: 260 }}>
              {!cuentaMetodo && <option value="">-- Selecciona --</option>}
              {cuentasBanco.map((b) => (
                <option key={b.id} value={b.cuenta_id}>
                  {b.banco}
                  {b.alias ? ` · ${b.alias}` : ''}
                  {b.numero ? ` (${String(b.numero).slice(-4)})` : ''}
                </option>
              ))}
            </select>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
              Viene la de siempre. Cámbiala solo si este cobro llegó a otra cuenta.
            </span>
          </label>
        )}

        {!esCredito && !cuentaEfectiva && (
          <p
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 12,
              padding: '0.8rem 0.95rem',
              margin: 0,
              fontSize: '0.9rem',
              color: '#8a5a00',
              lineHeight: 1.5,
            }}
          >
            Falta definir dónde entra el dinero de <strong>{metodo?.nombre}</strong>.{' '}
            <Link to={`/empresas/${empresaId}/formas-de-pago`}>Configúralo en Formas de pago</Link> — se hace una
            sola vez.
            {cuentasBanco.length === 0 && (
              <>
                {' '}
                Si cobras por QR o transferencia, primero{' '}
                <Link to={`/empresas/${empresaId}/bancos`}>agrega tu cuenta bancaria</Link>.
              </>
            )}
          </p>
        )}

        <div>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: '#64748B' }}>
            {esOtroIngreso
              ? 'Se registrará como Otros ingresos.'
              : 'Se registrará como Venta.'}
          </p>
          <button
            type="button"
            onClick={() => setEsOtroIngreso(!esOtroIngreso)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              padding: 0,
              fontSize: '0.82rem',
              textDecoration: 'underline',
            }}
          >
            {esOtroIngreso ? 'Volver a registrarlo como venta' : 'Esto no es una venta normal'}
          </button>
        </div>

        <label>
          Nota (opcional)
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        {preview && (
          <AsientoPreview
            lineas={preview.lineas}
            ganancia={preview.ganancia}
            aviso={preview.aviso}
            ocultarSensibles={ocultarSensibles}
            puedeMostrar={puedeVerCostos}
            onCambiarOcultar={cambiarOcultar}
          />
        )}

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" className="btn-hero" disabled={guardando} style={{ alignSelf: 'flex-start' }}>
          Registrar venta
        </button>
      </form>
    </main>
  )
}
