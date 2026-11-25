#!/usr/bin/env python3
"""MiContaBol · arregla el ancho en celular (paso 10).

Problema: en la guía de Inicio, cada paso tenía un texto con ancho mínimo fijo (180 px) y un botón
que no podía bajar de línea. En un celular de 400 px eso sumaba más que la pantalla, el navegador
"achicaba" toda la página (barra azul más corta, franja a la derecha) y la cara de Boli quedaba cortada.

1. OnboardingChecklist: el botón baja de línea si no cabe y el texto puede encogerse.
2. index.css: red de seguridad en celular: lo que se pase del ancho se recorta dentro del contenido
   en vez de agrandar toda la página.

Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_ancho.py
"""
import re, sys, pathlib

src = pathlib.Path('src')
f = src / 'components' / 'OnboardingChecklist.jsx'
css = src / 'index.css'
if not f.exists() or not css.exists():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

t = f.read_text(encoding='utf-8')
if "flex: '1 1 150px'" in t:
    print('· OnboardingChecklist.jsx ya estaba')
else:
    t2, n1 = re.subn(r"(gap: '0\.85rem',\n(\s*)alignItems: 'flex-start',)", r"\1\n\2flexWrap: 'wrap',", t, count=1)
    t2, n2 = re.subn(r"<div style=\{\{ flex: 1, minWidth: 180 \}\}>", "<div style={{ flex: '1 1 150px', minWidth: 0 }}>", t2, count=1)
    if n1 != 1 or n2 != 1:
        print('! OnboardingChecklist.jsx: no encontré lo esperado (no lo toqué)')
    else:
        f.write_text(t2, encoding='utf-8')
        print('✓ OnboardingChecklist.jsx: el botón baja de línea si no cabe')

c = css.read_text(encoding='utf-8')
if 'Red de seguridad de ancho' in c:
    print('· index.css ya estaba')
else:
    c += '''

/* ── Red de seguridad de ancho (celular) ──────────────────────────────────────
   Si alguna pantalla tiene algo más ancho que el teléfono, se recorta dentro del
   contenido en vez de achicar toda la página. */
@media (max-width: 860px) {
  .app-content {
    overflow-x: clip;
  }
}
'''
    css.write_text(c, encoding='utf-8')
    print('✓ index.css: red de seguridad de ancho')
print('Listo.')
