import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NuevoAsiento() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [cuentas, setCuentas] = useState([])
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [glosa, setGlosa] = useState('')
  const [lineas, setLineas] = useState([
    { cuenta_id: '', debe: '', haber: '' },
    { cuenta_id: '', debe: '', haber: '' },
  ])
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarCuentas() {
      const { data } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo')
      setCuentas(data || [])
    }
    cargarCuentas()
  }, [empresaId])

  function actualizarLinea(i, campo, valor) {
    const nuevas = [...lineas]
    nuevas[i] = { ...nuevas[i], [campo]: valor }
    setLineas(nuevas)
  }

  function agregarLinea() {
    setLineas([...lineas, { cuenta_id: '', debe: '', haber: '' }])
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i))
  }

  const totalDebe = lineas.reduce((sum, l) => sum + (parseFloat(l.debe) || 0), 0)
  const totalHaber = lineas.reduce((sum, l) => sum + (parseFloat(l.haber) || 0), 0)
  const balanceado = totalDebe === totalHaber && totalDebe > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!balanceado) {
      setError('El asiento no está balanceado: debe debe ser igual a haber, y mayor a cero.')
      return
    }

    setGuardando(true)

    const lineasPayload = lineas
      .filter((l) => l.cuenta_id)
      .map((l) => ({
        cuenta_id: l.cuenta_id,
        debe: parseFloat(l.debe) || 0,
        haber: parseFloat(l.haber) || 0,
      }))

    const { error } = await supabase.rpc('crear_asiento_confirmado', {
      p_empresa_id: empresaId,
      p_fecha: fecha,
      p_glosa: glosa,
      p_lineas: lineasPayload,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/asientos`)
  }

  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/asientos`}>&larr; Volver</Link>
      </p>
      <h1>Nuevo asiento</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label>
            Fecha
            <br />
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            Glosa
            <br />
            <input value={glosa} onChange={(e) => setGlosa(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Cuenta</th>
              <th style={{ padding: '4px 8px' }}>Debe</th>
              <th style={{ padding: '4px 8px' }}>Haber</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 8px' }}>
                  <select
                    required
                    value={linea.cuenta_id}
                    onChange={(e) => actualizarLinea(i, 'cuenta_id', e.target.value)}
                  >
                    <option value="">-- Selecciona --</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} — {c.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={linea.debe}
                    onChange={(e) => actualizarLinea(i, 'debe', e.target.value)}
                    style={{ width: 100 }}
                  />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={linea.haber}
                    onChange={(e) => actualizarLinea(i, 'haber', e.target.value)}
                    style={{ width: 100 }}
                  />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  {lineas.length > 2 && (
                    <button type="button" onClick={() => quitarLinea(i)}>
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" onClick={agregarLinea} style={{ alignSelf: 'flex-start' }}>
          + Agregar línea
        </button>

        <p>
          Total debe: {totalDebe.toFixed(2)} — Total haber: {totalHaber.toFixed(2)}
          {' — '}
          {balanceado ? '✅ balanceado' : '⚠️ no balanceado'}
        </p>

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" disabled={guardando || !balanceado}>
          Confirmar asiento
        </button>
      </form>
    </main>
  )
}
