#!/usr/bin/env python3
"""MiContaBol · pantallas más rápidas (paso 11), con el mismo método que LecheTrack.

1. Listas largas completas: Supabase entrega máximo 1.000 filas por consulta y algunas listas se
   cortaban sin avisar. Ahora, si hay más de 1.000, las páginas siguientes se piden todas juntas.
2. Recordar lo último que viste: Ventas, Clientes, Productos e Inventario guardan lo último que
   mostraron (en tu aparato, por usuario). La segunda vez la pantalla aparece al instante y se
   actualiza por detrás, con el aviso "Actualizando…". Lo guardado de otro día, o muy pesado, no se usa.
   Al cerrar sesión se borra todo.
3. Ventas: arregla un error que ya existía: al anular una venta la lista no se actualizaba
   (la función de carga estaba escondida dentro de otra y no se podía llamar).

Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_datos.py
"""
import re, sys, pathlib

src = pathlib.Path('src')
if not (src / 'pages').is_dir():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

def leer(p): return pathlib.Path(p).read_text(encoding='utf-8')
def escribir(p, t): pathlib.Path(p).write_text(t, encoding='utf-8')

# ───────────────────────── Biblioteca común ─────────────────────────
DATOS = r"""import { useSyncExternalStore } from 'react'
import { supabase } from '../supabaseClient'

// ── Listas completas ─────────────────────────────────────────────────────────
// Supabase entrega máximo 1.000 filas por consulta. Si una lista tiene más, antes se cortaba
// sin avisar. Aquí se pide la primera página y, solo si venía llena, las siguientes de a cuatro
// a la vez. `construir` debe devolver una consulta NUEVA cada vez y con un orden estable
// (termina el orden con una columna única, como id).
export async function traerTodo(construir, tam = 1000) {
  const primera = await construir().range(0, tam - 1)
  if (primera.error || !primera.data || primera.data.length < tam) return primera
  let filas = primera.data
  let pagina = 1
  for (;;) {
    const tanda = await Promise.all(
      [0, 1, 2, 3].map((i) => construir().range((pagina + i) * tam, (pagina + i + 1) * tam - 1))
    )
    for (const r of tanda) {
      if (r.error) return { data: filas, error: r.error }
      filas = filas.concat(r.data || [])
      if (!r.data || r.data.length < tam) return { data: filas, error: null }
    }
    pagina += 4
  }
}

// ── Recordar lo último que viste ─────────────────────────────────────────────
const PREFIJO = 'mcb_c1:'
const MAX_CARACTERES = 600 * 1024

function hoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function usuarioId() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.id || null
  } catch {
    return null
  }
}

export async function leerCache(clave) {
  try {
    const uid = await usuarioId()
    if (!uid) return null
    const txt = localStorage.getItem(`${PREFIJO}${uid}:${clave}`)
    if (!txt) return null
    const g = JSON.parse(txt)
    return g && g.dia === hoy() ? g.datos : null // de otro día: no sirve
  } catch {
    return null
  }
}

export async function guardarCache(clave, datos) {
  try {
    const uid = await usuarioId()
    if (!uid) return
    const llave = `${PREFIJO}${uid}:${clave}`
    const txt = JSON.stringify({ dia: hoy(), datos })
    if (txt.length > MAX_CARACTERES) {
      localStorage.removeItem(llave) // muy pesado: mejor no guardar
      return
    }
    localStorage.setItem(llave, txt)
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue igual, solo sin recordar */
  }
}

export function limpiarCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* nada */
  }
}

supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') limpiarCache()
})

// ── Aviso "Actualizando…" ────────────────────────────────────────────────────
let contador = 0
let vigilante = null
const oyentes = new Set()
const avisar = () => oyentes.forEach((f) => f())

export function actualizando(encendido) {
  contador = Math.max(0, contador + (encendido ? 1 : -1))
  clearTimeout(vigilante)
  // Por si una carga se cae a medias: el aviso no se queda pegado para siempre.
  if (contador > 0) vigilante = setTimeout(() => { contador = 0; avisar() }, 30000)
  avisar()
}

export function useActualizando() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => contador > 0
  )
}
"""

CHIP = r"""import { useActualizando } from '../lib/datos'

// Aviso chico mientras la pantalla se refresca con datos nuevos por detrás.
export default function ChipActualizando() {
  const activo = useActualizando()
  if (!activo) return null
  return (
    <div className="chip-actualizando" role="status" aria-live="polite">
      Actualizando…
    </div>
  )
}
"""

