#!/usr/bin/env python3
import re, sys, pathlib

src = pathlib.Path('src')
if not (src / 'pages').is_dir():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

ICO = r"""import {
  AlertTriangle,
  Banknote,
  Cake,
  Camera,
  CheckCircle2,
  Clock,
  Handshake,
  Landmark,
  MapPin,
  MessageCircle,
  Package,
  PartyPopper,
  Receipt,
  Tag,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

// Un solo estilo de iconos en toda la app (Lucide). Recibe el emoji que antes se escribía y dibuja
// su ícono; si no lo conoce (por ejemplo, un emoji que eligió el usuario) lo muestra tal cual.
const MAPA = {
  '⚠': AlertTriangle,
  '✅': CheckCircle2,
  '🎉': PartyPopper,
  '📍': MapPin,
  '🕒': Clock,
  '💬': MessageCircle,
  '📷': Camera,
  '👍': ThumbsUp,
  '📈': TrendingUp,
  '📉': TrendingDown,
  '🧾': Receipt,
  '🏦': Landmark,
  '🤝': Handshake,
  '💰': Banknote,
  '💸': Banknote,
  '📦': Package,
  '🏷': Tag,
  '🎂': Cake,
}

const limpio = (e) => String(e ?? '').replace(/\uFE0F/g, '').trim()

export default function Ico({ e, size = 16, fallback = null, style }) {
  const Icono = MAPA[limpio(e)]
  if (!Icono) return <span aria-hidden="true">{e || fallback}</span>
  return (
    <Icono
      size={size}
      strokeWidth={2}
      aria-hidden="true"
      style={{ verticalAlign: '-0.18em', flexShrink: 0, ...style }}
    />
  )
}
"""

M = "style={{ color: marca }}"

