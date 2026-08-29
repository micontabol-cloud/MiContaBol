import { useEffect, useState } from 'react'
import { NavLink, Outlet, useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Home,
  Megaphone,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Truck,
  Wallet,
  Landmark,
  UsersRound,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  UserRound,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'
import { RolProvider, useRol, puedeConfigurar, esAdmin } from '../contexts/RolContext'

// Un solo estilo de iconos en toda la app (Lucide, outline, mismo
// grosor) en vez de mezclar emojis con símbolos.
const ICONO = { size: 17, strokeWidth: 1.8 }

const principal = [
  { to: '', label: 'Inicio', Icon: Home, end: true },
  { to: '/ventas', label: 'Ventas', Icon: ShoppingCart },
  { to: '/compras', label: 'Compras', Icon: ShoppingBag },
  { to: '/clientes', label: 'Clientes', Icon: Users },
  { to: '/catalogos', label: 'Catálogo', Icon: Megaphone },
  { to: '/proveedores', label: 'Proveedores', Icon: Truck },
  { to: '/caja', label: 'Caja', Icon: Wallet },
]

const inventario = [
  { to: '/inventario', label: 'Resumen', end: true },
  { to: '/inventario/productos', label: 'Productos' },
  { to: '/inventario/conteos', label: 'Conteo físico' },
  { to: '/inventario/importar', label: 'Importar desde Excel' },
  { to: '/analisis-costo', label: 'Análisis de costo' },
]

const bancos = [{ to: '/bancos', label: 'Cuentas y conciliación', end: true }]

const contabilidad = [
  { to: '/cuentas', label: 'Plan de cuentas' },
  { to: '/asientos', label: 'Asientos' },
  { to: '/cierre', label: 'Cierre de ejercicio' },
]

const reportes = [
  { to: '/reportes', label: 'Resumen', end: true },
  { to: '/libro-mayor', label: 'Libro mayor' },
  { to: '/balance-comprobacion', label: 'Balance de comprobación' },
  { to: '/estados-financieros', label: 'Estados financieros' },
]

// Los cuatro destinos de la barra inferior. Son los que se usan a
// diario desde el celular; el resto vive en "Más".
const barraMovil = [
  { to: '', label: 'Inicio', Icon: Home, end: true },
  { to: '/inventario/productos', label: 'Productos', Icon: Package },
  { to: '/caja', label: 'Caja', Icon: Wallet },
]

function GrupoColapsable({ titulo, Icon, items, empresaId, pathname }) {
  const estaEnGrupo = items.some((it) => pathname.startsWith(`/empresas/${empresaId}${it.to}`))
  const [abierto, setAbierto] = useState(estaEnGrupo)

  return (
    <div>
      <button type="button" className="sidebar-group-toggle" onClick={() => setAbierto(!abierto)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Icon {...ICONO} />
          {titulo}
        </span>
        {abierto ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
      </button>
      {abierto && (
        <div className="sidebar-subnav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={`/empresas/${empresaId}${it.to}`}
              end={it.end}
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

function LayoutInterno() {
  const { rol } = useRol()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('empresas').select('*').eq('id', id).single()
      setEmpresa(data)
    }
    cargar()
  }, [id])

  // Al navegar, el menú se cierra solo: en celular molesta tener que
  // cerrarlo a mano después de cada toque.
  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  const enBarra = (to, end) => {
    const ruta = `/empresas/${id}${to}`
    return end ? location.pathname === ruta : location.pathname.startsWith(ruta)
  }

  return (
    <div className="app-shell">
      <header className="topbar-movil">
        <Logo to="/empresas" dark iconSize={30} textSize="1.05rem" />
        <span style={{ fontSize: '0.82rem', color: '#93A5C4', maxWidth: 140, textAlign: 'right' }}>
          {empresa?.nombre}
        </span>
      </header>

      <div
        className={'drawer-overlay' + (menuAbierto ? ' visible' : '')}
        onClick={() => setMenuAbierto(false)}
        aria-hidden="true"
      />

      <aside className={'app-sidebar' + (menuAbierto ? ' abierto' : '')}>
        <button
          type="button"
          className="boton-menu"
          onClick={() => setMenuAbierto(false)}
          aria-label="Cerrar menú"
          style={{ alignSelf: 'flex-end', display: menuAbierto ? 'flex' : 'none' }}
        >
          <X size={20} strokeWidth={2} />
        </button>

        <div>
          <Logo to="/empresas" dark iconSize={38} textSize="1.15rem" />
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
              <s.Icon {...ICONO} />
              {s.label}
            </NavLink>
          ))}

          <div className="sidebar-divider" />

          <GrupoColapsable
            titulo="Inventario"
            Icon={Package}
            items={inventario}
            empresaId={id}
            pathname={location.pathname}
          />

          {/* La contabilidad y los reportes son para quien lleva las
              cuentas; el vendedor no necesita verlos. */}
          {puedeConfigurar(rol) && (
            <>
              <GrupoColapsable
                titulo="Bancos"
                Icon={Landmark}
                items={bancos}
                empresaId={id}
                pathname={location.pathname}
              />
              <GrupoColapsable
                titulo="Contabilidad"
                Icon={BookOpen}
                items={contabilidad}
                empresaId={id}
                pathname={location.pathname}
              />
              <GrupoColapsable
                titulo="Reportes"
                Icon={BarChart3}
                items={reportes}
                empresaId={id}
                pathname={location.pathname}
              />
            </>
          )}

          <div className="sidebar-divider" />

          {puedeConfigurar(rol) && (
            <NavLink
              to={`/empresas/${id}/formas-de-pago`}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <CreditCard {...ICONO} />
              Formas de pago
            </NavLink>
          )}
          {puedeConfigurar(rol) && (
            <NavLink
              to={`/empresas/${id}/personal`}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <UsersRound {...ICONO} />
              Personal
            </NavLink>
          )}
          {esAdmin(rol) && (
            <NavLink
              to={`/empresas/${id}/perfil-empresa`}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <Settings {...ICONO} />
              Mi negocio
            </NavLink>
          )}

          <div className="sidebar-divider" />

          <NavLink to="/perfil" className="sidebar-link">
            <UserRound {...ICONO} />
            Mi perfil
          </NavLink>
          <NavLink to="/suscripcion" className="sidebar-link">
            <Sparkles {...ICONO} />
            Mi plan
          </NavLink>
        </nav>

        <Link to="/empresas" style={{ color: '#93A5C4', fontSize: '0.8rem', marginTop: 'auto' }}>
          &larr; Mis empresas
        </Link>
      </aside>

      <div className="app-content">
        <Outlet />
      </div>

      {/* Barra inferior, solo en celular.
          Vender va al centro y destacado porque es lo que se hace
          cincuenta veces al día; lo demás se consulta de a ratos. */}
      <nav className="barra-movil">
        {barraMovil.slice(0, 2).map((s) => (
          <NavLink
            key={s.to}
            to={`/empresas/${id}${s.to}`}
            end={s.end}
            className={'barra-movil-item' + (enBarra(s.to, s.end) ? ' activo' : '')}
          >
            <s.Icon size={21} strokeWidth={1.9} />
            <span>{s.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className="barra-movil-vender"
          onClick={() => navigate(`/empresas/${id}/inventario/venta`)}
          aria-label="Registrar una venta"
        >
          <Plus size={26} strokeWidth={2.5} />
          <span>Vender</span>
        </button>

        <NavLink
          to={`/empresas/${id}/caja`}
          className={'barra-movil-item' + (enBarra('/caja') ? ' activo' : '')}
        >
          <Wallet size={21} strokeWidth={1.9} />
          <span>Caja</span>
        </NavLink>

        <button
          type="button"
          className={'barra-movil-item' + (menuAbierto ? ' activo' : '')}
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
        >
          <MoreHorizontal size={21} strokeWidth={1.9} />
          <span>Más</span>
        </button>
      </nav>
    </div>
  )
}

export default function EmpresaLayout() {
  const { id } = useParams()
  return (
    <RolProvider empresaId={id}>
      <LayoutInterno />
    </RolProvider>
  )
}
