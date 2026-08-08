import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import EscanerCodigo from '../components/EscanerCodigo'
import BoliMascot from '../components/BoliMascot'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function ConteoDetalle() {
  const { id: empresaId, conteoId } = useParams()
  const navigate = useNavigate()

  const [conteo, setConteo] = useState(null)
  const [items, setItems] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [resaltado, setResaltado] = useState(null)
  const [cuentaMerma, setCuentaMerma] = useState('')
  const [revisando, setRevisando] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [cRes, iRes, ctaRes] = await Promise.all([
      supabase.from('conteos_fisicos').select('*').eq('id', conteoId).single(),
      supabase.from('conteo_items').select('*').eq('conteo_id', conteoId).order('nombre_completo'),
      supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo'),
    ])

    if (cRes.error) setError(cRes.error.message)
    setConteo(cRes.data)
    setItems(iRes.data || [])
    setCuentas(ctaRes.data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conteoId])

  async function guardarConteo(itemId, valor) {
    const numero = valor === '' ? null : parseFloat(valor)
    if (numero !== null && (!Number.isFinite(numero) || numero < 0)) return

    // Actualización optimista: contar es una tarea repetitiva y
    // esperar al servidor en cada número la haría insoportable.
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, stock_contado: numero } : i)))

    const { error } = await supabase
      .from('conteo_items')
      .update({ stock_contado: numero, contado_at: numero === null ? null : new Date().toISOString() })
      .eq('id', itemId)

    if (error) setError(error.message)
  }

  function buscarPorCodigo(codigo) {
    const limpio = codigo.trim().toLowerCase()
    const encontrado = items.find(
      (i) => (i.codigo_barras || '').toLowerCase() === limpio || (i.codigo || '').toLowerCase() === limpio
    )

    if (!encontrado) {
      setAviso(`No encontré ningún producto con el código "${codigo}" en este conteo.`)
      return
    }

    setAviso(null)
    setBusqueda(encontrado.nombre_completo)
    setResaltado(encontrado.id)
    setSoloPendientes(false)

    const fila = document.getElementById(`item-${encontrado.id}`)
    if (fila) fila.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = document.getElementById(`input-${encontrado.id}`)
    if (input) setTimeout(() => input.focus(), 300)
  }

  const contados = items.filter((i) => i.stock_contado !== null)
  const conDiferencia = contados.filter((i) => Number(i.stock_contado) !== Number(i.stock_sistema))

  const totales = useMemo(() => {
    let faltantes = 0
    let sobrantes = 0
    conDiferencia.forEach((i) => {
      const dif = Number(i.stock_contado) - Number(i.stock_sistema)
      const valor = Math.abs(dif) * Number(i.costo_unitario)
      if (dif < 0) faltantes += valor
      else sobrantes += valor
    })
    return { faltantes, sobrantes, neto: sobrantes - faltantes }
  }, [conDiferencia])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter((i) => {
      if (soloPendientes && i.stock_contado !== null) return false
      if (!q) return true
      return (
        i.nombre_completo.toLowerCase().includes(q) ||
        (i.codigo || '').toLowerCase().includes(q) ||
        (i.codigo_barras || '').toLowerCase().includes(q)
      )
    })
  }, [items, busqueda, soloPendientes])

  async function cerrar() {
    setError(null)
    setCerrando(true)

    const { error } = await supabase.rpc('cerrar_conteo', {
      p_conteo_id: conteoId,
      p_cuenta_contrapartida_id: cuentaMerma,
    })

    setCerrando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/inventario/conteos`)
  }

  async function cancelar() {
    if (!window.confirm('¿Cancelar este conteo? Se perderá lo que llevas contado.')) return
    await supabase.from('conteos_fisicos').update({ estado: 'cancelado' }).eq('id', conteoId)
    navigate(`/empresas/${empresaId}/inventario/conteos`)
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!conteo) {
    return (
      <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error || 'Conteo no encontrado.'}</p>
      </main>
    )
  }

  const cerrado = conteo.estado !== 'abierto'

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/inventario/conteos`}>&larr; Conteos</Link>
      </p>

      <h1>{conteo.nombre || 'Conteo físico'}</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        {conteo.fecha} ·{' '}
        {cerrado ? (conteo.estado === 'cerrado' ? 'Cerrado' : 'Cancelado') : 'En curso'}
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#F59E0B' }}>{aviso}</p>}

      <div className="stat-grid" style={{ margin: '1.25rem 0' }}>
        <div className="stat-card">
          <p className="stat-label">Contados</p>
          <p className="stat-value">
            {contados.length}
            <span style={{ fontSize: '1rem', color: '#A3AFBF' }}> / {items.length}</span>
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Con diferencia</p>
          <p className="stat-value" style={{ color: conDiferencia.length > 0 ? '#F59E0B' : undefined }}>
            {conDiferencia.length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Faltante</p>
          <p className="stat-value" style={{ color: totales.faltantes > 0 ? '#EF4444' : undefined }}>
            {fmt(totales.faltantes)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Sobrante</p>
          <p className="stat-value" style={{ color: totales.sobrantes > 0 ? '#22C55E' : undefined }}>
            {fmt(totales.sobrantes)}
          </p>
        </div>
      </div>

      {!cerrado && (
        <>
          <h2>Escanea o busca</h2>
          <EscanerCodigo onCodigo={buscarPorCodigo} placeholder="Escanea el código o escribe para buscar..." />

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', margin: '1rem 0' }}>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Filtrar por nombre..."
              style={{ flex: 1, minWidth: 200 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
              Solo los que faltan contar
            </label>
          </div>
        </>
      )}

      {visibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <BoliMascot pose="exito" size={110} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600, color: '#1F3A5F', margin: 0 }}>
            {soloPendientes && contados.length === items.length
              ? '¡Ya contaste todo!'
              : 'Nada coincide con la búsqueda.'}
          </p>
          {soloPendientes && contados.length === items.length && (
            <p style={{ color: '#64748B' }}>Revisa las diferencias abajo y cierra el conteo.</p>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
                <th style={{ padding: '4px 8px' }}>Producto</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Sistema</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Contado</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((i) => {
                const contado = i.stock_contado
                const dif = contado === null ? null : Number(contado) - Number(i.stock_sistema)
                return (
                  <tr
                    key={i.id}
                    id={`item-${i.id}`}
                    style={{
                      borderBottom: '1px solid #E6ECF3',
                      background: resaltado === i.id ? 'rgba(242, 85, 90, 0.06)' : undefined,
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      {i.nombre_completo}
                      <div style={{ color: '#A3AFBF', fontSize: '0.78rem' }}>
                        {i.codigo}
                        {i.codigo_barras && ` · ${i.codigo_barras}`}
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748B' }}>
                      {Number(i.stock_sistema).toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <input
                        id={`input-${i.id}`}
                        type="number"
                        step="0.001"
                        min="0"
                        inputMode="decimal"
                        disabled={cerrado}
                        value={contado === null ? '' : contado}
                        onChange={(e) => guardarConteo(i.id, e.target.value)}
                        placeholder="—"
                        style={{ width: 90, textAlign: 'right', fontSize: '1rem' }}
                      />
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: dif === null ? '#A3AFBF' : dif === 0 ? '#22C55E' : dif < 0 ? '#EF4444' : '#3B82F6',
                      }}
                    >
                      {dif === null ? '—' : dif === 0 ? '✓' : dif > 0 ? `+${dif.toFixed(2)}` : dif.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!cerrado && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Cerrar el conteo</h2>
          <p style={{ color: '#64748B', fontSize: '0.92rem' }}>
            Al cerrar se ajusta el stock según lo que contaste y se registra el faltante como pérdida. Los productos
            que dejaste sin contar no se tocan.
          </p>

          {!revisando ? (
            <button type="button" onClick={() => setRevisando(true)} disabled={contados.length === 0}>
              Revisar diferencias y cerrar
            </button>
          ) : (
            <div
              style={{
                padding: '1.15rem',
                background: '#F7F9FC',
                border: '1px solid #E6ECF3',
                borderRadius: 16,
              }}
            >
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#1F3A5F' }}>
                Vas a ajustar {conDiferencia.length}{' '}
                {conDiferencia.length === 1 ? 'producto' : 'productos'}:
              </p>

              {conDiferencia.length === 0 ? (
                <p style={{ color: '#22C55E', fontWeight: 600 }}>
                  ✓ Todo cuadra perfecto. No hay nada que ajustar.
                </p>
              ) : (
                <ul className="panel-lista" style={{ marginBottom: '1rem' }}>
                  {conDiferencia.slice(0, 10).map((i) => {
                    const dif = Number(i.stock_contado) - Number(i.stock_sistema)
                    return (
                      <li key={i.id}>
                        <span>{i.nombre_completo}</span>
                        <span style={{ color: dif < 0 ? '#EF4444' : '#3B82F6', fontWeight: 600 }}>
                          {dif > 0 ? `sobran ${dif.toFixed(2)}` : `faltan ${Math.abs(dif).toFixed(2)}`}
                        </span>
                      </li>
                    )
                  })}
                  {conDiferencia.length > 10 && (
                    <li style={{ color: '#A3AFBF' }}>y {conDiferencia.length - 10} más...</li>
                  )}
                </ul>
              )}

              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                ¿En qué cuenta registramos la diferencia?
                <br />
                <select value={cuentaMerma} onChange={(e) => setCuentaMerma(e.target.value)}>
                  <option value="">-- Selecciona --</option>
                  {cuentas
                    .filter((c) => c.tipo === 'gasto')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.25rem' }}>
                  Normalmente "Mermas y Pérdidas de Inventario".
                </span>
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-hero" onClick={cerrar} disabled={cerrando || !cuentaMerma}>
                  Aplicar y cerrar conteo
                </button>
                <button type="button" onClick={() => setRevisando(false)}>
                  Volver a contar
                </button>
              </div>
            </div>
          )}

          <p style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={cancelar} style={{ color: '#EF4444', borderColor: '#EF4444' }}>
              Cancelar este conteo
            </button>
          </p>
        </div>
      )}
    </main>
  )
}
