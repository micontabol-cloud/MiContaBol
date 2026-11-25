#!/usr/bin/env python3
import re, sys, pathlib

src = pathlib.Path('src')
if not src.is_dir():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

JS = r'''// MiContaBol · tablas que en el celular se ven como tarjetas.
// Una tabla con className="tabla-cards" se dibuja como una lista de tarjetas en pantallas
// angostas (el CSS está en index.css). Este archivo solo copia el título de cada columna
// a cada celda (data-label) para que la tarjeta diga "Fecha: …", "Monto: …".
function etiquetar(tabla) {
  const titulos = Array.from(tabla.querySelectorAll('thead th')).map((th) => (th.textContent || '').trim())
  if (!titulos.length) return
  tabla.querySelectorAll('tbody tr').forEach((fila) => {
    const celdas = Array.from(fila.children)
    // Filas de detalle (una sola celda que ocupa todo el ancho): sin etiqueta.
    if (celdas.length === 1 || celdas.some((c) => c.colSpan > 1)) return
    celdas.forEach((td, i) => {
      const t = titulos[i] ?? ''
      if (td.getAttribute('data-label') !== t) td.setAttribute('data-label', t)
    })
  })
}

function revisar(raiz) {
  if (raiz.nodeType !== 1) return
  if (raiz.matches?.('table.tabla-cards')) etiquetar(raiz)
  raiz.querySelectorAll?.('table.tabla-cards').forEach(etiquetar)
  const t = raiz.closest?.('table.tabla-cards')
  if (t) etiquetar(t)
}

export function activarTablasTarjeta() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
  let pendiente = false
  const cola = new Set()
  const vaciar = () => {
    pendiente = false
    cola.forEach(revisar)
    cola.clear()
  }
  new MutationObserver((cambios) => {
    for (const c of cambios) c.addedNodes.forEach((n) => cola.add(n.nodeType === 1 ? n : c.target))
    if (!pendiente) {
      pendiente = true
      requestAnimationFrame(vaciar)
    }
  }).observe(document.body, { childList: true, subtree: true })
  revisar(document.body)
}
'''

CSS = r'''
/* ── Tablas como tarjetas en el celular (tabla-cards) ─────────────────────── */
@media (max-width: 640px) {
  table.tabla-cards,
  table.tabla-cards tbody { display: block; width: 100%; }
  table.tabla-cards thead { display: none; }

  table.tabla-cards tr {
    display: block;
    background: #FFFFFF;
    border: 1px solid #E6ECF3 !important;
    border-radius: 12px;
    padding: 0.35rem 0.6rem;
    margin: 0 0 0.6rem;
  }
  table.tabla-cards td {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.2rem 0 !important;
    text-align: right !important;
    border: 0;
    min-height: 28px;
    overflow-wrap: anywhere;
  }
  table.tabla-cards td[data-label]:not([data-label=""])::before {
    content: attr(data-label);
    flex: 0 0 auto;
    color: #64748B;
    font-size: 0.8rem;
    font-weight: 600;
    text-align: left;
  }
  /* celda sin título = botones de acción: ocupa todo el ancho, a la derecha */
  table.tabla-cards td[data-label=""] {
    justify-content: flex-end;
    flex-wrap: wrap;
    border-top: 1px solid #F0F3F8;
    margin-top: 0.2rem;
    padding-top: 0.5rem !important;
  }
  /* fila de detalle que se abre debajo de una tarjeta */
  table.tabla-cards tr:has(> td[colspan]) {
    margin-top: -0.4rem;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    background: #F7F9FC;
  }
  table.tabla-cards td[colspan] { display: block !important; text-align: left !important; }
}
'''

(src / 'lib').mkdir(exist_ok=True)
(src / 'lib' / 'tablasTarjeta.js').write_text(JS, encoding='utf-8')
print('✓ src/lib/tablasTarjeta.js')

css_path = src / 'index.css'
t = css_path.read_text(encoding='utf-8')
if 'tabla-cards' in t:
    print('· index.css ya tenía el CSS')
else:
    css_path.write_text(t.rstrip() + '\n' + CSS, encoding='utf-8')
    print('✓ index.css')

main = src / 'main.jsx'
m = main.read_text(encoding='utf-8')
if 'activarTablasTarjeta' in m:
    print('· main.jsx ya estaba activado')
else:
    m = m.replace("import './index.css'\n", "import './index.css'\nimport { activarTablasTarjeta } from './lib/tablasTarjeta'\n", 1)
    m = m.replace('ReactDOM.createRoot', 'activarTablasTarjeta()\n\nReactDOM.createRoot', 1)
    if 'activarTablasTarjeta()' not in m:
        sys.exit('No pude editar main.jsx: avísale a Claude.')
    main.write_text(m, encoding='utf-8')
    print('✓ main.jsx')

PANTALLAS = {'Ventas': None, 'Compras': None, 'Clientes': None, 'CuentasPorCobrar': None, 'CuentasPorPagar': None, 'Caja': [1]}
for nombre, cuales in PANTALLAS.items():
    f = src / 'pages' / (nombre + '.jsx')
    if not f.exists():
        print(f'! No encontré {f}'); continue
    texto = f.read_text(encoding='utf-8')
    n = {'i': -1, 'hechas': 0}
    def marcar(mo):
        n['i'] += 1
        if cuales is not None and n['i'] not in cuales:
            return mo.group(0)
        n['hechas'] += 1
        return '<table className="tabla-cards" '
    nuevo = re.sub(r'<table (?=style=)', marcar, texto)
    if nuevo != texto:
        f.write_text(nuevo, encoding='utf-8')
    ya = texto.count('tabla-cards')
    print(f"✓ {nombre}: {n['hechas']} tabla(s) marcada(s)" + (f" ({ya} ya estaban)" if ya else ''))
print('Listo.')
