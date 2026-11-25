#!/usr/bin/env python3
"""MiContaBol · velocidad y navegación (paso 9).

1. Cada pantalla tiene su nombre en la pestaña del navegador y en el historial
   ("Ventas · MiContaBol"), y al entrar a una pantalla nueva se vuelve arriba.
2. Inicio ya no "carga de cero" cada vez que vuelves: muestra al instante lo último que vio y se
   actualiza detrás. El gráfico de ventas se baja aparte (373 KB menos para abrir Inicio).
3. Letra propia (sin pedirle nada a Google Fonts): una conexión menos antes de mostrar texto.
4. Caché largo para archivos que no cambian (/assets, /fonts, íconos): la segunda visita casi no descarga.
5. Catálogo: duplicar/borrar ya no recarga toda la página.

Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_velocidad.py
"""
import json, re, sys, pathlib

src = pathlib.Path('src')
if not (src / 'pages').is_dir():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

def leer(p): return pathlib.Path(p).read_text(encoding='utf-8')
def escribir(p, t): pathlib.Path(p).write_text(t, encoding='utf-8')

# ───────────────────────── 1. Títulos por pantalla ─────────────────────────
TITULO = r"""import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Nombre de cada pantalla: sale en la pestaña del navegador y en el historial (botón atrás).
// Cada línea es [cómo termina la dirección, nombre]. La empresa va después de /empresas/<id>.
const EMPRESA = [
  ['', 'Inicio'],
  ['/cuentas', 'Plan de cuentas'],
  ['/ventas', 'Ventas'],
  ['/ventas/nueva-simple', 'Nueva venta'],
  ['/compras', 'Compras'],
  ['/compras/nueva-simple', 'Nueva compra'],
  ['/comprobantes', 'Comprobantes'],
  ['/comprobantes/nuevo', 'Nuevo comprobante'],
  ['/inventario', 'Inventario'],
  ['/inventario/productos', 'Productos'],
  ['/inventario/productos/*', 'Producto'],
  ['/inventario/importar', 'Importar productos'],
  ['/inventario/papelera', 'Papelera de productos'],
  ['/inventario/conteos', 'Conteo físico'],
  ['/inventario/conteos/*', 'Conteo de inventario'],
  ['/inventario/venta', 'Vender'],
  ['/inventario/compra', 'Comprar mercadería'],
  ['/cuentas-por-cobrar', 'Cuentas por cobrar'],
  ['/cuentas-por-pagar', 'Cuentas por pagar'],
  ['/clientes', 'Clientes'],
  ['/proveedores', 'Proveedores'],
  ['/catalogos', 'Catálogos'],
  ['/catalogos/identidad', 'Identidad del negocio'],
  ['/catalogos/*', 'Editar catálogo'],
  ['/formas-de-pago', 'Formas de pago'],
  ['/caja', 'Caja'],
  ['/personal', 'Personal'],
  ['/promotores', 'Promotores'],
  ['/promotores/*', 'Mercadería del promotor'],
  ['/promotor', 'Mi resumen'],
  ['/promotor/catalogo', 'Qué puedo vender'],
  ['/promotor/vender', 'Vender'],
  ['/promotor/ventas', 'Mis ventas'],
  ['/promotor/cuenta', 'Mi cuenta'],
  ['/promotor/comisiones', 'Lo que he ganado'],
  ['/activos', 'Bienes del negocio'],
  ['/bancos', 'Bancos'],
  ['/bancos/conciliacion/*', 'Conciliación bancaria'],
  ['/analisis-costo', 'Análisis de costo'],
  ['/asientos', 'Asientos'],
  ['/asientos/nuevo', 'Nuevo asiento'],
  ['/libro-mayor', 'Libro mayor'],
  ['/balance-comprobacion', 'Balance de comprobación'],
  ['/estados-financieros', 'Estados financieros'],
  ['/reportes', 'Resumen de reportes'],
  ['/resultado-operativo', '¿Gana tu negocio?'],
  ['/cierre', 'Cierre de ejercicio'],
  ['/perfil-empresa', 'Mi negocio'],
  ['/miembros', 'Miembros'],
]

const GENERAL = {
  '/login': 'Iniciar sesión',
  '/privacidad': 'Política de privacidad',
  '/terminos': 'Términos y condiciones',
  '/soporte': 'Soporte',
  '/eliminar-cuenta': 'Eliminar mi cuenta',
  '/admin': 'Administración',
  '/empresas': 'Mis negocios',
  '/empresas/nueva': 'Nuevo negocio',
  '/perfil': 'Mi perfil',
  '/suscripcion': 'Mi plan',
}

function nombreDe(ruta) {
  const limpia = ruta.replace(/\/+$/, '') || '/'
  if (GENERAL[limpia]) return GENERAL[limpia]
  const m = limpia.match(/^\/empresas\/[^/]+(\/.*)?$/)
  if (!m) return null
  const resto = m[1] || ''
  for (const [patron, nombre] of EMPRESA) {
    if (patron.endsWith('/*')) {
      const base = patron.slice(0, -2)
      if (resto.startsWith(base + '/') && resto.split('/').length === base.split('/').length + 1) return nombre
      // /promotores/<id>/mercaderia
      if (base === '/promotores' && /^\/promotores\/[^/]+\/mercaderia$/.test(resto)) return nombre
      if (base === '/bancos/conciliacion' && resto.startsWith(base + '/')) return nombre
    } else if (resto === patron) return nombre
  }
  return null
}

export default function TituloPagina() {
  const { pathname } = useLocation()
  const tipo = useNavigationType()

  useEffect(() => {
    // El catálogo público pone su propio título; la página principal conserva el de index.html.
    if (pathname === '/' || pathname.startsWith('/c/')) return
    const nombre = nombreDe(pathname)
    if (nombre) document.title = `${nombre} · MiContaBol`
  }, [pathname])

  // Pantalla nueva = arriba. Con el botón atrás, el navegador respeta donde ibas.
  useEffect(() => {
    if (tipo === 'PUSH') window.scrollTo(0, 0)
  }, [pathname, tipo])

  return null
}
"""

