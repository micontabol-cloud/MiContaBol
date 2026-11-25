#!/usr/bin/env python3
"""MiContaBol · más pantallas rápidas (paso 15): Compras, Cuentas por cobrar y Cuentas por pagar.

Igual que Ventas y Clientes: la segunda vez que entras la pantalla aparece al instante con lo último
que viste y se actualiza por detrás ("Actualizando…"). Compras además trae la lista completa aunque
pase de 1.000 compras.

Requiere haber aplicado antes aplicar_datos.py.
Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_datos2.py
"""
import sys, pathlib

src = pathlib.Path('src')
if not (src / 'lib' / 'datos.js').exists():
    sys.exit('Falta src/lib/datos.js: aplica primero aplicar_datos.py.')

def leer(p): return pathlib.Path(p).read_text(encoding='utf-8')
def escribir(p, t): pathlib.Path(p).write_text(t, encoding='utf-8')

def cambiar(t, pasos, nombre):
    for desc, viejo, nuevo in pasos:
        if t.count(viejo) != 1:
            print(f'! {nombre}: no encontré «{desc}» (no toqué este archivo)')
            return None
        t = t.replace(viejo, nuevo, 1)
    return t

def parchar(nombre, pasos):
    p = src / 'pages' / nombre
    t = leer(p)
    if 'lib/datos' in t:
        print(f'· {nombre} ya estaba'); return
    n = cambiar(t, pasos, nombre)
    if n is not None:
        escribir(p, n); print(f'✓ {nombre}')

IMP = "import { supabase } from '../supabaseClient'\n"
IMP_COMPLETO = IMP + "import { traerTodo, leerCache, guardarCache, actualizando } from '../lib/datos'\n"
IMP_CORTO = IMP + "import { leerCache, guardarCache, actualizando } from '../lib/datos'\n"

# ───────── Compras ─────────
parchar('Compras.jsx', [
 ('import supabase', IMP, IMP_COMPLETO),
 ('inicio de cargar',
  "    async function cargar() {\n      const [comprasRes, cxpRes, stockRes] = await Promise.all([\n        supabase\n          .from('comprobantes')\n          .select('*, comprobante_items(id)')\n          .eq('empresa_id', empresaId)\n          .is('anulado_at', null)\n          .eq('tipo', 'compra')\n          .order('fecha', { ascending: false })\n          .order('numero_interno', { ascending: false }),\n",
  "    async function cargar() {\n"
  "      const clave = `compras:${empresaId}`\n"
  "      const guardado = await leerCache(clave)\n"
  "      if (guardado) {\n"
  "        setCompras(guardado.compras)\n"
  "        setPorPagar(guardado.porPagar)\n"
  "        setStock(guardado.stock)\n"
  "        setCargando(false)\n"
  "        actualizando(true)\n"
  "      }\n"
  "      const [comprasRes, cxpRes, stockRes] = await Promise.all([\n"
  "        traerTodo(() =>\n"
  "          supabase\n"
  "            .from('comprobantes')\n"
  "            .select('*, comprobante_items(id)')\n"
  "            .eq('empresa_id', empresaId)\n"
  "            .is('anulado_at', null)\n"
  "            .eq('tipo', 'compra')\n"
  "            .order('fecha', { ascending: false })\n"
  "            .order('numero_interno', { ascending: false })\n"
  "            .order('id', { ascending: false })\n"
  "        ),\n"),
 ('fin de cargar',
  "      if (comprasRes.error) setError(comprasRes.error.message)\n      setCompras(comprasRes.data || [])\n      setPorPagar((cxpRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005))\n      setStock(stockRes.data || [])\n      setCargando(false)\n",
  "      if (comprasRes.error) setError(comprasRes.error.message)\n"
  "      const porPagarNuevo = (cxpRes.data || []).filter((c) => Number(c.saldo_pendiente) > 0.005)\n"
  "      if (!comprasRes.error || !guardado) setCompras(comprasRes.data || [])\n"
  "      setPorPagar(porPagarNuevo)\n"
  "      setStock(stockRes.data || [])\n"
  "      if (!comprasRes.error) guardarCache(clave, { compras: comprasRes.data || [], porPagar: porPagarNuevo, stock: stockRes.data || [] })\n"
  "      if (guardado) actualizando(false)\n"
  "      setCargando(false)\n"),
])

# ───────── Cuentas por cobrar / por pagar (casi idénticas) ─────────
def cuentas_por(nombre, vista, clave_base):
    parchar(nombre, [
     ('import supabase', IMP, IMP_CORTO),
     ('inicio de cargar',
      f"  async function cargar() {{\n    setCargando(true)\n    const [{{ data: cxc, error: errCxc }}, {{ data: cts }}] = await Promise.all([\n      supabase.from('{vista}').select('*').eq('empresa_id', empresaId).order('fecha'),\n",
      "  async function cargar(opc = {}) {\n"
      f"    const clave = `{clave_base}:${{empresaId}}`\n"
      "    const guardado = opc.desdeCache ? await leerCache(clave) : null\n"
      "    if (guardado) {\n"
      "      setFilas(guardado.filas)\n"
      "      setCuentas(guardado.cuentas)\n"
      "      setCargando(false)\n"
      "      actualizando(true)\n"
      "    } else {\n"
      "      setCargando(true)\n"
      "    }\n"
      "    const [{ data: cxc, error: errCxc }, { data: cts }] = await Promise.all([\n"
      f"      supabase.from('{vista}').select('*').eq('empresa_id', empresaId).order('fecha'),\n"),
     ('fin de cargar',
      "    if (errCxc) setError(errCxc.message)\n    setFilas((cxc || []).filter((f) => f.saldo_pendiente > 0.005))\n    setCuentas((cts || []).filter((c) => c.tipo === 'activo'))\n    setCargando(false)\n  }\n",
      "    if (errCxc) setError(errCxc.message)\n"
      "    const filasNuevas = (cxc || []).filter((f) => f.saldo_pendiente > 0.005)\n"
      "    const cuentasNuevas = (cts || []).filter((c) => c.tipo === 'activo')\n"
      "    if (!errCxc || !guardado) setFilas(filasNuevas)\n"
      "    setCuentas(cuentasNuevas)\n"
      "    if (!errCxc) guardarCache(clave, { filas: filasNuevas, cuentas: cuentasNuevas })\n"
      "    if (guardado) actualizando(false)\n"
      "    setCargando(false)\n  }\n"),
     ('llamada al abrir', "  useEffect(() => {\n    cargar()\n", "  useEffect(() => {\n    cargar({ desdeCache: true })\n"),
    ])

cuentas_por('CuentasPorCobrar.jsx', 'vista_cuentas_por_cobrar', 'cxc')
cuentas_por('CuentasPorPagar.jsx', 'vista_cuentas_por_pagar', 'cxp')
print('Listo.')
