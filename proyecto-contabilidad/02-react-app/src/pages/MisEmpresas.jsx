import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function MisEmpresas() {
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      // RLS ya filtra esto a solo las empresas donde el usuario es miembro.
      const { data, error } = await supabase.from('empresas').select('*').order('nombre')
      if (!error) setEmpresas(data)
      setCargando(false)
    }
    cargar()
  }, [])

  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mis empresas</h1>
        <Link to="/empresas/nueva">
          <button>+ Nueva empresa</button>
        </Link>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : empresas.length === 0 ? (
        <p>Todavía no tienes ninguna empresa. Crea la primera con el botón de arriba.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem' }}>
          {empresas.map((e) => (
            <li key={e.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
              <Link to={`/empresas/${e.id}`}>{e.nombre}</Link>
              <span style={{ color: '#888', marginLeft: '0.5rem' }}>({e.regimen_tributario})</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
