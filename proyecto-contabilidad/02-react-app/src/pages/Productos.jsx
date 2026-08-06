import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BoliMascot from '../components/BoliMascot'

function margenDe(costo, precio) {
  const c = Number(costo)
  const p = Number(precio)
  if (!p) return null
  return ((p - c) / p) * 100
}

function colorMargen(m) {
  if (m === null) return '#A3AFBF'
  if (m < 15) return '#EF4444'
  if (m < 30) return '#F59E0B'
  return '#22C55E'
}

export default function Productos() {
  const { id: empresaId } = useParams()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('unidad')
  const [costoFijo, setCostoFijo] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockInicial, setStockInicial] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [nuevaCategoriaId, setNuevaCategoriaId] = useState('')
  const [nuevoControlaVenc, setNuevoControlaVenc] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [edRubro, setEdRubro] = useState('otro')
  const [edUsaVenc, setEdUsaVenc] = useState(false)

  const [nombreCategoria, setNombreCategoria] = useState('')
  const [padreCategoria, setPadreCategoria] = useState('')
  const [guardandoCat, setGuardandoCat] = useState(false)

  const [cuentaVentas, setCuentaVentas] = useState('')
  const [cuentaCosto, setCuentaCosto] = useState('')
  const [cuentaInventario, setCuentaInventario] = useState('')
  const [cuentaCxc, setCuentaCxc] = useState('')
  const [cuentaCxp, setCuentaCxp] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [autoconfigurando, setAutoconfigurando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [prodRes, catRes, ctasRes, empRes, varRes] = await Promise.all([
      supabase.from('productos').select('*').eq('empresa_id', empresaId).order('codigo'),
      supabase.from('categorias_producto').select('*').eq('empresa_id', empresaId).order('nombre'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .order('codigo'),
      supabase.from('empresas').select('*').eq('id', empresaId).single(),
      supabase.from('vista_stock').select('producto_id, stock_actual, stock_minimo').eq('empresa_id', empresaId),
    ])

    if (prodRes.error) setError(prodRes.error.message)

    // Stock total por producto: para los que tienen variantes es la
    // suma de todas ellas, para el resto es su propio stock.
    const stockPorProducto = new Map()
    ;(varRes.data || []).forEach((s) => {
      const prev = stockPorProducto.get(s.producto_id) || { stock: 0, bajo: false }
      prev.stock += Number(s.stock_actual)
      if (Number(s.stock_minimo) > 0 && Number(s.stock_actual) <= Number(s.stock_minimo)) prev.bajo = true
      stockPorProducto.set(s.producto_id, prev)
    })

    setProductos(
      (prodRes.data || []).map((p) => ({
        ...p,
        stock_total: stockPorProducto.get(p.id)?.stock ?? Number(p.stock_actual),
        tiene_stock_bajo: stockPorProducto.get(p.id)?.bajo ?? false,
      }))
    )
    setCategorias(catRes.data || [])
    setCuentas(ctasRes.data || [])
    setEmpresa(empRes.data)
    if (empRes.data) {
      setCuentaVentas(empRes.data.cuenta_ventas_id || '')
      setCuentaCosto(empRes.data.cuenta_costo_ventas_id || '')
      setCuentaInventario(empRes.data.cuenta_inventario_id || '')
      setCuentaCxc(empRes.data.cuenta_cxc_id || '')
      setCuentaCxp(empRes.data.cuenta_cxp_id || '')
      setEdRubro(empRes.data.rubro || 'otro')
      setEdUsaVenc(!!empRes.data.usa_vencimiento)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const nombreCategoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias])

  const rutaCategoria = (cat) => {
    const partes = []
    let actual = cat
    const vistos = new Set()
    while (actual && !vistos.has(actual.id)) {
      vistos.add(actual.id)
      partes.unshift(actual.nombre)
      actual = categorias.find((c) => c.id === actual.categoria_padre_id)
    }
    return partes.join(' › ')
  }

  const numAgotados = productos.filter((p) => p.activo && p.stock_total <= 0).length
  const numPocoStock = productos.filter((p) => p.activo && p.stock_total > 0 && p.tiene_stock_bajo).length

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (!mostrarInactivos && !p.activo) return false
      if (filtroCategoria && p.categoria_id !== filtroCategoria) return false
      if (soloStockBajo && !p.tiene_stock_bajo) return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      )
    })
  }, [productos, busqueda, filtroCategoria, soloStockBajo, mostrarInactivos])

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
        cuenta_cxp_id: cuentaCxp || null,
        rubro: edRubro,
        usa_vencimiento: edUsaVenc,
      })
      .eq('id', empresaId)
    setGuardandoConfig(false)
    if (error) return setError(error.message)
    cargar()
  }

  async function autoconfigurar() {
    setError(null)
    setAutoconfigurando(true)
    const { error } = await supabase.rpc('autoconfigurar_cuentas', { p_empresa_id: empresaId })
    setAutoconfigurando(false)
    if (error) return setError(error.message)
    cargar()
  }

  async function crearCategoria(e) {
    e.preventDefault()
    setError(null)
    setGuardandoCat(true)
    const { error } = await supabase.from('categorias_producto').insert({
      empresa_id: empresaId,
      nombre: nombreCategoria,
      categoria_padre_id: padreCategoria || null,
    })
    setGuardandoCat(false)
    if (error) return setError(error.message)
    setNombreCategoria('')
    setPadreCategoria('')
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
      stock_minimo: parseFloat(stockMinimo) || 0,
      categoria_id: nuevaCategoriaId || null,
      controla_vencimiento: empresa?.usa_vencimiento ? nuevoControlaVenc : false,
    })
    setGuardando(false)
    if (error) return setError(error.message)
    setCodigo('')
    setNombre('')
    setCostoFijo('')
    setPrecioVenta('')
    setStockInicial('0')
    setStockMinimo('0')
    setNuevoControlaVenc(false)
    cargar()
  }

  const cuentasIngreso = cuentas.filter((c) => c.tipo === 'ingreso')
  const cuentasGasto = cuentas.filter((c) => c.tipo === 'gasto')
  const cuentasActivo = cuentas.filter((c) => c.tipo === 'activo')
  const cuentasPasivo = cuentas.filter((c) => c.tipo === 'pasivo')
  const configCompleta = empresa?.cuenta_ventas_id && empresa?.cuenta_costo_ventas_id && empresa?.cuenta_inventario_id

  return (
    <main style={{ maxWidth: 1000, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Productos</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>
            Controla todos tus productos desde un solo lugar.
          </p>
        </div>
        <a href="#nuevo-producto">
          <button className="btn-hero">+ Nuevo producto</button>
        </a>
      </div>

      <div className="stat-grid" style={{ margin: '1.25rem 0' }}>
        <div className="stat-card">
          <p className="stat-label">Productos</p>
          <p className="stat-value">{productos.filter((p) => p.activo).length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Por acabarse</p>
          <p className="stat-value" style={{ color: numPocoStock > 0 ? '#F59E0B' : undefined }}>{numPocoStock}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Agotados</p>
          <p className="stat-value" style={{ color: numAgotados > 0 ? '#EF4444' : undefined }}>{numAgotados}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Categorías</p>
          <p className="stat-value">{categorias.length}</p>
        </div>
      </div>

      <details
        open={!configCompleta}
        style={{ margin: '1rem 0', border: '1px solid #E6ECF3', borderRadius: 12, padding: '0.75rem' }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1F3A5F' }}>
          Configuración de cuentas {configCompleta ? '✅' : '⚠️ (falta configurar)'}
        </summary>
        <form onSubmit={guardarConfig} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
          <label>
            Cuenta de ventas
            <br />
            <select value={cuentaVentas} onChange={(e) => setCuentaVentas(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasIngreso.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Costo de ventas
            <br />
            <select value={cuentaCosto} onChange={(e) => setCuentaCosto(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasGasto.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Inventario
            <br />
            <select value={cuentaInventario} onChange={(e) => setCuentaInventario(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasActivo.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Cuentas por cobrar
            <br />
            <select value={cuentaCxc} onChange={(e) => setCuentaCxc(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasActivo.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Cuentas por pagar
            <br />
            <select value={cuentaCxp} onChange={(e) => setCuentaCxp(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {cuentasPasivo.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Rubro
            <br />
            <select value={edRubro} onChange={(e) => setEdRubro(e.target.value)}>
              <option value="zapateria">Zapatería</option>
              <option value="minimarket">Minimarket</option>
              <option value="joyeria">Joyería</option>
              <option value="boutique">Boutique</option>
              <option value="ferreteria">Ferretería</option>
              <option value="farmacia">Farmacia</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingBottom: '0.5rem' }}>
            <input type="checkbox" checked={edUsaVenc} onChange={(e) => setEdUsaVenc(e.target.checked)} />
            Controlar vencimientos
          </label>
          <button type="submit" disabled={guardandoConfig}>Guardar configuración</button>
          <button type="button" onClick={autoconfigurar} disabled={autoconfigurando}>
            Configurar automáticamente
          </button>
        </form>
      </details>

      <details style={{ margin: '1rem 0', border: '1px solid #E6ECF3', borderRadius: 12, padding: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1F3A5F' }}>
          Categorías ({categorias.length})
        </summary>
        <form onSubmit={crearCategoria} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <label>
            Nombre
            <br />
            <input required value={nombreCategoria} onChange={(e) => setNombreCategoria(e.target.value)} placeholder="ej. Aros" />
          </label>
          <label>
            Dentro de (opcional)
            <br />
            <select value={padreCategoria} onChange={(e) => setPadreCategoria(e.target.value)}>
              <option value="">-- Categoría principal --</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{rutaCategoria(c)}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={guardandoCat}>Agregar categoría</button>
        </form>
        {categorias.length > 0 && (
          <ul style={{ marginTop: '0.75rem', color: '#64748B', fontSize: '0.88rem' }}>
            {categorias.map((c) => (
              <li key={c.id}>{rutaCategoria(c)}</li>
            ))}
          </ul>
        )}
      </details>

      <h2 id="nuevo-producto">Nuevo producto</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
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
          Categoría
          <br />
          <select value={nuevaCategoriaId} onChange={(e) => setNuevaCategoriaId(e.target.value)}>
            <option value="">-- Sin categoría --</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{rutaCategoria(c)}</option>
            ))}
          </select>
        </label>
        <label>
          Unidad
          <br />
          <input value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ width: 80 }} />
        </label>
        <label>
          Costo
          <br />
          <input type="number" step="0.01" min="0" value={costoFijo} onChange={(e) => setCostoFijo(e.target.value)} style={{ width: 85 }} />
        </label>
        <label>
          Precio
          <br />
          <input type="number" step="0.01" min="0" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} style={{ width: 85 }} />
        </label>
        <label>
          Stock inicial
          <br />
          <input type="number" step="0.001" min="0" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} style={{ width: 85 }} />
        </label>
        <label>
          Stock mínimo
          <br />
          <input type="number" step="0.001" min="0" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} style={{ width: 85 }} />
        </label>
        {empresa?.usa_vencimiento && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingBottom: '0.5rem' }}>
            <input type="checkbox" checked={nuevoControlaVenc} onChange={(e) => setNuevoControlaVenc(e.target.checked)} />
            Controla vencimiento
          </label>
        )}
        <button type="submit" disabled={guardando}>Agregar</button>
      </form>

      <h2>Catálogo</h2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ flex: 1, minWidth: 240 }}>
          Buscar
          <br />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre, código o SKU..."
            style={{ width: '100%', fontSize: '1rem', padding: '0.7rem 0.9rem' }}
          />
        </label>
        <label>
          Categoría
          <br />
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{rutaCategoria(c)}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={soloStockBajo} onChange={(e) => setSoloStockBajo(e.target.checked)} /> Solo stock bajo
        </label>
        <label>
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} /> Ver inactivos
        </label>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : productos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <BoliMascot pose="hola" size={120} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#1F3A5F', fontSize: '1.05rem' }}>
            Todavía no tienes productos
          </p>
          <p style={{ margin: '0.3rem 0 1rem', color: '#64748B' }}>
            Registra el primero y empieza a vender.
          </p>
          <a href="#nuevo-producto">
            <button className="btn-hero">Crear producto</button>
          </a>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <p style={{ color: '#64748B' }}>Ningún producto coincide con la búsqueda.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}></th>
              <th style={{ padding: '4px 8px' }}>Producto</th>
              <th style={{ padding: '4px 8px' }}>Categoría</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Margen</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Stock</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const m = margenDe(p.costo_fijo, p.precio_venta)
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #E6ECF3', opacity: p.activo ? 1 : 0.5 }}>
                  <td style={{ padding: '4px 8px', width: 48 }}>
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #E6ECF3' }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F7F9FC', border: '1px solid #E6ECF3' }} />
                    )}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <Link to={`/empresas/${empresaId}/inventario/productos/${p.id}`} style={{ fontWeight: 600 }}>
                      {p.nombre}
                    </Link>
                    <div style={{ color: '#A3AFBF', fontSize: '0.78rem' }}>
                      {p.codigo}
                      {p.tiene_variantes && ' · con variantes'}
                    </div>
                  </td>
                  <td style={{ padding: '4px 8px', color: '#64748B', fontSize: '0.85rem' }}>
                    {p.categoria_id ? nombreCategoriaPorId.get(p.categoria_id) : '—'}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(p.costo_fijo).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(p.precio_venta).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: colorMargen(m), fontWeight: 600 }}>
                    {m === null ? '—' : `${m.toFixed(0)}%`}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {p.stock_total.toFixed(2)} {p.unidad_medida}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    {(() => {
                      const agotado = p.stock_total <= 0
                      const bajo = p.tiene_stock_bajo
                      const estilo = agotado
                        ? { background: 'rgba(239, 68, 68, 0.12)', color: '#B91C1C' }
                        : bajo
                        ? { background: 'rgba(245, 158, 11, 0.15)', color: '#8a5a00' }
                        : { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                      return (
                        <span className="chip-estado" style={estilo}>
                          {agotado ? 'Agotado' : bajo ? 'Por acabarse' : 'Disponible'}
                        </span>
                      )
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