CAMBIOS = {
  'components/AsientoPreview.jsx': ('./Ico', [
    ('⚠️ {aviso}', '<Ico e="⚠️" /> {aviso}'),
    ("<span aria-hidden=\"true\">{l.icono || '•'}</span>",
     "<span aria-hidden=\"true\" style={{ display: 'inline-flex', paddingTop: 2 }}>\n              <Ico e={l.icono} size={17} fallback=\"•\" />\n            </span>"),
    ("{cuadra ? '✓ El asiento cuadra' : '⚠️ El asiento no cuadra'}",
     '{cuadra ? \'✓ El asiento cuadra\' : <><Ico e="⚠️" /> El asiento no cuadra</>}'),
  ]),
  'components/MetodoPagoSelector.jsx': ('./Ico', [
    ("<span style={{ fontSize: '1.3rem' }}>{m.icono || '💰'}</span>",
     "<span style={{ fontSize: '1.3rem', display: 'inline-flex' }}>\n                <Ico e={m.icono || '💰'} size={22} />\n              </span>"),
  ]),
  'pages/BalanceComprobacion.jsx': ('../components/Ico', [
    ('✅ El total debe y el total haber cuadran.', '<Ico e="✅" /> El total debe y el total haber cuadran.'),
    ('⚠️ No cuadran (diferencia: {(totalDebe - totalHaber).toFixed(2)}).',
     '<Ico e="⚠️" /> No cuadran (diferencia: {(totalDebe - totalHaber).toFixed(2)}).'),
  ]),
  'pages/EstadosFinancieros.jsx': ('../components/Ico', [
    ('✅ Activo = Pasivo + Patrimonio. La ecuación contable cuadra.', '<Ico e="✅" /> Activo = Pasivo + Patrimonio. La ecuación contable cuadra.'),
    ('⚠️ No cuadra (diferencia: {(totalActivo - totalPasivoMasPatrimonio).toFixed(2)}).',
     '<Ico e="⚠️" /> No cuadra (diferencia: {(totalActivo - totalPasivoMasPatrimonio).toFixed(2)}).'),
  ]),
  'pages/CatalogoPublico.jsx': ('../components/Ico', [
    ("📍{' '}", '<Ico e="📍" ' + M + " />{' '}"),
    ('🕒 {datos.horarios}', '<Ico e="🕒" ' + M + ' /> {datos.horarios}'),
    ("💬{' '}", '<Ico e="💬" ' + M + " />{' '}"),
    ("📷{' '}", '<Ico e="📷" ' + M + " />{' '}"),
    ("👍{' '}", '<Ico e="👍" ' + M + " />{' '}"),
  ]),
  'pages/Compras.jsx': ('../components/Ico', [
    ('No le debes nada a nadie. 🎉', 'No le debes nada a nadie. <Ico e="🎉" />'),
  ]),
  'pages/CuentasPorCobrar.jsx': ('../components/Ico', [
    ('No hay saldos pendientes por cobrar. 🎉', 'No hay saldos pendientes por cobrar. <Ico e="🎉" />'),
  ]),
  'pages/CuentasPorPagar.jsx': ('../components/Ico', [
    ('No le debes nada a ningún proveedor. 🎉', 'No le debes nada a ningún proveedor. <Ico e="🎉" />'),
  ]),
  'pages/Ventas.jsx': ('../components/Ico', [
    ('Nadie te debe nada. 🎉', 'Nadie te debe nada. <Ico e="🎉" />'),
  ]),
  'pages/MetodosPago.jsx': ('../components/Ico', [
    ('{m.icono} {m.nombre}', '<Ico e={m.icono} /> {m.nombre}'),
    ('⚠️ sin configurar', '<Ico e="⚠️" size={14} /> sin configurar'),
    ('⚠️ el efectivo suele ir a caja, no al banco', '<Ico e="⚠️" size={14} /> el efectivo suele ir a caja, no al banco'),
    ('⚠️ esto llega al banco, no a la caja', '<Ico e="⚠️" size={14} /> esto llega al banco, no a la caja'),
  ]),
  'pages/NuevoAsiento.jsx': ('../components/Ico', [
    ("{balanceado ? '✅ balanceado' : '⚠️ no balanceado'}",
     "{balanceado ? (\n            <>\n              <Ico e=\"✅\" style={{ color: '#15803D' }} /> balanceado\n            </>\n          ) : (\n            <>\n              <Ico e=\"⚠️\" style={{ color: '#B45309' }} /> no balanceado\n            </>\n          )}"),
  ]),
  'pages/Perfil.jsx': ('../components/Ico', [
    ('🎂 ¡Feliz cumpleaños', '<Ico e="🎂" /> ¡Feliz cumpleaños'),
  ]),
  'pages/Productos.jsx': ('../components/Ico', [
    ("{configCompleta ? '✅' : '⚠️ (falta configurar)'}",
     "{configCompleta ? (\n            <Ico e=\"✅\" style={{ color: '#15803D' }} />\n          ) : (\n            <>\n              <Ico e=\"⚠️\" style={{ color: '#B45309' }} /> (falta configurar)\n            </>\n          )}"),
  ]),
}

(src / 'components').mkdir(exist_ok=True)
(src / 'components' / 'Ico.jsx').write_text(ICO, encoding='utf-8')
print('✓ src/components/Ico.jsx')

for ruta, (imp, cambios) in CAMBIOS.items():
    f = src / ruta
    if not f.exists():
        print(f'! No encontré {ruta}'); continue
    t = f.read_text(encoding='utf-8')
    if "components/Ico'" in t or "from './Ico'" in t:
        print(f'· {ruta}: ya estaba'); continue
    malos = [v for v, _ in cambios if t.count(v) != 1]
    if malos:
        print(f'! {ruta}: no encontré o está repetido -> {malos[0][:40]!r} (no lo toqué)'); continue
    for viejo, nuevo in cambios:
        t = t.replace(viejo, nuevo, 1)
    m = re.search(r'^import ', t, flags=re.M)
    pos = m.start() if m else 0   # si el archivo no tiene imports, va al principio
    t = t[:pos] + f"import Ico from '{imp}'\n" + ('' if m else '\n') + t[pos:]
    f.write_text(t, encoding='utf-8')
    print(f'✓ {ruta}: {len(cambios)} cambio(s)')
print('Listo.')