CSS = '''

/* ── Aviso "Actualizando…" ───────────────────────────────────────────────── */
.chip-actualizando {
  position: fixed;
  top: 0.8rem;
  right: 0.9rem;
  z-index: 70;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: var(--color-navy);
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(15, 26, 41, 0.25);
  pointer-events: none;
}
@media (max-width: 860px) {
  .chip-actualizando {
    top: calc(3.9rem + env(safe-area-inset-top, 0px));
  }
}
'''

escribir(src / 'lib' / 'datos.js', DATOS)
escribir(src / 'components' / 'ChipActualizando.jsx', CHIP)
print('✓ src/lib/datos.js y ChipActualizando.jsx')

css = src / 'index.css'
c = leer(css)
if 'chip-actualizando' not in c:
    escribir(css, c + CSS)
    print('✓ index.css: aviso Actualizando')

# ───────────────────────── Utilidades de parche ─────────────────────────
def cambiar(t, pasos, nombre):
    """Aplica todos los cambios o ninguno. pasos = [(descripcion, viejo, nuevo)]"""
    for desc, viejo, nuevo in pasos:
        if t.count(viejo) != 1:
            print(f'! {nombre}: no encontré «{desc}» (no toqué este archivo)')
            return None
        t = t.replace(viejo, nuevo, 1)
    return t

IMPORT_DATOS = "import { supabase } from '../supabaseClient'\n"
IMPORT_DATOS_NUEVO = IMPORT_DATOS + "import { traerTodo, leerCache, guardarCache, actualizando } from '../lib/datos'\n"

def parchar(nombre, pasos):
    p = src / 'pages' / nombre
    t = leer(p)
    if 'lib/datos' in t:
        print(f'· {nombre} ya estaba'); return
    n = cambiar(t, pasos, nombre)
    if n is not None:
        escribir(p, n); print(f'✓ {nombre}')

# ───────────────────────── EmpresaLayout: aviso ─────────────────────────
p = src / 'pages' / 'EmpresaLayout.jsx'
t = leer(p)
if 'ChipActualizando' in t:
    print('· EmpresaLayout.jsx ya estaba')
elif len(re.findall(r'^[ \t]*<Outlet />', t, flags=re.M)) != 1:
    print('! EmpresaLayout.jsx: no encontré <Outlet /> (no toqué este archivo: no se verá el aviso)')
else:
    t = re.sub(r'^([ \t]*)<Outlet />', r'\1<ChipActualizando />\n\1<Outlet />', t, count=1, flags=re.M)
    t = "import ChipActualizando from '../components/ChipActualizando'\n" + t
    escribir(p, t); print('✓ EmpresaLayout.jsx: aviso Actualizando')

# ───────────────────────── Ventas ─────────────────────────
parchar('Ventas.jsx', [
 ('import supabase', IMPORT_DATOS, IMPORT_DATOS_NUEVO),
 ('inicio de cargar',
  "  useEffect(() => {\n    async function cargar() {\n      const hoy = new Date()\n",
  "  async function cargar(opc = {}) {\n"
  "      const clave = `ventas:${empresaId}`\n"
  "      const guardado = opc.desdeCache ? await leerCache(clave) : null\n"
  "      if (guardado) {\n"
  "        setVentas(guardado.ventas)\n"
  "        setPorCobrar(guardado.porCobrar)\n"
  "        setTopProductos(guardado.topProductos)\n"
  "        setCargando(false)\n"
  "        actualizando(true)\n"
  "      }\n"
  "      const hoy = new Date()\n"),
 ('consulta de ventas',
  "        supabase\n          .from('comprobantes')\n          .select('*, comprobante_items(id)')\n          .eq('empresa_id', empresaId)\n          .eq('tipo', 'venta')\n          .order('fecha', { ascending: false })\n          .order('numero_interno', { ascending: false }),\n",
  "        traerTodo(() =>\n          supabase\n            .from('comprobantes')\n            .select('*, comprobante_items(id)')\n            .eq('empresa_id', empresaId)\n            .eq('tipo', 'venta')\n            .order('fecha', { ascending: false })\n            .order('numero_interno', { ascending: false })\n            .order('id', { ascending: false })\n        ),\n"),
 ('consulta de líneas',
  "        supabase\n          .from('comprobante_items')\n          .select('cantidad, precio_unitario, producto_id, productos(nombre), comprobantes!inner(fecha, tipo, empresa_id)')\n          .eq('comprobantes.empresa_id', empresaId)\n          .eq('comprobantes.tipo', 'venta')\n          .is('comprobantes.anulado_at', null)\n          .gte('comprobantes.fecha', inicioMes),\n",
  "        traerTodo(() =>\n          supabase\n            .from('comprobante_items')\n            .select('cantidad, precio_unitario, producto_id, productos(nombre), comprobantes!inner(fecha, tipo, empresa_id)')\n            .eq('comprobantes.empresa_id', empresaId)\n            .eq('comprobantes.tipo', 'venta')\n            .is('comprobantes.anulado_at', null)\n            .gte('comprobantes.fecha', inicioMes)\n            .order('id', { ascending: true })\n        ),\n"),
 ('guardar ventas y por cobrar',
  "      setVentas(ventasRes.data || [])\n      setPorCobrar((cxcRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005))\n",
  "      const porCobrarNuevo = (cxcRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005)\n      if (!ventasRes.error || !guardado) setVentas(ventasRes.data || [])\n      setPorCobrar(porCobrarNuevo)\n"),
 ('fin de cargar',
  "      setTopProductos([...porProducto.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5))\n\n      setCargando(false)\n    }\n    cargar()\n  }, [empresaId])\n",
  "      const topNuevo = [...porProducto.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5)\n      setTopProductos(topNuevo)\n\n"
  "      if (!ventasRes.error) guardarCache(clave, { ventas: ventasRes.data || [], porCobrar: porCobrarNuevo, topProductos: topNuevo })\n"
  "      if (guardado) actualizando(false)\n"
  "      setCargando(false)\n  }\n\n"
  "  useEffect(() => {\n    cargar({ desdeCache: true })\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [empresaId])\n"),
])

