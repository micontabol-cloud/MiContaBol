import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const TIPOS = ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'orden']
const NATURALEZAS = ['deudora', 'acreedora']

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
  const [guardando, setGuardando] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [edNombre, setEdNombre] = useState('')
  const [edTipo, setEdTipo] = useState('')
  const [edNaturaleza, setEdNaturaleza] = useState('')

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
      permite_movimiento: true,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    setCodigo('')
    setNombre('')
    cargarCuentas()
  }

  function iniciarEdicion(c) {
    setEditandoId(c.id)
    setEdNombre(c.nombre)
    setEdTipo(c.tipo)
    setEdNaturaleza(c.naturaleza)
  }

  function cancelarEdicion() {
    setEditandoId(null)
  }

  async function guardarEdicion(id) {
    setError(null)
    const { error } = await supabase
      .from('plan_cuentas')
      .update({ nombre: edNombre, tipo: edTipo, naturaleza: edNaturaleza })
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

  const cuentasVisibles = cuentas.filter((c) => mostrarInactivas || c.activo)

  return (
    <main style={{ maxWidth: 820, margin: '3rem auto', fontFamily: 'sans-serif' }}>
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
          <input required value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ width: 100 }} />
        </label>
        <label>
          Nombre
          <br />
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: 220 }} />
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
        <button type="submit" disabled={guardando}>
          Agregar cuenta
        </button>
      </form>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={mostrarInactivas}
          onChange={(e) => setMostrarInactivas(e.target.checked)}
        />{' '}
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
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3', opacity: c.activo ? 1 : 0.5 }}>
                  <td style={{ padding: '4px 8px' }}>{c.codigo}</td>
                  <td style={{ padding: '4px 8px' }}>
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
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}
