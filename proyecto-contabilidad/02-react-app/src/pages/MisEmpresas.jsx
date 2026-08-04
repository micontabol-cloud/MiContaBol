import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function MisEmpresas() {
  const { session } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!session) return

    async function cargar() {
      // Filtramos explícitamente por membresía: ahora que el super admin
      // puede VER todas las empresas (vía RLS), esta pantalla debe seguir
      // mostrando solo las que son realmente "mías" (donde soy miembro).
      const { data, error } = await supabase
        .from('miembros_empresa')
        .select('rol, empresas(*)')
        .eq('usuario_id', session.user.id)

      if (!error) {
        setEmpresas(data.map((m) => ({ ...m.empresas, rol: m.rol })))
      }

      const { data: admin } = await supabase.rpc('soy_super_admin')
      setEsAdmin(!!admin)

      setCargando(false)
    }
    cargar()
  }, [session])

  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mis empresas</h1>
        <Link to="/empresas/nueva">
          <button>+ Nueva empresa</button>
        </Link>
      </div>

      {esAdmin && (
        <p style={{ marginTop: '0.5rem' }}>
          <Link to="/admin">Panel de administrador &rarr;</Link>
        </p>
      )}

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
