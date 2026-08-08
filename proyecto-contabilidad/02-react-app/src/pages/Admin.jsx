import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Admin() {
  const [autorizado, setAutorizado] = useState(null) // null = verificando todavía
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function verificarYCargar() {
      const { data: esAdmin, error: errAdmin } = await supabase.rpc('soy_super_admin')

      if (errAdmin || !esAdmin) {
        setAutorizado(false)
        setCargando(false)
        return
      }

      setAutorizado(true)

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setEmpresas(data)
      }
      setCargando(false)
    }
    verificarYCargar()
  }, [])

  if (cargando) {
    return (
      <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <p>Verificando acceso...</p>
      </main>
    )
  }

  if (!autorizado) {
    return (
      <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <h1>No autorizado</h1>
        <p>No tienes acceso a esta sección.</p>
        <p>
          <Link to="/empresas">&larr; Volver a Mis empresas</Link>
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>
      <h1>Panel de administrador</h1>
      <p style={{ color: '#64748B' }}>Vista de solo lectura de todas las empresas de la plataforma.</p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {empresas.length === 0 ? (
        <p>No hay empresas registradas todavía.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>NIT</th>
              <th style={{ padding: '4px 8px' }}>Régimen</th>
              <th style={{ padding: '4px 8px' }}>Creada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{e.nombre}</td>
                <td style={{ padding: '4px 8px' }}>{e.nit || '—'}</td>
                <td style={{ padding: '4px 8px' }}>{e.regimen_tributario}</td>
                <td style={{ padding: '4px 8px' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '4px 8px' }}>
                  <Link to={`/empresas/${e.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
