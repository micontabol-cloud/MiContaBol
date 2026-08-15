import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import VisorImagen from '../components/VisorImagen'

export default function ProductoDetalle() {
  const { id: empresaId, productoId } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)
  const [variantes, setVariantes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [kardex, setKardex] = useState([])
  const [lotes, setLotes] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [subiendo, setSubiendo] = useState(false)

  const [edNombre, setEdNombre] = useState('')
  const [edCosto, setEdCosto] = useState('')
  const [edPrecio, setEdPrecio] = useState('')
  const [edCategoria, setEdCategoria] = useState('')
  const [edMinimo, setEdMinimo] = useState('')
  const [edControlaVenc, setEdControlaVenc] = useState(false)
  const [edCodigoBarras, setEdCodigoBarras] = useState('')
  const [edObservaciones, setEdObservaciones] = useState('')
  const [fotoAmpliada, setFotoAmpliada] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [varNombre, setVarNombre] = useState('')
  const [varSku, setVarSku] = useState('')
  const [varCosto, setVarCosto] = useState('')
  const [varPrecio, setVarPrecio] = useState('')
  const [varMinimo, setVarMinimo] = useState('0')
  const [guardandoVar, setGuardandoVar] = useState(false)

  const [ajVarianteId, setAjVarianteId] = useState('')
  const [ajCantidad, setAjCantidad] = useState('')
  const [ajMotivo, setAjMotivo] = useState('')
  const [ajCuenta, setAjCuenta] = useState('')
  const [ajLoteId, setAjLoteId] = useState('')
  const [ajFecha, setAjFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [ajustando, setAjustando] = useState(false)
  const [tieneMovimientos, setTieneMovimientos] = useState(true)
  const [accionPeligro, setAccionPeligro] = useState(null)
  const [motivoEliminar, setMotivoEliminar] = useState('')
  const [confirmarBorrar, setConfirmarBorrar] = useState('')
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [pRes, vRes, cRes, ctaRes, kRes, lRes, eRes] = await Promise.all([
      supabase.from('productos').select('*').eq('id', productoId).single(),
      supabase.from('producto_variantes').select('*').eq('producto_id', productoId).order('orden').order('nombre'),
      supabase.from('categorias_producto').select('*').eq('empresa_id', empresaId).order('nombre'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
      supabase
        .from('vista_kardex')
        .select('*')
        .eq('producto_id', productoId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('vista_lotes')
        .select('*')
        .eq('producto_id', productoId)
        .order('fecha_vencimiento', { ascending: true, nullsFirst: false }),
      supabase.from('empresas').select('rubro, usa_vencimiento').eq('id', empresaId).single(),
    ])

    if (pRes.error) {
      setError(pRes.error.message)
      setCargando(false)
      return
    }

    setProducto(pRes.data)
    setEdNombre(pRes.data.nombre)
    setEdCosto(pRes.data.costo_fijo)
    setEdPrecio(pRes.data.precio_venta)
    setEdCategoria(pRes.data.categoria_id || '')
    setEdMinimo(pRes.data.stock_minimo)
    setEdControlaVenc(!!pRes.data.controla_vencimiento)
    setEdCodigoBarras(pRes.data.codigo_barras || '')
    setEdObservaciones(pRes.data.observaciones || '')
    setVariantes(vRes.data || [])
    setCategorias(cRes.data || [])
    setCuentas(ctaRes.data || [])
    setKardex(kRes.data || [])
    setLotes(lRes.data || [])
    setEmpresa(eRes.data)

    const { data: mov } = await supabase.rpc('producto_tiene_movimientos', { p_producto_id: productoId })
    setTieneMovimientos(mov !== false)

    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId])

  // Enter avanza al siguiente campo en vez de enviar el formulario
  function manejarEnter(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const campos = Array.from(e.currentTarget.querySelectorAll('input, select')).filter(
      (el) => !el.disabled && el.type !== 'checkbox' && el.type !== 'file'
    )
    const i = campos.indexOf(document.activeElement)
    if (i >= 0 && i < campos.length - 1) campos[i + 1].focus()
  }

  async function subirFoto(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setSubiendo(true)

    const ext = archivo.name.split('.').pop()
    const ruta = `${empresaId}/${productoId}-${Date.now()}.${ext}`

    const { error: errSubida } = await supabase.storage.from('productos').upload(ruta, archivo, { upsert: true })

    if (errSubida) {
      setSubiendo(false)
      setError(`No se pudo subir la foto: ${errSubida.message}`)
      return
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta)
    const { error: errUpdate } = await supabase
      .from('productos')
      .update({ imagen_url: data.publicUrl })
      .eq('id', productoId)

    setSubiendo(false)
    if (errUpdate) return setError(errUpdate.message)
    cargar()
  }

  async function quitarFoto() {
    setError(null)
    const { error } = await supabase.from('productos').update({ imagen_url: null }).eq('id', productoId)
    if (error) return setError(error.message)
    cargar()
  }

  async function guardarProducto(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: edNombre,
        costo_fijo: parseFloat(edCosto) || 0,
        precio_venta: parseFloat(edPrecio) || 0,
        categoria_id: edCategoria || null,
        stock_minimo: parseFloat(edMinimo) || 0,
        controla_vencimiento: edControlaVenc,
        codigo_barras: edCodigoBarras.trim() || null,
        observaciones: edObservaciones.trim() || null,
      })
      .eq('id', productoId)
    setGuardando(false)
    if (error) return setError(error.message)
    setAviso('Cambios guardados.')
    cargar()
  }

  async function agregarVariante(e) {
    e.preventDefault()
    setError(null)
    setGuardandoVar(true)

    const { error: errVar } = await supabase.from('producto_variantes').insert({
      producto_id: productoId,
      nombre: varNombre,
      sku: varSku || null,
      costo_fijo: varCosto === '' ? null : parseFloat(varCosto),
      precio_venta: varPrecio === '' ? null : parseFloat(varPrecio),
      stock_minimo: parseFloat(varMinimo) || 0,
    })

    if (errVar) {
      setGuardandoVar(false)
      return setError(errVar.message)
    }

    // Al crear la primera variante, el stock pasa a vivir en las
    // variantes. Movemos el stock que estaba en el producto para
    // que no quede contado dos veces.
    if (!producto.tiene_variantes) {
      await supabase.from('productos').update({ tiene_variantes: true, stock_actual: 0 }).eq('id', productoId)
      if (Number(producto.stock_actual) > 0) {
        setAviso(
          `Este producto ahora usa variantes. El stock que tenía (${Number(producto.stock_actual).toFixed(
            2
          )}) se movió a cero: repártelo entre las variantes con un ajuste de inventario.`
        )
      }
    }

    setGuardandoVar(false)
    setVarNombre('')
    setVarSku('')
    setVarCosto('')
    setVarPrecio('')
    cargar()
  }

  async function registrarAjuste(e) {
    e.preventDefault()
    setError(null)
    setAjustando(true)

    const { error } = await supabase.rpc('ajustar_inventario', {
      p_empresa_id: empresaId,
      p_producto_id: productoId,
      p_variante_id: ajVarianteId || null,
      p_fecha: ajFecha,
      p_cantidad: parseFloat(ajCantidad),
      p_motivo: ajMotivo || null,
      p_cuenta_contrapartida_id: ajCuenta,
      p_lote_id: ajLoteId || null,
    })

    setAjustando(false)
    if (error) return setError(error.message)
    setAjCantidad('')
    setAjMotivo('')
    setAviso('Ajuste registrado.')
    cargar()
  }

  async function alternarActivo() {
    setError(null)
    const { error } = await supabase.from('productos').update({ activo: !producto.activo }).eq('id', productoId)
    if (error) return setError(error.message)
    cargar()
  }

  async function eliminar() {
    setError(null)
    setProcesando(true)
    const { data, error } = await supabase.rpc('eliminar_producto', {
      p_producto_id: productoId,
      p_motivo: motivoEliminar || null,
    })
    setProcesando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/inventario/productos`, {
      state: { aviso: `"${data.nombre}" se envió a la papelera. Puedes restaurarlo desde ahí.` },
    })
  }

  async function borrarDefinitivo() {
    setError(null)
    setProcesando(true)
    const { error } = await supabase.rpc('borrar_producto_definitivo', {
      p_producto_id: productoId,
      p_confirmacion: confirmarBorrar.trim().toUpperCase(),
    })
    setProcesando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/inventario/productos`)
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!producto) {
    return (
      <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error || 'Producto no encontrado.'}</p>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>&larr; Volver a productos</Link>
      </main>
    )
  }

  const stockTotal = producto.tiene_variantes
    ? variantes.reduce((s, v) => s + Number(v.stock_actual), 0)
    : Number(producto.stock_actual)

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>&larr; Productos</Link>
      </p>
      <h1>{producto.nombre}</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Código {producto.codigo} · Stock total: {stockTotal.toFixed(2)} {producto.unidad_medida}
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#3B82F6' }}>{aviso}</p>}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Foto</h2>
          {producto.imagen_url ? (
            <button
              type="button"
              onClick={() => setFotoAmpliada(true)}
              title="Ver más grande"
              style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in' }}
            >
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                style={{
                  width: 180,
                  height: 180,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '1px solid #E6ECF3',
                  display: 'block',
                }}
              />
            </button>
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 12,
                background: '#F7F9FC',
                border: '1px dashed #E6ECF3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A3AFBF',
                fontSize: '0.85rem',
              }}
            >
              Sin foto
            </div>
          )}
          <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem' }}>
              <input type="file" accept="image/*" onChange={subirFoto} disabled={subiendo} style={{ fontSize: '0.75rem' }} />
            </label>
            {subiendo && <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Subiendo...</span>}
            {producto.imagen_url && (
              <button type="button" onClick={quitarFoto} style={{ alignSelf: 'flex-start' }}>
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <form onSubmit={guardarProducto} style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ marginTop: 0 }}>Datos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label>
              Nombre
              <br />
              <input required value={edNombre} onChange={(e) => setEdNombre(e.target.value)} style={{ width: '100%' }} />
            </label>
            <label>
              Observación
              <br />
              <textarea
                value={edObservaciones}
                onChange={(e) => setEdObservaciones(e.target.value)}
                placeholder="Talla, material, medidas, notas internas..."
                rows={2}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', padding: '0.6rem 0.75rem' }}
              />
            </label>
            <label>
              Código de barras
              <br />
              <input
                value={edCodigoBarras}
                onChange={(e) => setEdCodigoBarras(e.target.value)}
                placeholder="escanea o escribe"
                style={{ width: '100%' }}
              />
            </label>
            <label>
              Categoría
              <br />
              <select value={edCategoria} onChange={(e) => setEdCategoria(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Sin categoría --</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label>
                Costo
                <br />
                <input type="number" step="0.01" min="0" value={edCosto} onChange={(e) => setEdCosto(e.target.value)} style={{ width: 95 }} />
              </label>
              <label>
                Precio
                <br />
                <input type="number" step="0.01" min="0" value={edPrecio} onChange={(e) => setEdPrecio(e.target.value)} style={{ width: 95 }} />
              </label>
              <label>
                Stock mínimo
                <br />
                <input type="number" step="0.001" min="0" value={edMinimo} onChange={(e) => setEdMinimo(e.target.value)} style={{ width: 95 }} />
              </label>
            </div>
            {empresa?.usa_vencimiento && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={edControlaVenc}
                  onChange={(e) => setEdControlaVenc(e.target.checked)}
                />
                Controla vencimiento (pide lote y fecha al comprar)
              </label>
            )}
            <button type="submit" disabled={guardando} style={{ alignSelf: 'flex-start' }}>
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      <h2>Variantes</h2>
      <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '-0.4rem' }}>
        Usa variantes cuando el mismo producto viene en tallas, colores o medidas — cada una lleva su propio stock.
        Deja costo y precio vacíos para que hereden los del producto.
      </p>

      {variantes.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Variante</th>
              <th style={{ padding: '4px 8px' }}>SKU</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Precio</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Stock</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {variantes.map((v) => {
              const bajo = Number(v.stock_minimo) > 0 && Number(v.stock_actual) <= Number(v.stock_minimo)
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>{v.nombre}</td>
                  <td style={{ padding: '4px 8px', color: '#64748B' }}>{v.sku || '—'}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {v.costo_fijo === null ? `(${Number(producto.costo_fijo).toFixed(2)})` : Number(v.costo_fijo).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {v.precio_venta === null ? `(${Number(producto.precio_venta).toFixed(2)})` : Number(v.precio_venta).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: bajo ? '#EF4444' : undefined, fontWeight: bajo ? 600 : undefined }}>
                    {Number(v.stock_actual).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#64748B' }}>{Number(v.stock_minimo).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <form
        onSubmit={agregarVariante}
        onKeyDown={manejarEnter}
        style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
      >
        <label>
          Nombre
          <br />
          <input required value={varNombre} onChange={(e) => setVarNombre(e.target.value)} placeholder="ej. Talla 38" style={{ width: 130 }} />
        </label>
        <label>
          SKU
          <br />
          <input value={varSku} onChange={(e) => setVarSku(e.target.value)} style={{ width: 110 }} />
        </label>
        <label>
          Costo
          <br />
          <input type="number" step="0.01" min="0" value={varCosto} onChange={(e) => setVarCosto(e.target.value)} placeholder="hereda" style={{ width: 90 }} />
        </label>
        <label>
          Precio
          <br />
          <input type="number" step="0.01" min="0" value={varPrecio} onChange={(e) => setVarPrecio(e.target.value)} placeholder="hereda" style={{ width: 90 }} />
        </label>
        <label>
          Stock mínimo
          <br />
          <input type="number" step="0.001" min="0" value={varMinimo} onChange={(e) => setVarMinimo(e.target.value)} style={{ width: 90 }} />
        </label>
        <button type="submit" disabled={guardandoVar}>Agregar variante</button>
      </form>

      {producto.controla_vencimiento && (
        <>
          <h2>Lotes en stock</h2>
          {lotes.length === 0 ? (
            <p style={{ color: '#64748B' }}>
              Todavía no hay lotes. Se crean solos cuando registras una compra de este producto.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                  <th style={{ padding: '4px 8px' }}>Lote</th>
                  <th style={{ padding: '4px 8px' }}>Variante</th>
                  <th style={{ padding: '4px 8px' }}>Vence</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Días</th>
                  <th style={{ padding: '4px 8px', textAlign: 'right' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const dias = l.dias_para_vencer
                  const color = dias === null ? undefined : dias < 0 ? '#EF4444' : dias <= 30 ? '#F59E0B' : '#22C55E'
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                      <td style={{ padding: '4px 8px' }}>{l.codigo_lote || '—'}</td>
                      <td style={{ padding: '4px 8px', color: '#64748B' }}>{l.variante_nombre || '—'}</td>
                      <td style={{ padding: '4px 8px' }}>{l.fecha_vencimiento || '—'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color, fontWeight: 600 }}>
                        {dias === null ? '—' : dias < 0 ? `Vencido hace ${Math.abs(dias)}` : dias}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(l.stock_actual).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
            Las ventas descuentan automáticamente el lote que vence primero.
          </p>
        </>
      )}

      <h2>Ajuste de inventario</h2>
      <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '-0.4rem' }}>
        Para mermas, roturas, robos o correcciones tras un conteo físico. Usa cantidad negativa para dar de baja
        (ej. <code>-2</code>) y positiva si encontraste stock no registrado.
      </p>
      <form onSubmit={registrarAjuste} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {producto.tiene_variantes && (
          <label>
            Variante
            <br />
            <select required value={ajVarianteId} onChange={(e) => setAjVarianteId(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {variantes.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </label>
        )}
        {producto.controla_vencimiento && lotes.length > 0 && (
          <label>
            Lote
            <br />
            <select value={ajLoteId} onChange={(e) => setAjLoteId(e.target.value)}>
              <option value="">-- Selecciona --</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.codigo_lote || 'sin código'} · vence {l.fecha_vencimiento} · {Number(l.stock_actual).toFixed(2)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Fecha
          <br />
          <input type="date" required value={ajFecha} onChange={(e) => setAjFecha(e.target.value)} />
        </label>
        <label>
          Cantidad
          <br />
          <input type="number" step="0.001" required value={ajCantidad} onChange={(e) => setAjCantidad(e.target.value)} placeholder="-2" style={{ width: 90 }} />
        </label>
        <label>
          Motivo
          <br />
          <input value={ajMotivo} onChange={(e) => setAjMotivo(e.target.value)} placeholder="ej. rotura" style={{ width: 150 }} />
        </label>
        <label>
          Cuenta contrapartida
          <br />
          <select required value={ajCuenta} onChange={(e) => setAjCuenta(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={ajustando}>Registrar ajuste</button>
      </form>

      <h2>Kardex</h2>
      {kardex.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no hay movimientos de este producto.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px' }}>Variante</th>
              <th style={{ padding: '4px 8px' }}>Documento</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Entrada</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Salida</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Costo unit.</th>
            </tr>
          </thead>
          <tbody>
            {kardex.map((m) => {
              const cant = Number(m.cantidad)
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                  <td style={{ padding: '4px 8px' }}>{m.fecha}</td>
                  <td style={{ padding: '4px 8px', textTransform: 'capitalize' }}>{m.tipo}</td>
                  <td style={{ padding: '4px 8px', color: '#64748B' }}>{m.variante_nombre || '—'}</td>
                  <td style={{ padding: '4px 8px', color: '#64748B' }}>
                    {m.comprobante_numero || '—'}
                    {m.cliente_proveedor ? ` · ${m.cliente_proveedor}` : ''}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#22C55E' }}>
                    {cant > 0 ? cant.toFixed(2) : ''}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#EF4444' }}>
                    {cant < 0 ? Math.abs(cant).toFixed(2) : ''}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(m.costo_unitario).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Acciones sobre el producto */}
      <section style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E6ECF3' }}>
        <h2>Qué hacer con este producto</h2>

        <div
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 14,
            padding: '1rem 1.15rem',
            marginBottom: '0.75rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#1F3A5F' }}>
            {producto.activo ? 'Dejar de venderlo' : 'Volver a venderlo'}
          </p>
          <p style={{ margin: '0.2rem 0 0.7rem', color: '#64748B', fontSize: '0.9rem' }}>
            {producto.activo
              ? 'Desaparece de las ventas y del catálogo, pero conserva todo su historial. Es lo indicado si simplemente dejaste de venderlo.'
              : 'Vuelve a aparecer en ventas y catálogos.'}
          </p>
          <button type="button" onClick={alternarActivo}>
            {producto.activo ? 'Desactivar' : 'Reactivar'}
          </button>
        </div>

        <div
          style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 14,
            padding: '1rem 1.15rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#B91C1C' }}>Eliminar</p>
          <p style={{ margin: '0.2rem 0 0.7rem', color: '#64748B', fontSize: '0.9rem' }}>
            Va a la papelera: desaparece de todos lados pero se puede restaurar.
            {Number(producto.stock_actual) > 0 && (
              <>
                {' '}
                <strong style={{ color: '#B91C1C' }}>
                  Ojo: todavía tiene {Number(producto.stock_actual).toFixed(0)} en stock.
                </strong>
              </>
            )}
          </p>

          {accionPeligro !== 'eliminar' ? (
            <button
              type="button"
              onClick={() => setAccionPeligro('eliminar')}
              style={{ color: '#EF4444', borderColor: '#EF4444' }}
            >
              Enviar a la papelera
            </button>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem' }}>
                ¿Por qué lo eliminas? (opcional)
                <br />
                <input
                  value={motivoEliminar}
                  onChange={(e) => setMotivoEliminar(e.target.value)}
                  placeholder="ej. Cargado por error"
                  style={{ width: '100%', maxWidth: 380 }}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={procesando}
                  style={{ background: '#EF4444', borderColor: '#EF4444', color: '#FFFFFF' }}
                >
                  Confirmar
                </button>
                <button type="button" onClick={() => setAccionPeligro(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Borrado definitivo: solo si nunca se movió */}
          {!tieneMovimientos && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#64748B' }}>
                Este producto nunca se vendió ni se compró, así que puedes borrarlo del todo.
              </p>

              {accionPeligro !== 'borrar' ? (
                <button
                  type="button"
                  onClick={() => setAccionPeligro('borrar')}
                  style={{ fontSize: '0.85rem', color: '#B91C1C', borderColor: '#B91C1C' }}
                >
                  Borrar definitivamente
                </button>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.6rem' }}>
                    Escribe <strong>BORRAR</strong> para confirmar. No se puede deshacer.
                    <br />
                    <input
                      value={confirmarBorrar}
                      onChange={(e) => setConfirmarBorrar(e.target.value)}
                      placeholder="BORRAR"
                      style={{ width: 180 }}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={borrarDefinitivo}
                      disabled={procesando || confirmarBorrar.trim().toUpperCase() !== 'BORRAR'}
                      style={
                        confirmarBorrar.trim().toUpperCase() === 'BORRAR'
                          ? { background: '#B91C1C', borderColor: '#B91C1C', color: '#FFFFFF' }
                          : undefined
                      }
                    >
                      Borrar para siempre
                    </button>
                    <button type="button" onClick={() => setAccionPeligro(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tieneMovimientos && (
            <p style={{ margin: '0.9rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
              Este producto tiene ventas o compras registradas, así que no se puede borrar del todo: sus movimientos
              quedarían sin referencia y el kardex no cuadraría.
            </p>
          )}
        </div>
      </section>

      {fotoAmpliada && (
        <VisorImagen url={producto.imagen_url} alt={producto.nombre} onCerrar={() => setFotoAmpliada(false)} />
      )}
    </main>
  )
}
