#!/usr/bin/env python3
import re, sys, pathlib

RAIZ = pathlib.Path('src')
if not RAIZ.is_dir():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

MAPA = {'#A3AFBF': '#64748B', '#22C55E': '#15803D', '#F59E0B': '#B45309', '#EF4444': '#DC2626'}
PAT = re.compile(r"(?<![-\w])color:\s*(['\"])(#[0-9A-Fa-f]{6})\1")
PAT_VAR = re.compile(r"(?<![-\w])color:\s*(['\"])var\(--color-text-disabled\)\1")
SALTAR_ARCHIVOS = ('Landing', 'landing', 'Boli', 'boli')

total = {k: 0 for k in MAPA}; total['disabled'] = 0
archivos = 0
for f in sorted(RAIZ.rglob('*.jsx')):
    if any(s in f.name for s in SALTAR_ARCHIVOS):
        continue
    lineas = f.read_text(encoding='utf-8').split('\n')
    cambios = 0
    for i, ln in enumerate(lineas):
        if 'style={{' not in ln:
            continue
        bajo = ln.lower()
        if 'background' in bajo or '1f3a5f' in bajo or 'navy' in bajo:
            continue
        def rep(m):
            hexa = m.group(2).upper()
            if hexa in MAPA:
                total[hexa] += 1
                return f"color: {m.group(1)}{MAPA[hexa]}{m.group(1)}"
            return m.group(0)
        nueva = PAT.sub(rep, ln)
        def rep2(m):
            total['disabled'] += 1
            return f"color: {m.group(1)}#64748B{m.group(1)}"
        nueva = PAT_VAR.sub(rep2, nueva)
        if nueva != ln:
            lineas[i] = nueva; cambios += 1
    if cambios:
        f.write_text('\n'.join(lineas), encoding='utf-8'); archivos += 1

css = RAIZ / 'index.css'
if css.exists():
    t = css.read_text(encoding='utf-8')
    n = t
    n = re.sub(r'(\.stat-delta-up\s*\{\s*color:\s*)var\(--color-success\)', r'\g<1>#15803D', n)
    n = re.sub(r'(\.stat-delta-down\s*\{\s*color:\s*)var\(--color-error\)', r'\g<1>#DC2626', n)
    if n != t:
        css.write_text(n, encoding='utf-8'); print('index.css: avisos de subida/bajada oscurecidos')

print(f"Listo: {sum(total.values())} textos oscurecidos en {archivos} archivos.")
for k, v in total.items():
    print(f"  {k:9} {v}")
