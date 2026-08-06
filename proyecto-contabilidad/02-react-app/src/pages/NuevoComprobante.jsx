import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import MetodoPagoSelector from '../components/MetodoPagoSelector'
import AsientoPreview from '../components/AsientoPreview'

export default function NuevoComprobante() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tipo, setTipo] = useState(searchParams.get('tipo') === 'compra' ? 'compra' : 'venta')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [clienteProveedor, setClienteProveedor] = useState('')
  const [concepto, setConcepto] = useState('')
  const [montoTotal, setMontoTotal] = useState('')
  const [cuentaPrincipalId, setCuentaPrincipalId] = useState('')
  const [cuentaContrapartidaId, setCuentaContrapartidaId] = useState('')


  const [cuentas, setCuentas] = useState([])
  const [metodos, setMetodos] = useState([])
  const [metodoId, setMetodoId] = useState('')
  const [descuento, setDescuento] = useState('')
  const [esOtroIngreso, setEsOtroIngreso] = useState(false)
  const [empresa, setEmpresa] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarCuentas() {
      await supabase.rpc('crear_metodos_pago_default', { p_empresa_id: empresaId })
      const { data } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo')
      setCuentas(data || [])

      const { data: mets } = await supabase
        .from('metodos_pago')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('activo', true)
        .order('orden')
      setMetodos(mets || [])
      if (mets && mets.length > 0) setMetodoId((actual) => actual || mets[0].id)

      const { data: emp } = await supabase.from('empresas').select('*').eq('id', empresaId).single()
      setEmpresa(emp)
    }
    cargarCuentas()
  }, [empresaId])

  const cuentasPrincipales = cuentas.filter((c) => c.tipo === (tipo === 'venta' ? 'ingreso' : 'gasto'))

  const metodosVisibles = metodos.filter((m) => m.uso === 'ambos' || m.uso === (tipo === 'venta' ? 'cobro' : 'pago'))
  const metodo = metodosVisibles.find((m) => m.id === metodoId)
  const esCredito = !!metodo?.es_credito

  const cuentaPorId = new Map(cuentas.map((c) => [c.id, c]))
  const montoNum = parseFloat(montoTotal) || 0
  const descuentoNum = tipo === 'venta' ? Math.min(parseFloat(descuento) || 0, montoNum) : 0
  const netoNum = montoNum - descuentoNum

  // En ventas la cuenta de ingreso ya está definida (Ventas, u Otros
  // ingresos si el usuario lo indica). En compras sí se elige el gasto.
  const cuentaIngresoVenta = esOtroIngreso ? empresa?.cuenta_otros_ingresos_id : empresa?.cuenta_ventas_id
  const cuentaPrincipalEfectiva = tipo === 'venta' ? cuentaIngresoVenta : cuentaPrincipalId

  // Vista previa del asiento, explicado en lenguaje de comerciante.
  const preview = (() => {
    if (montoNum <= 0 || !metodo) return null

    const cuentaPrincipal = cuentaPorId.get(cuentaPrincipalEfectiva)
    const cuentaDescuentos = cuentaPorId.get(empresa?.cuenta_descuentos_id)
    const cuentaContra = esCredito
      ? cuentaPorId.get(tipo === 'venta' ? empresa?.cuenta_cxc_id : empresa?.cuenta_cxp_id)
      : cuentaPorId.get(metodo.cuenta_id)

    const faltantes = []
    if (!cuentaPrincipal) faltantes.push(tipo === 'venta' ? (esOtroIngreso ? 'Otros Ingresos' : 'Ventas') : 'la cuenta de gasto')
    if (descuentoNum > 0 && !cuentaDescuentos) faltantes.push('Descuentos en Ventas')
    if (!cuentaContra) {
      faltantes.push(
        esCredito
          ? tipo === 'venta'
            ? 'Cuentas por Cobrar'
            : 'Cuentas por Pagar'
          : `la cuenta de "${metodo.nombre}"`
      )
    }

    const lineasPreview =
      tipo === 'venta'
        ? [
            {
              icono: esCredito ? '🤝' : '💰',
              frase: esCredito
                ? `${clienteProveedor || 'El cliente'} te queda debiendo Bs ${netoNum.toFixed(2)}.`
                : `Entran Bs ${netoNum.toFixed(2)} a ${cuentaContra?.nombre || metodo.nombre}.`,
              cuenta: cuentaContra,
              debe: netoNum,
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
                ? `Registras Bs ${montoNum.toFixed(2)} como otro ingreso (no es una venta normal).`
                : `Registras Bs ${montoNum.toFixed(2)} como venta del mes.`,
              cuenta: cuentaPrincipal,
              debe: 0,
              haber: montoNum,
            },
          ]
        : [
            {
              icono: '🧾',
              frase: `Registras Bs ${montoNum.toFixed(2)} de gasto en "${cuentaPrincipal?.nombre || 'tu cuenta de gasto'}".`,
              cuenta: cuentaPrincipal,
              debe: montoNum,
              haber: 0,
            },
            {
              icono: esCredito ? '🤝' : '💸',
              frase: esCredito
                ? `Le quedas debiendo Bs ${montoNum.toFixed(2)} a ${clienteProveedor || 'tu proveedor'}.`
                : `Salen Bs ${montoNum.toFixed(2)} de ${cuentaContra?.nombre || metodo.nombre}.`,
              cuenta: cuentaContra,
              debe: 0,
              haber: montoNum,
            },
          ]

    return {
      lineas: lineasPreview,
      aviso:
        faltantes.length > 0
          ? `Falta configurar: ${faltantes.join(', ')}.`
          : null,
    }
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!cuentaPrincipalEfectiva) {
      setError(
        tipo === 'venta'
          ? 'Falta configurar tu cuenta de Ventas. Ve a Inventario → Productos → Configuración.'
          : 'Selecciona en qué gasto se registra.'
      )
      return
    }
    if (esCredito && !clienteProveedor.trim()) {
      setError(`Una operación a crédito necesita el nombre del ${tipo === 'venta' ? 'cliente' : 'proveedor'}.`)
      return
    }
    if (!metodo) {
      setError(tipo === 'venta' ? 'Selecciona cómo te pagan.' : 'Selecciona cómo pagas.')
      return
    }
    if (!esCredito && !metodo.cuenta_id) {
      setError(`El método "${metodo.nombre}" todavía no tiene una cuenta asignada. Configúralo en Productos.`)
      return
    }

    setGuardando(true)

    const { error } = await supabase.rpc('crear_comprobante_con_asiento', {
      p_empresa_id: empresaId,
      p_tipo: tipo,
      p_fecha: fecha,
      p_cliente_proveedor: clienteProveedor || null,
      p_concepto: concepto || null,
      p_monto_total: parseFloat(montoTotal),
      p_cuenta_principal_id: cuentaPrincipalEfectiva,
      p_descuento: descuentoNum,
      p_cuenta_contrapartida_id: esCredito ? null : metodo.cuenta_id,
      p_es_credito: esCredito,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/${tipo === 'venta' ? 'ventas' : 'compras'}`)
  }

  return (
    <main style={{ maxWidth: 480, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/${tipo === 'venta' ? 'ventas' : 'compras'}`}>&larr; Volver</Link>
      </p>
      <h1>Nueva {tipo === 'venta' ? 'venta' : 'compra'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Tipo
          <br />
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setCuentaPrincipalId('')
            }}
            style={{ width: '100%' }}
          >
            <option value="venta">Venta</option>
            <option value="compra">Compra</option>
          </select>
        </label>

        <label>
          Fecha
          <br />
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <label>
          {tipo === 'venta' ? 'Cliente' : 'Proveedor'}
          <br />
          <input
            value={clienteProveedor}
            onChange={(e) => setClienteProveedor(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        <label>
          Monto total
          <br />
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        {tipo === 'venta' ? (
          <>
            <label>
              Descuento (opcional)
              <br />
              <input
                type="number"
                step="0.01"
                min="0"
                max={montoNum}
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                placeholder="0.00"
                style={{ width: 110 }}
              />
              {descuentoNum > 0 && (
                <span style={{ marginLeft: '0.6rem', color: '#64748B', fontSize: '0.85rem' }}>
                  El cliente paga Bs {netoNum.toFixed(2)}
                </span>
              )}
            </label>

            <div>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: '#64748B' }}>
                {esOtroIngreso ? 'Se registrará como Otros ingresos.' : 'Se registrará como Venta.'}
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
          </>
        ) : (
          <label>
            ¿En qué se gastó?
            <br />
            <select
              required
              value={cuentaPrincipalId}
              onChange={(e) => setCuentaPrincipalId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">-- Selecciona --</option>
              {cuentasPrincipales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {cuentasPrincipales.length === 0 && (
              <span style={{ color: '#EF4444', fontSize: '0.85em' }}>
                No tienes cuentas de gasto todavía — agrega una en Plan de cuentas primero.
              </span>
            )}
          </label>
        )}

        <MetodoPagoSelector
          metodos={metodosVisibles}
          valor={metodoId}
          onChange={setMetodoId}
          etiqueta={tipo === 'venta' ? '¿Cómo te pagan?' : '¿Cómo pagas?'}
        />

        {preview && <AsientoPreview lineas={preview.lineas} aviso={preview.aviso} />}

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" disabled={guardando}>
          Registrar {tipo === 'venta' ? 'venta' : 'compra'}
        </button>
      </form>
    </main>
  )
}
