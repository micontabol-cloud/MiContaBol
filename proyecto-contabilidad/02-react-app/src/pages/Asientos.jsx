import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Asientos() {
  const { id: empresaId } = useParams()
  const [asientos, setAsientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [procesando, setProcesando] = useState(null)

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase
      .from('asientos_contables')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })
      .order('numero', { ascending: false })

    if (!error) setAsientos(data)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const idsYaRevertidos = new Set(asientos.filter((a) => a.asiento_reversion_de).map((a) => a.asiento_reversion_de))

  async function handleRevertir(asientoId) {
    if (!window.confirm('¿Crear el asiento inverso a este? Esto no se puede deshacer.')) return

    setError(null)
    setProcesando(asientoId)

    const { error } = await supabase.rpc('revertir_asiento', { p_asiento_id: asientoId })

    setProcesando(null)

    if (error) {
      setError(error.message)
      return
    }

    cargar()
  }

  return (
    <main style={{ maxWidth: 780, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Asientos contables</h1>
        <Link to={`/empresas/${empresaId}/asientos/nuevo`}>
          <button>+ Nuevo asiento</button>
        </Link>
      </div>

      {error && <p style={{ color: '#a33' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : asientos.length === 0 ? (
        <p>Todavía no hay asientos. Crea el primero arriba.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '4px 8px' }}>N°</th>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Glosa</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {asientos.map((a) => {
              const yaRevertido = idsYaRevertidos.has(a.id)
              const esReversion = a.origen === 'reversion'
              const puedeRevertir = a.estado === 'confirmado' && !yaRevertido

              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '4px 8px' }}>{a.numero}</td>
                  <td style={{ padding: '4px 8px' }}>{a.fecha}</td>
                  <td style={{ padding: '4px 8px' }}>
                    {a.glosa}
                    {esReversion && <span style={{ color: '#888' }}> (reversión)</span>}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    {a.estado}
                    {yaRevertido && <span style={{ color: '#888' }}> (revertido)</span>}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    {puedeRevertir && (
                      <button type="button" onClick={() => handleRevertir(a.id)} disabled={procesando === a.id}>
                        Revertir
                      </button>
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
