#!/usr/bin/env python3
import re, sys, pathlib

ESCALA_CELULAR = '14.5px'   # antes 16px. Más chico = 14px, más grande = 15px

src = pathlib.Path('src')
f = src / 'pages' / 'EmpresaLayout.jsx'
css_path = src / 'index.css'
if not f.exists() or not css_path.exists():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

CSS = '''
/* ── Menú lateral minimizable (computador) ────────────────────────────────── */
.sidebar-colapsar {
  display: none !important;
}
@media (min-width: 861px) {
  .app-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    align-self: flex-start;
    overflow-y: auto;
    overflow-x: hidden;
    transition: width 0.2s ease;
  }
  .app-sidebar > * { flex-shrink: 0; }
  button.sidebar-colapsar {
    display: flex !important;
    align-items: center;
    gap: 0.6rem;
    align-self: flex-start;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    color: #C7D2E0 !important;
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    cursor: pointer;
  }
  button.sidebar-colapsar:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #FFFFFF !important;
  }
  .app-sidebar.colapsado {
    width: 68px;
    padding: 1.1rem 0.5rem;
    align-items: center;
  }
  .app-sidebar.colapsado .sidebar-colapsar { align-self: center; }
  .app-sidebar.colapsado .sidebar-logo-bloque p,
  .app-sidebar.colapsado .sidebar-empresa-chip { display: none; }
  .app-sidebar.colapsado .sidebar-nav { width: 100%; }
  .app-sidebar.colapsado .sidebar-link,
  .app-sidebar.colapsado button.sidebar-group-toggle {
    font-size: 0;
    gap: 0;
    justify-content: center;
    padding: 0.7rem 0;
  }
  .app-sidebar.colapsado button.sidebar-group-toggle > svg { display: none; }
  .app-sidebar.colapsado button.sidebar-group-toggle > span { gap: 0 !important; }
  .app-sidebar.colapsado .sidebar-subnav { display: none; }
  .app-sidebar.colapsado button.sidebar-group-toggle.active {
    background: rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
  }
  .app-sidebar.colapsado .sidebar-volver { font-size: 0 !important; text-align: center; }
  .app-sidebar.colapsado .sidebar-volver::before { content: '\\2190'; font-size: 1.2rem; color: #93A5C4; }
}

/* ── Celular: escala general un poco menor (todo lo escrito en rem se achica parejo) ── */
@media (max-width: 860px) {
  html { font-size: __ESCALA__; }
}
'''.replace('__ESCALA__', ESCALA_CELULAR)

