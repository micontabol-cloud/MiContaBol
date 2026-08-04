import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Productos() {
  const { id: empresaId } = useParams()
  const [productos, setProductos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('unidad')
  const [costoFijo, setCostoFijo] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockInicial, setStockInicial] = useState('0')
  const [guardando, setGuardando] = useState(false)

  const [cuentaVentas, setCuentaVentas] = useState('')
  const [cuentaCosto, setCuentaCosto] = useState('')
  const [cuentaInventario, setCuentaInventario] = useState('')
  const [cuentaCxc, setCuentaCxc] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: prods, error: errProds }, { data: cts }, { data: emp }] = await Promise.all([
      supabase.from('productos').select('*').eq('empresa_id', empresaId).order('codigo'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .order('codigo'),
      supabase.from('empresas').select('*').eq('id', empresaId).single(),
    ])

    if (errProds) setError(errProds.message)
    setProductos(prods || [])
    setCuentas(cts || [])
    setEmpresa(emp)
    if (emp) {
      setCuentaVentas(emp.cuenta_ventas_id || '')
      setCuentaCosto(emp.cuenta_costo_ventas_id || '')
      setCuentaInventario(emp.cuenta_inventario_id || '')
      setCuentaCxc(emp.cuenta_cxc_id || '')
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function guardarConfig(e) {
    e.preventDefault()
    setGuardandoConfig(true)
    setError(null)

    const { error } = await supabase
      .from('empresas')
      .update({
        cuenta_ventas_id: cuentaVentas || null,
        cuenta_costo_ventas_id: cuentaCosto || null,
        cuenta_inventario_id: cuentaInventario || null,
        cuenta_cxc_id: cuentaCxc || null,
      })
      .eq('id', empresaId)

    setGuardandoConfig(false)
    if (error) {
      setError(error.message)
      return
    }
    cargar()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('productos').insert({
      empresa_id: empresaId,
      codigo,
      nombre,
      unidad_medida: unidad,
      costo_fijo: parseFloat(costoFijo) || 0,
      precio_venta: parseFloat(precioVenta) || 0,
      stock_actual: parseFloat(stockInicial) || 0,
    })

    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }

    setCodigo('')
    setNombre('')
    setCostoFijo('')
    setPrecioVenta('')
    setStockInicial('0')
    cargar()
  }

  const cuentasIngreso = cuentas.filter((c) => c.tipo === 'ingreso')
  const cuentasGasto = cuentas.filter((c) => c.tipo === 'gasto')
  const cuentasActivo = cuentas.filter((c) => c.tipo === 'activo')

  const configCompleta = empresa?.cuenta_ventas_id && empresa?.cuenta_costo_ventas_id && empresa?.cuenta_inventario_id

  return (
    <main style={{ maxWidth: 860, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario`}>&larr; Volver</Link>
      </p>
      <h1>Productos e inventario</h1>

      <details open={!configCompleta} style={{ margin: '1rem 0', border: '1px solid #E6ECF3', borderRadius: 6, padding: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          Configuración de cuentas {configCompleta ? '✅' : '⚠️ (falta configurar)'}
        </summary>
        <form onSubmit={guardarConfig} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          <label>
            Cuenta de ventas (ingreso)
            <br />
            <select value={cuentaVentas} onChange={(e) => setCuentaVentas(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasIngreso.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cuenta de costo de ventas (gasto)
            <br />
            <select value={cuentaCosto} onChange={(e) => setCuentaCosto(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasGasto.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cuenta de inventario (activo)
            <br />
            <select value={cuentaInventario} onChange={(e) => setCuentaInventario(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasActivo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cuenta de cuentas por cobrar (activo)
            <br />
            <select value={cuentaCxc} onChange={(e) => setCuentaCxc(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasActivo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={guardandoConfig} style={{ alignSelf: 'flex-start' }}>
            Guardar configuración
          </button>
        </form>
        <p style={{ fontSize: '0.85em', color: '#A3AFBF', marginTop: '0.5rem' }}>
          Necesitas tener creadas cuentas de tipo ingreso, gasto y activo en tu Plan de Cuentas primero.
        </p>
      </details>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', margin: '1.5rem 0' }}
      >
        <label>
          Código
          <br />
          <input required value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ width: 90 }} />
        </label>
        <label>
          Nombre
          <br />
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: 180 }} />
        </label>
        <label>
          Unidad
          <br />
          <input value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ width: 90 }} />
        </label>
        <label>
          Costo fijo
          <br />
          <input type="number" step="0.01" min="0" value={costoFijo} onChange={(e) => setCostoFijo(e.target.value)} style={{ width: 90 }} />
        </label>
        <label>
          Precio venta
          <br />
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            style={{ width: 90 }}
          />
        </label>
        <label>
          Stock inicial
          <br />
          <input
            type="number"
            step="0.001"
            min="0"
            value={stockInicial}
            onChange={(e) => setStockInicial(e.target.value)}
            style={{ width: 90 }}
          />
        </label>
        <button type="submit" disabled={guardando}>
          Agregar producto
        </button>
      </form>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : productos.length === 0 ? (
        <p>Todavía no hay productos.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Código</th>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo fijo</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio venta</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{p.codigo}</td>
                <td style={{ padding: '4px 8px' }}>{p.nombre}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(p.costo_fijo).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(p.precio_venta).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                  {Number(p.stock_actual).toFixed(2)} {p.unidad_medida}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
