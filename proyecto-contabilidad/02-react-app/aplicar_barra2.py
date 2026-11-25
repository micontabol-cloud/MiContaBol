#!/usr/bin/env python3
import sys, pathlib

src = pathlib.Path('src')
f = src / 'pages' / 'EmpresaLayout.jsx'
css_path = src / 'index.css'
if not f.exists() or not css_path.exists():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

CSS = '''
/* ── Menú minimizado en computador: barra de accesos flotante abajo ──────── */
@media (min-width: 861px) {
  .app-shell.menu-min .barra-movil {
    position: fixed;
    bottom: 18px;
    left: calc(68px + (100vw - 68px) / 2);
    transform: translateX(-50%);
    width: min(440px, calc(100vw - 68px - 2rem));
    z-index: 55;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    background: #FFFFFF;
    border: 1px solid var(--color-border);
    border-radius: 22px;
    padding: 0.4rem 0.5rem;
    box-shadow: 0 8px 28px rgba(31, 58, 95, 0.18);
  }
  .app-shell.menu-min .barra-movil-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    background: none;
    border: none;
    padding: 0.4rem 0.2rem;
    color: var(--color-text-secondary);
    font-size: 0.72rem;
    font-weight: 600;
    text-decoration: none;
    min-height: 44px;
    border-radius: 12px;
    cursor: pointer;
  }
  .app-shell.menu-min .barra-movil-item:hover {
    background: var(--color-bg-secondary);
    text-decoration: none;
  }
  .app-shell.menu-min .barra-movil-item.activo { color: var(--color-navy); }
  .app-shell.menu-min .barra-movil-item span { line-height: 1; }
  .app-shell.menu-min .barra-movil-vender {
    flex: 1;
    max-width: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    background: var(--color-coral);
    color: #FFFFFF;
    border: 4px solid #FFFFFF;
    border-radius: 20px;
    padding: 0.6rem 0.3rem 0.45rem;
    margin-top: -1.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(242, 85, 90, 0.4);
    cursor: pointer;
  }
  .app-shell.menu-min .barra-movil-vender:hover { background: var(--color-coral-hover); }
  /* que la barra no tape lo último de cada pantalla */
  .app-shell.menu-min .app-content { padding-bottom: 6.5rem; }
}
'''

CAMBIOS = [
 ("clase del contenedor",
  "<div className=\"app-shell\">",
  "<div className={'app-shell' + (colapsado ? ' menu-min' : '')}>"),
 ("botón Más",
  "onClick={() => setMenuAbierto(true)}",
  "onClick={() => (window.matchMedia('(min-width: 861px)').matches ? alternarMenu() : setMenuAbierto(true))}"),
]

t = f.read_text(encoding='utf-8')
if 'menu-min' in t:
    print('· EmpresaLayout.jsx ya estaba actualizado')
else:
    if 'alternarMenu' not in t:
        sys.exit('Falta aplicar primero aplicar_barra.py (el menú minimizable). No toqué nada.')
    faltan = [d for d, viejo, _ in CAMBIOS if t.count(viejo) != 1]
    if faltan:
        sys.exit('No encontré estos trozos en EmpresaLayout.jsx (no toqué nada): ' + ', '.join(faltan) + '.')
    for d, viejo, nuevo in CAMBIOS:
        t = t.replace(viejo, nuevo, 1)
    f.write_text(t, encoding='utf-8')
    print('✓ EmpresaLayout.jsx')

c = css_path.read_text(encoding='utf-8')
if 'barra de accesos flotante' in c:
    print('· index.css ya tenía el CSS')
else:
    css_path.write_text(c.rstrip() + '\n' + CSS, encoding='utf-8')
    print('✓ index.css')
print('Listo.')