CAMBIOS = [
 ("íconos",
  "  MoreHorizontal,\n} from 'lucide-react'",
  "  MoreHorizontal,\n  PanelLeftClose,\n  PanelLeftOpen,\n} from 'lucide-react'"),
 ("contexto del menú",
  "const ICONO = { size: 17, strokeWidth: 1.8 }\n",
  "const ICONO = { size: 17, strokeWidth: 1.8 }\n\n// Si el menú lateral está minimizado (solo íconos)\nconst BarraLateral = createContext({ colapsado: false })\n"),
 ("grupo colapsable",
  "  const [abierto, setAbierto] = useState(estaEnGrupo)\n\n  return (\n    <div>\n      <button type=\"button\" className=\"sidebar-group-toggle\" onClick={() => setAbierto(!abierto)}>",
  "  const [abierto, setAbierto] = useState(estaEnGrupo)\n  const { colapsado } = useContext(BarraLateral)\n  const irA = useNavigate()\n\n  return (\n    <div>\n      <button\n        type=\"button\"\n        className={'sidebar-group-toggle' + (colapsado && estaEnGrupo ? ' active' : '')}\n        onClick={() => (colapsado ? irA(`/empresas/${empresaId}${items[0].to}`) : setAbierto(!abierto))}\n      >"),
 ("estado del menú",
  "  const [menuAbierto, setMenuAbierto] = useState(false)\n",
  "  const [menuAbierto, setMenuAbierto] = useState(false)\n  const [colapsado, setColapsado] = useState(() => {\n    try {\n      return localStorage.getItem('mcb_menu_min') === '1'\n    } catch {\n      return false\n    }\n  })\n  const alternarMenu = () =>\n    setColapsado((v) => {\n      try {\n        localStorage.setItem('mcb_menu_min', v ? '0' : '1')\n      } catch {\n        /* sin almacenamiento: queda solo en esta sesión */\n      }\n      return !v\n    })\n\n  // Con el menú minimizado, cada ícono muestra su nombre al pasar el mouse\n  useEffect(() => {\n    document.querySelectorAll('.app-sidebar .sidebar-link, .app-sidebar .sidebar-group-toggle').forEach((el) => {\n      if (colapsado) el.setAttribute('title', (el.textContent || '').trim())\n      else el.removeAttribute('title')\n    })\n  }, [colapsado, location.pathname, rol])\n"),
 ("proveedor del contexto (abre)",
  "  return (\n    <div className=\"app-shell\">",
  "  return (\n    <BarraLateral.Provider value={{ colapsado }}>\n    <div className=\"app-shell\">"),
 ("clase del menú",
  "<aside className={'app-sidebar' + (menuAbierto ? ' abierto' : '')}>",
  "<aside className={'app-sidebar' + (menuAbierto ? ' abierto' : '') + (colapsado ? ' colapsado' : '')}>"),
 ("botón minimizar y logo",
  "        <div>\n          <Logo to=\"/empresas\" dark iconSize={38} textSize=\"1.15rem\" />",
  "        <button\n          type=\"button\"\n          className=\"sidebar-colapsar\"\n          onClick={alternarMenu}\n          aria-label={colapsado ? 'Mostrar el menú completo' : 'Minimizar el menú'}\n          title={colapsado ? 'Mostrar el menú completo' : 'Minimizar el menú'}\n        >\n          {colapsado ? <PanelLeftOpen size={18} strokeWidth={1.9} /> : <PanelLeftClose size={18} strokeWidth={1.9} />}\n          {!colapsado && <span>Minimizar</span>}\n        </button>\n\n        <div className=\"sidebar-logo-bloque\">\n          <Logo to=\"/empresas\" dark iconSize={colapsado ? 26 : 38} textSize=\"1.15rem\" showText={!colapsado} />"),
 ("volver a empresas",
  "<Link to=\"/empresas\" style={{ color: '#93A5C4', fontSize: '0.8rem', marginTop: 'auto' }}>",
  "<Link to=\"/empresas\" className=\"sidebar-volver\" style={{ color: '#93A5C4', fontSize: '0.8rem', marginTop: 'auto' }}>"),
 ("proveedor del contexto (cierra)",
  "    </div>\n  )\n}\n\nexport default function EmpresaLayout()",
  "    </div>\n    </BarraLateral.Provider>\n  )\n}\n\nexport default function EmpresaLayout()"),
]

t = f.read_text(encoding='utf-8')
if 'BarraLateral' in t:
    print('· EmpresaLayout.jsx ya estaba actualizado')
else:
    m = re.search(r"import \{([^}]*)\} from 'react'", t)
    if not m:
        sys.exit("No encontré el import de react en EmpresaLayout.jsx (no toqué nada).")
    nombres = [n.strip() for n in m.group(1).split(',') if n.strip()]
    for n in ('createContext', 'useContext'):
        if n not in nombres:
            nombres.append(n)
    t = t.replace(m.group(0), "import { " + ", ".join(nombres) + " } from 'react'", 1)

    faltan = [d for d, viejo, _ in CAMBIOS if t.count(viejo) != 1]
    if faltan:
        sys.exit('No encontré estos trozos en EmpresaLayout.jsx (no toqué nada): ' + ', '.join(faltan) + '. Mándale esta lista a Claude.')
    for d, viejo, nuevo in CAMBIOS:
        t = t.replace(viejo, nuevo, 1)
    f.write_text(t, encoding='utf-8')
    print('✓ EmpresaLayout.jsx')

c = css_path.read_text(encoding='utf-8')
if 'Menú lateral minimizable' in c:
    print('· index.css ya tenía el CSS')
else:
    css_path.write_text(c.rstrip() + '\n' + CSS, encoding='utf-8')
    print('✓ index.css')
print('Listo.')