# ───────────────────────── Clientes ─────────────────────────
parchar('Clientes.jsx', [
 ('import supabase', IMPORT_DATOS, IMPORT_DATOS_NUEVO),
 ('inicio de cargar',
  "  async function cargar() {\n    setCargando(true)\n    const [{ data: cl, error: errCl }, { data: v }, { data: c }] = await Promise.all([\n      supabase.from('clientes').select('*').eq('empresa_id', empresaId).order('nombre'),\n",
  "  async function cargar(opc = {}) {\n"
  "    const clave = `clientes:${empresaId}`\n"
  "    const guardado = opc.desdeCache ? await leerCache(clave) : null\n"
  "    if (guardado) {\n"
  "      setClientes(guardado.clientes)\n"
  "      setResumen(new Map(guardado.resumen))\n"
  "      setCxc(guardado.cxc)\n"
  "      setCargando(false)\n"
  "      actualizando(true)\n"
  "    } else {\n"
  "      setCargando(true)\n"
  "    }\n"
  "    const [{ data: cl, error: errCl }, { data: v }, { data: c }] = await Promise.all([\n"
  "      traerTodo(() => supabase.from('clientes').select('*').eq('empresa_id', empresaId).order('nombre').order('id')),\n"),
 ('guardar clientes',
  "    if (errCl) setError(errCl.message)\n    setClientes(cl || [])\n    setResumen(new Map((v || []).map((r) => [r.cliente_id, r])))\n    setCxc(c || [])\n    setCargando(false)\n  }\n",
  "    if (errCl) setError(errCl.message)\n    if (!errCl || !guardado) setClientes(cl || [])\n    const resumenNuevo = (v || []).map((r) => [r.cliente_id, r])\n    setResumen(new Map(resumenNuevo))\n    setCxc(c || [])\n"
  "    if (!errCl) guardarCache(clave, { clientes: cl || [], resumen: resumenNuevo, cxc: c || [] })\n"
  "    if (guardado) actualizando(false)\n"
  "    setCargando(false)\n  }\n"),
 ('llamada al abrir',
  "  useEffect(() => {\n    cargar()\n",
  "  useEffect(() => {\n    cargar({ desdeCache: true })\n"),
])

