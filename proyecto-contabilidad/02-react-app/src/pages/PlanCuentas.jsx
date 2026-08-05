import { Fragment, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const TIPOS = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'orden']
const NATURALEZAS = ['deudora', 'acreedora']

function calcularProfundidad(cuenta, porId, cache) {
  if (cache.has(cuenta.id)) return cache.get(cuenta.id)
  let profundidad = 0
  if (cuenta.cuenta_padre_id && porId.has(cuenta.cuenta_padre_id)) {
    profundidad = 1 + calcularProfundidad(porId.get(cuenta.cuenta_padre_id), porId, cache)
  }
  cache.set(cuenta.id, profundidad)
  return profundidad
}

export default function PlanCuentas() {
  const { id: empresaId } = useParams()
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarInactivas, setMostrarInactivas] = useState(false)

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('activo')
  const [naturaleza, setNaturaleza] = useState('deudora')
  const [cuentaPadreId, setCuentaPadreId] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [edNombre, setEdNombre] = useState('')
  const [edTipo, setEdTipo] = useState('')
  const [edNaturaleza, setEdNaturaleza] = useState('')
  const [edPadreId, setEdPadreId] = useState('')
  const [edPermiteMovimiento, setEdPermiteMovimiento] = useState(true)

  const [subAbiertaId, setSubAbiertaId] = useState(null)
  const [subCodigo, setSubCodigo] = useState('')
  const [subNombre, setSubNombre] = useState('')
  const [guardandoSub, setGuardandoSub] = useState(false)

  async function cargarCuentas() {
    setCargando(true)
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('codigo')

    if (error) {
      setError(error.message)
    } else {
      setCuentas(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarCuentas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('plan_cuentas').insert({
      empresa_id: empresaId,
      codigo,
      nombre,
      tipo,
      naturaleza,
      cuenta_padre_id: cuentaPadreId || null,
      permite_movimiento: true,
    })

    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }

    setCodigo('')
    setNombre('')
    setCuentaPadreId('')
    cargarCuentas()
  }

  function iniciarEdicion(c) {
    setEditandoId(c.id)
    setEdNombre(c.nombre)
    setEdTipo(c.tipo)
    setEdNaturaleza(c.naturaleza)
    setEdPadreId(c.cuenta_padre_id || '')
    setEdPermiteMovimiento(c.permite_movimiento)
  }

  function cancelarEdicion() {
    setEditandoId(null)
  }

  async function guardarEdicion(id) {
    setError(null)
    const { error } = await supabase
      .from('plan_cuentas')
      .update({
        nombre: edNombre,
        tipo: edTipo,
        naturaleza: edNaturaleza,
        cuenta_padre_id: edPadreId || null,
        permite_movimiento: edPermiteMovimiento,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    setEditandoId(null)
    cargarCuentas()
  }

  async function alternarActivo(c) {
    setError(null)
    const { error } = await supabase.from('plan_cuentas').update({ activo: !c.activo }).eq('id', c.id)

    if (error) {
      setError(error.message)
      return
    }

    cargarCuentas()
  }

  function abrirSubcuenta(padre) {
    const hijos = cuentas.filter((c) => c.cuenta_padre_id === padre.id)
    const siguiente = String(hijos.length + 1).padStart(2, '0')
    setSubAbiertaId(padre.id)
    setSubCodigo(`${padre.codigo}.${siguiente}`)
    setSubNombre('')
  }

  async function guardarSubcuenta(e, padre) {
    e.preventDefault()
    setError(null)
    setGuardandoSub(true)

    const { error } = await supabase.from('plan_cuentas').insert({
      empresa_id: empresaId,
      codigo: subCodigo,
      nombre: subNombre,
      tipo: padre.tipo,
      naturaleza: padre.naturaleza,
      cuenta_padre_id: padre.id,
      permite_movimiento: true,
    })

    setGuardandoSub(false)
    if (error) {
      setError(error.message)
      return
    }

    setSubAbiertaId(null)
    cargarCuentas()
  }

  const cuentasVisibles = cuentas.filter((c) => mostrarInactivas || c.activo)
  const porId = new Map(cuentas.map((c) => [c.id, c]))
  const cacheProfundidad = new Map()

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Plan de cuentas</h1>

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
          Tipo
          <br />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Naturaleza
          <br />
          <select value={naturaleza} onChange={(e) => setNaturaleza(e.target.value)}>
            {NATURALEZAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cuenta padre (opcional)
          <br />
          <select value={cuentaPadreId} onChange={(e) => setCuentaPadreId(e.target.value)}>
            <option value="">-- Ninguna (cuenta raíz) --</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={guardando}>
          Agregar cuenta
        </button>
      </form>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input type="checkbox" checked={mostrarInactivas} onChange={(e) => setMostrarInactivas(e.target.checked)} />{' '}
        Mostrar cuentas desactivadas
      </label>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : cuentasVisibles.length === 0 ? (
        <p>No hay cuentas para mostrar.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Código</th>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px' }}>Naturaleza</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cuentasVisibles.map((c) => {
              const editando = editandoId === c.id
              const profundidad = calcularProfundidad(c, porId, cacheProfundidad)
              return (
                <Fragment key={c.id}>
                  <tr style={{ borderBottom: '1px solid #E6ECF3', opacity: c.activo ? 1 : 0.5 }}>
                    <td style={{ padding: '4px 8px' }}>{c.codigo}</td>
                    <td style={{ padding: '4px 8px', paddingLeft: `${8 + profundidad * 20}px` }}>
                      {editando ? (
                        <input value={edNombre} onChange={(e) => setEdNombre(e.target.value)} style={{ width: 200 }} />
                      ) : (
                        c.nombre
                      )}
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      {editando ? (
                        <select value={edTipo} onChange={(e) => setEdTipo(e.target.value)}>
                          {TIPOS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.tipo
                      )}
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      {editando ? (
                        <select value={edNaturaleza} onChange={(e) => setEdNaturaleza(e.target.value)}>
                          {NATURALEZAS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.naturaleza
                      )}
                    </td>
                    <td style={{ padding: '4px 8px' }}>{c.activo ? 'Activa' : 'Desactivada'}</td>
                    <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                      {editando ? (
                        <>
                          <button type="button" onClick={() => guardarEdicion(c.id)}>
                            Guardar
                          </button>{' '}
                          <button type="button" onClick={cancelarEdicion}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => abrirSubcuenta(c)}>
                            + Subcuenta
                          </button>{' '}
                          <button type="button" onClick={() => iniciarEdicion(c)}>
                            Editar
                          </button>{' '}
                          <button type="button" onClick={() => alternarActivo(c)}>
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {editando && (
                    <tr>
                      <td colSpan={6} style={{ padding: '8px', background: '#F7F9FC' }}>
                        <label style={{ marginRight: '1rem' }}>
                          Cuenta padre
                          <br />
                          <select value={edPadreId} onChange={(e) => setEdPadreId(e.target.value)}>
                            <option value="">-- Ninguna (cuenta raíz) --</option>
                            {cuentas
                              .filter((o) => o.id !== c.id)
                              .map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.codigo} — {o.nombre}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={edPermiteMovimiento}
                            onChange={(e) => setEdPermiteMovimiento(e.target.checked)}
                          />{' '}
                          Permite movimientos (desmarca si esta cuenta pasa a ser solo un encabezado)
                        </label>
                      </td>
                    </tr>
                  )}

                  {subAbiertaId === c.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '8px', background: '#F7F9FC' }}>
                        <form
                          onSubmit={(e) => guardarSubcuenta(e, c)}
                          style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
                        >
                          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                            Nueva subcuenta de <strong>{c.nombre}</strong> (hereda tipo "{c.tipo}" y naturaleza "
                            {c.naturaleza}")
                          </span>
                          <label>
                            Código
                            <br />
                            <input required value={subCodigo} onChange={(e) => setSubCodigo(e.target.value)} style={{ width: 110 }} />
                          </label>
                          <label>
                            Nombre
                            <br />
                            <input
                              required
                              placeholder="ej. Banco Nacional MN 342432"
                              value={subNombre}
                              onChange={(e) => setSubNombre(e.target.value)}
                              style={{ width: 240 }}
                            />
                          </label>
                          <button type="submit" disabled={guardandoSub}>
                            Guardar
                          </button>
                          <button type="button" onClick={() => setSubAbiertaId(null)}>
                            Cancelar
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
