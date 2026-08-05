import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const secciones = [
  { to: '', label: 'Resumen', end: true },
  { to: '/cuentas', label: 'Plan de cuentas' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/compras', label: 'Compras' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/cuentas-por-cobrar', label: 'Cuentas por cobrar' },
  { to: '/asientos', label: 'Asientos contables' },
  { to: '/libro-mayor', label: 'Libro mayor' },
  { to: '/balance-comprobacion', label: 'Balance de comprobación' },
  { to: '/estados-financieros', label: 'Estados financieros' },
  { to: '/miembros', label: 'Miembros' },
]

export default function EmpresaLayout() {
  const { id } = useParams()
  const [empresa, setEmpresa] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('empresas').select('*').eq('id', id).single()
      setEmpresa(data)
    }
    cargar()
  }, [id])

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div>
          <Link to="/empresas" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.05rem' }}>
            MiContaBol
          </Link>
          <p style={{ color: '#93A5C4', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
            {empresa?.nombre || 'Cargando...'}
          </p>
        </div>

        <nav className="sidebar-nav">
          {secciones.map((s) => (
            <NavLink
              key={s.to}
              to={`/empresas/${id}${s.to}`}
              end={s.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              {s.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/empresas" style={{ color: '#93A5C4', fontSize: '0.82rem', marginTop: 'auto' }}>
          &larr; Mis empresas
        </Link>
      </aside>

      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