# ───────────────────────── Productos ─────────────────────────
parchar('Productos.jsx', [
 ('import supabase', IMPORT_DATOS, IMPORT_DATOS_NUEVO),
 ('inicio de cargar',
  "  async function cargar() {\n    setCargando(true)\n    const [prodRes, catRes, ctasRes, empRes, varRes] = await Promise.all([\n      supabase.from('productos').select('*').eq('empresa_id', empresaId).is('eliminado_at', null).order('codigo'),\n",
  "  function aplicarEmpresa(e) {\n"
  "    if (!e) return\n"
  "    setCuentaVentas(e.cuenta_ventas_id || '')\n"
  "    setCuentaCosto(e.cuenta_costo_ventas_id || '')\n"
  "    setCuentaInventario(e.cuenta_inventario_id || '')\n"
  "    setCuentaCxc(e.cuenta_cxc_id || '')\n"
  "    setCuentaCxp(e.cuenta_cxp_id || '')\n"
  "    setEdRubro(e.rubro || 'otro')\n"
  "    setEdUsaVenc(!!e.usa_vencimiento)\n"
  "  }\n\n"
  "  async function cargar(opc = {}) {\n"
  "    const clave = `productos:${empresaId}`\n"
  "    const guardado = opc.desdeCache ? await leerCache(clave) : null\n"
  "    if (guardado) {\n"
  "      setProductos(guardado.productos)\n"
  "      setCategorias(guardado.categorias)\n"
  "      setCuentas(guardado.cuentas)\n"
  "      setEmpresa(guardado.empresa)\n"
  "      aplicarEmpresa(guardado.empresa)\n"
  "      setCargando(false)\n"
  "      actualizando(true)\n"
  "    } else {\n"
  "      setCargando(true)\n"
  "    }\n"
  "    const [prodRes, catRes, ctasRes, empRes, varRes] = await Promise.all([\n"
  "      traerTodo(() => supabase.from('productos').select('*').eq('empresa_id', empresaId).is('eliminado_at', null).order('codigo').order('id')),\n"),
 ('lista de productos',
  "    setProductos(\n      (prodRes.data || []).map((p) => ({\n        ...p,\n        stock_total: stockPorProducto.get(p.id)?.stock ?? Number(p.stock_actual),\n        tiene_stock_bajo: stockPorProducto.get(p.id)?.bajo ?? false,\n      }))\n    )\n",
  "    const productosNuevos = (prodRes.data || []).map((p) => ({\n      ...p,\n      stock_total: stockPorProducto.get(p.id)?.stock ?? Number(p.stock_actual),\n      tiene_stock_bajo: stockPorProducto.get(p.id)?.bajo ?? false,\n    }))\n    if (!prodRes.error || !guardado) setProductos(productosNuevos)\n"),
 ('fin de cargar',
  "    if (empRes.data) {\n      setCuentaVentas(empRes.data.cuenta_ventas_id || '')\n      setCuentaCosto(empRes.data.cuenta_costo_ventas_id || '')\n      setCuentaInventario(empRes.data.cuenta_inventario_id || '')\n      setCuentaCxc(empRes.data.cuenta_cxc_id || '')\n      setCuentaCxp(empRes.data.cuenta_cxp_id || '')\n      setEdRubro(empRes.data.rubro || 'otro')\n      setEdUsaVenc(!!empRes.data.usa_vencimiento)\n    }\n    setCargando(false)\n  }\n",
  "    aplicarEmpresa(empRes.data)\n"
  "    if (!prodRes.error) guardarCache(clave, { productos: productosNuevos, categorias: catRes.data || [], cuentas: ctasRes.data || [], empresa: empRes.data })\n"
  "    if (guardado) actualizando(false)\n"
  "    setCargando(false)\n  }\n"),
 ('llamada al abrir',
  "  useEffect(() => {\n    cargar()\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [empresaId])\n",
  "  useEffect(() => {\n    cargar({ desdeCache: true })\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [empresaId])\n"),
])

# ───────────────────────── Inventario ─────────────────────────
parchar('Inventario.jsx', [
 ('import supabase', IMPORT_DATOS, IMPORT_DATOS_NUEVO),
 ('inicio de cargar',
  "    async function cargar() {\n      setCargando(true)\n      const [stockRes, actRes, catRes, recRes] = await Promise.all([\n",
  "    async function cargar() {\n"
  "      const clave = `inventario:${empresaId}`\n"
  "      const guardado = await leerCache(clave)\n"
  "      if (guardado) {\n"
  "        setStock(guardado.stock)\n"
  "        setActividad(new Map(guardado.actividad))\n"
  "        setNumCategorias(guardado.numCategorias)\n"
  "        setRecientes(guardado.recientes)\n"
  "        setCargando(false)\n"
  "        actualizando(true)\n"
  "      } else {\n"
  "        setCargando(true)\n"
  "      }\n"
  "      const [stockRes, actRes, catRes, recRes] = await Promise.all([\n"),
 ('fin de cargar',
  "      setStock(stockRes.data || [])\n      setActividad(new Map((actRes.data || []).map((a) => [a.producto_id, a])))\n      setNumCategorias(catRes.count || 0)\n      setRecientes(recRes.data || [])\n      setCargando(false)\n",
  "      const actividadNueva = (actRes.data || []).map((a) => [a.producto_id, a])\n"
  "      if (!stockRes.error || !guardado) setStock(stockRes.data || [])\n"
  "      setActividad(new Map(actividadNueva))\n      setNumCategorias(catRes.count || 0)\n      setRecientes(recRes.data || [])\n"
  "      if (!stockRes.error) guardarCache(clave, { stock: stockRes.data || [], actividad: actividadNueva, numCategorias: catRes.count || 0, recientes: recRes.data || [] })\n"
  "      if (guardado) actualizando(false)\n"
  "      setCargando(false)\n"),
])
print('Listo.')