GRAFICO = r"""import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Gráfico de ventas de Inicio. Vive aparte para que la librería de gráficos no frene
// la primera pantalla: se descarga mientras ya se ven los números.
export default function GraficoVentas({ data }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF3" />
        <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip formatter={(value) => `Bs ${Number(value).toFixed(2)}`} />
        <Bar dataKey="ventas" fill="#F2555A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
"""

escribir(src / 'components' / 'TituloPagina.jsx', TITULO)
escribir(src / 'components' / 'GraficoVentas.jsx', GRAFICO)
print('✓ src/components/TituloPagina.jsx y GraficoVentas.jsx')

app = src / 'App.jsx'
t = leer(app)
if 'TituloPagina' in t:
    print('· App.jsx ya tenía los títulos')
elif t.count('<BrowserRouter>') != 1:
    print('! App.jsx: no encontré <BrowserRouter> (no lo toqué: los títulos no se activan)')
else:
    t = t.replace('<BrowserRouter>', '<BrowserRouter>\n        <TituloPagina />', 1)
    t = "import TituloPagina from './components/TituloPagina'\n" + t
    escribir(app, t)
    print('✓ App.jsx: títulos activados')

# ───────────────────────── 2. Inicio: caché y gráfico aparte ─────────────────────────
dash = src / 'pages' / 'EmpresaDashboard.jsx'
t = leer(dash)
if 'GraficoVentas' in t:
    print('· EmpresaDashboard.jsx ya estaba')
