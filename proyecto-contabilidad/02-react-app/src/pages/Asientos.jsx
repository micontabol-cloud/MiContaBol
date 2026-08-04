import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Asientos() {
  const { id: empresaId } = useParams()
  const [asientos, setAsientos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('asientos_contables')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('fecha', { ascending: false })
        .order('numero', { ascending: false })

      if (!error) setAsientos(data)
      setCargando(false)
    }
    cargar()
  }, [empresaId])

  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Asientos contables</h1>
        <Link to={`/empresas/${empresaId}/asientos/nuevo`}>
          <button>+ Nuevo asiento</button>
        </Link>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {asientos.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px 8px' }}>{a.numero}</td>
                <td style={{ padding: '4px 8px' }}>{a.fecha}</td>
                <td style={{ padding: '4px 8px' }}>{a.glosa}</td>
                <td style={{ padding: '4px 8px' }}>{a.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
