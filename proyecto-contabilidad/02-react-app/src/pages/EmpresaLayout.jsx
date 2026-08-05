import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, useLocation, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

const principal = [
  { to: '', label: 'Inicio', icon: '🏠', end: true },
  { to: '/ventas', label: 'Ventas', icon: '💰' },
  { to: '/compras', label: 'Compras', icon: '🛒' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/proveedores', label: 'Proveedores', icon: '🚚' },
  { to: '/caja', label: 'Caja', icon: '💵' },
]

const contabilidad = [
  { to: '/cuentas', label: 'Plan de cuentas' },
  { to: '/asientos', label: 'Asientos' },
]

const reportes = [
  { to: '/libro-mayor', label: 'Libro mayor' },
  { to: '/balance-comprobacion', label: 'Balance de comprobación' },
  { to: '/estados-financieros', label: 'Estados financieros' },
  { to: '/analisis-costo', label: 'Análisis de costo' },
]

function GrupoColapsable({ titulo, icono, items, empresaId, pathname }) {
  const estaEnGrupo = items.some((it) => pathname === `/empresas/${empresaId}${it.to}`)
  const [abierto, setAbierto] = useState(estaEnGrupo)

  return (
    <div>
      <button type="button" className="sidebar-group-toggle" onClick={() => setAbierto(!abierto)}>
        <span>
          {icono} {titulo}
        </span>
        <span>{abierto ? '▾' : '▸'}</span>
      </button>
      {abierto && (
        <div className="sidebar-subnav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={`/empresas/${empresaId}${it.to}`}
              className={({ isActive }) => 'sidebar-link sidebar-link-sub' + (isActive ? ' active' : '')}
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EmpresaLayout() {
  const { id } = useParams()
  const location = useLocation()
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
          <Logo to="/empresas" dark iconSize={26} textSize="1rem" />
          <p style={{ color: '#93A5C4', fontSize: '0.72rem', margin: '0.4rem 0 0', lineHeight: 1.35 }}>
            Mi contabilidad
            <br />
            en el bolsillo.
          </p>
        </div>

        <div className="sidebar-empresa-chip">{empresa?.nombre || 'Cargando...'}</div>

        <nav className="sidebar-nav">
          {principal.map((s) => (
            <NavLink
              key={s.to}
              to={`/empresas/${id}${s.to}`}
              end={s.end}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              {s.icon} {s.label}
            </NavLink>
          ))}

          <div className="sidebar-divider" />

          <GrupoColapsable
            titulo="Contabilidad"
            icono="📒"
            items={contabilidad}
            empresaId={id}
            pathname={location.pathname}
          />
          <GrupoColapsable titulo="Reportes" icono="📊" items={reportes} empresaId={id} pathname={location.pathname} />

          <div className="sidebar-divider" />

          <NavLink
            to={`/empresas/${id}/miembros`}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            ⚙ Configuración
          </NavLink>
        </nav>

        <Link to="/empresas" style={{ color: '#93A5C4', fontSize: '0.8rem', marginTop: 'auto' }}>
          &larr; Mis empresas
        </Link>
      </aside>

      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