else:
    estados = [
        ("const [empresa, setEmpresa] = useState(null)", "const [empresa, setEmpresa] = useState(inicial?.empresa ?? null)"),
        ("const [cargando, setCargando] = useState(true)", "const [cargando, setCargando] = useState(!inicial)"),
        ("const [kpis, setKpis] = useState({ ventasMes: 0, utilidadMes: 0, productos: 0, clientes: 0, caja: 0 })",
         "const [kpis, setKpis] = useState(inicial?.kpis ?? { ventasMes: 0, utilidadMes: 0, productos: 0, clientes: 0, caja: 0 })"),
        ("const [cambioPorcentual, setCambioPorcentual] = useState(null)", "const [cambioPorcentual, setCambioPorcentual] = useState(inicial?.cambioPorcentual ?? null)"),
        ("const [ultimasVentas, setUltimasVentas] = useState([])", "const [ultimasVentas, setUltimasVentas] = useState(inicial?.ultimasVentas ?? [])"),
        ("const [stockBajo, setStockBajo] = useState([])", "const [stockBajo, setStockBajo] = useState(inicial?.stockBajo ?? [])"),
        ("const [datosGrafico, setDatosGrafico] = useState([])", "const [datosGrafico, setDatosGrafico] = useState(inicial?.datosGrafico ?? [])"),
        ("const [porVencer, setPorVencer] = useState([])", "const [porVencer, setPorVencer] = useState(inicial?.porVencer ?? [])"),
        ("const [ventasHoy, setVentasHoy] = useState({ cantidad: 0, monto: 0 })", "const [ventasHoy, setVentasHoy] = useState(inicial?.ventasHoy ?? { cantidad: 0, monto: 0 })"),
        ("const [totalVentasHistorico, setTotalVentasHistorico] = useState(0)", "const [totalVentasHistorico, setTotalVentasHistorico] = useState(inicial?.totalVentasHistorico ?? 0)"),
        ("const [onboardingOculto, setOnboardingOculto] = useState(false)", "const [onboardingOculto, setOnboardingOculto] = useState(inicial?.onboardingOculto ?? false)"),
        ("const [perfil, setPerfil] = useState(null)", "const [perfil, setPerfil] = useState(inicial?.perfil ?? null)"),
        ("const [suscripcion, setSuscripcion] = useState(null)", "const [suscripcion, setSuscripcion] = useState(inicial?.suscripcion ?? null)"),
    ]
    bloque_grafico = re.search(r"[ \t]*<ResponsiveContainer>.*?</ResponsiveContainer>", t, flags=re.S)
    piezas = {
        'import de react': "import { useEffect, useState } from 'react'",
        'import de recharts': "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'\n",
        'empresaId': "  const { id: empresaId } = useParams()\n",
        'setCargando(true)': "      setCargando(true)\n",
        'saludo': "  const saludo = saludoDeBoli({",
    }
    faltan = [k for k, v in piezas.items() if t.count(v) != 1] + [v[0][:40] for v in estados if t.count(v[0]) != 1] + ([] if bloque_grafico else ['gráfico'])
    if faltan:
        print('! EmpresaDashboard.jsx: no encontré ' + ', '.join(faltan) + ' (no lo toqué)')
    else:
        t = t.replace(piezas['import de react'], "import { lazy, Suspense, useEffect, useState } from 'react'", 1)
        t = t.replace(piezas['import de recharts'], '', 1)
        # carga diferida del gráfico + caché en memoria, después del último import
        ultimo_import = list(re.finditer(r"^import .*$", t, flags=re.M))[-1]
        extra = """

const GraficoVentas = lazy(() => import('../components/GraficoVentas'))

// Lo último que vio cada negocio en Inicio. Al volver se muestra al instante y se actualiza detrás.
const CACHE_INICIO = new Map()
supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') CACHE_INICIO.clear()
})"""
        t = t[:ultimo_import.end()] + extra + t[ultimo_import.end():]
        t = t.replace(piezas['empresaId'], piezas['empresaId'] + "  const inicial = CACHE_INICIO.get(empresaId)\n", 1)
        for viejo, nuevo in estados:
            t = t.replace(viejo, nuevo, 1)
        t = t.replace(piezas['setCargando(true)'], "      if (!CACHE_INICIO.has(empresaId)) setCargando(true)\n", 1)
        guardar = """  // Guarda lo que se ve para la próxima vez que se abra Inicio
  useEffect(() => {
    if (cargando || error) return
    CACHE_INICIO.set(empresaId, {
      empresa, kpis, cambioPorcentual, ultimasVentas, stockBajo, datosGrafico, porVencer,
      ventasHoy, totalVentasHistorico, onboardingOculto, perfil, suscripcion,
    })
  }, [cargando, error, empresaId, empresa, kpis, cambioPorcentual, ultimasVentas, stockBajo, datosGrafico, porVencer, ventasHoy, totalVentasHistorico, onboardingOculto, perfil, suscripcion])

"""
        t = t.replace(piezas['saludo'], guardar + piezas['saludo'], 1)
        b = bloque_grafico.group(0)
        sangria = re.match(r"[ \t]*", b).group(0)
        t = t.replace(b, f"{sangria}<Suspense fallback={{<div style={{{{ height: 220 }}}} />}}>\n{sangria}  <GraficoVentas data={{datosGrafico}} />\n{sangria}</Suspense>", 1)
        escribir(dash, t)
        print('✓ EmpresaDashboard.jsx: caché de Inicio y gráfico aparte')

