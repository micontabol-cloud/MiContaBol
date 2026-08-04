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

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('activo')
  const [naturaleza, setNaturaleza] = useState('deudora')
  const [guardando, setGuardando] = useState(false)

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

  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', fontFamily: 'sans-serif' }}>
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

      {error && <p style={{ color: '#a33' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : cuentas.length === 0 ? (
        <p>Todavía no hay cuentas. Agrega la primera arriba.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '4px 8px' }}>Código</th>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px' }}>Naturaleza</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>{c.codigo}</td>
                <td style={{ padding: '4px 8px' }}>{c.nombre}</td>
                <td style={{ padding: '4px 8px' }}>{c.tipo}</td>
                <td style={{ padding: '4px 8px' }}>{c.naturaleza}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