# ───────────────────────── 3. Letra propia ─────────────────────────
html = pathlib.Path('index.html')
fuentes_css = src / 'styles' / 'fuentes.css'
if html.exists() and fuentes_css.exists() and pathlib.Path('public/fonts/inter-regular.woff').exists():
    h = leer(html)
    if 'fonts/inter-regular.woff' in h:
        print('· index.html ya usa la letra propia')
    else:
        n = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*/>', '', h)
        n = re.sub(r'\s*<link\s+href="https://fonts\.googleapis\.com/css2[^"]*"\s+rel="stylesheet"\s*/>', '', n)
        precarga = ('    <link rel="preload" href="/fonts/inter-regular.woff" as="font" type="font/woff" crossorigin />\n'
                    '    <link rel="preload" href="/fonts/inter-semibold.woff" as="font" type="font/woff" crossorigin />\n')
        n = re.sub(r'[ \t]*</head>', lambda _: precarga + '  </head>', n, count=1)
        escribir(html, n)
        print('✓ index.html: letra propia (sin Google Fonts)')
    m = src / 'main.jsx'
    mt = leer(m)
    if 'fuentes.css' not in mt:
        mt = mt.replace("import './index.css'\n", "import './index.css'\nimport './styles/fuentes.css'\n", 1)
        escribir(m, mt); print('✓ main.jsx: fuentes cargadas')
else:
    print('· Letra propia: faltan src/styles/fuentes.css o public/fonts (aplica antes el paso de la landing). No se cambió.')

# ───────────────────────── 4. Caché largo ─────────────────────────
vj = pathlib.Path('vercel.json')
cfg = json.loads(leer(vj)) if vj.exists() else {}
if 'headers' in cfg:
    print('· vercel.json ya tenía encabezados')
else:
    largo = [{'key': 'Cache-Control', 'value': 'public, max-age=31536000, immutable'}]
    medio = [{'key': 'Cache-Control', 'value': 'public, max-age=604800, stale-while-revalidate=86400'}]
    cfg.setdefault('rewrites', [{'source': '/(.*)', 'destination': '/index.html'}])
    cfg['headers'] = [
        {'source': '/assets/(.*)', 'headers': largo},
        {'source': '/fonts/(.*)', 'headers': largo},
        {'source': '/boli/(.*)', 'headers': medio},
        {'source': '/icons/(.*)', 'headers': medio},
        {'source': '/demo/(.*)', 'headers': medio},
        {'source': '/rubros/(.*)', 'headers': medio},
    ]
    escribir(vj, json.dumps(cfg, indent=2, ensure_ascii=False) + '\n')
    print('✓ vercel.json: caché largo')

# ───────────────────────── 5. Catálogo sin recargar toda la página ─────────────────────────
ce = src / 'pages' / 'CatalogoEditor.jsx'
t = leer(ce)
if 'useNavigate' in t:
    print('· CatalogoEditor.jsx ya estaba')
else:
    a = "window.location.href = `/empresas/${empresaId}/catalogos`"
    b = "window.location.href = `/empresas/${empresaId}/catalogos/${data}`"
    imp = "import { useParams, Link } from 'react-router-dom'"
    uso = re.search(r"^(\s*)const \{ id: empresaId, catalogoId \} = useParams\(\)\n", t, flags=re.M)
    if t.count(a) != 1 or t.count(b) != 1 or t.count(imp) != 1 or not uso:
        print('! CatalogoEditor.jsx: no encontré lo esperado (no lo toqué)')
    else:
        t = t[:uso.end()] + f"{uso.group(1)}const navegar = useNavigate()\n" + t[uso.end():]
        t = t.replace(a, "navegar(`/empresas/${empresaId}/catalogos`)", 1)
        t = t.replace(b, "navegar(`/empresas/${empresaId}/catalogos/${data}`)", 1)
        t = t.replace(imp, "import { useNavigate, useParams, Link } from 'react-router-dom'", 1)
        escribir(ce, t)
        print('✓ CatalogoEditor.jsx: sin recarga completa')

print('Listo.')
