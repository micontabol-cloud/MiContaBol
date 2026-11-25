#!/usr/bin/env python3
"""MiContaBol · Inicio con UNA sola consulta (paso 13).

Al entrar a Inicio salían ~19 consultas al servidor a la vez (12 del panel + 7 de la guía de primeros
pasos). Ahora sale una sola: la función `inicio_paquete` (archivo inicio_paquete.sql, se pega en
Supabase → SQL Editor). Si esa función todavía no existe, la app usa el camino de antes y funciona igual.

Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_inicio.py
"""
import re, sys, pathlib

src = pathlib.Path('src')
dash = src / 'pages' / 'EmpresaDashboard.jsx'
chk = src / 'components' / 'OnboardingChecklist.jsx'
if not dash.exists() or not chk.exists():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')

def leer(p): return pathlib.Path(p).read_text(encoding='utf-8')
def escribir(p, t): pathlib.Path(p).write_text(t, encoding='utf-8')

def cambiar(t, pasos, nombre):
    for desc, viejo, nuevo in pasos:
        if t.count(viejo) != 1:
            print(f'! {nombre}: no encontré «{desc}» (no toqué este archivo)')
            return None
        t = t.replace(viejo, nuevo, 1)
    return t

LIB = r"""import { supabase } from '../supabaseClient'

// Cuántos hay de cada cosa para la guía de primeros pasos (viene en el mismo paquete de Inicio).
export const conteosInicio = new Map()

// Pide todo lo de Inicio en UNA sola consulta. Devuelve lo mismo, en el mismo orden, que las 12
// consultas de antes. Si la función aún no existe en la base de datos (o falla), usa `respaldo`,
// que es el camino de antes: más lento, pero funciona.
export async function cargarInicio(empresaId, fechas, respaldo) {
  try {
    const { data, error } = await supabase.rpc('inicio_paquete', {
      p_empresa_id: empresaId,
      p_inicio_mes: fechas.inicioMes,
      p_seis_meses: fechas.seisMesesAtras,
      p_hoy: fechas.hoy,
    })
    if (!error && data && data.empresa) {
      conteosInicio.set(empresaId, { ...data.onboarding, ventas: data.total_ventas })
      return [
        { data: data.empresa, error: null },
        { data: data.plan_cuentas, error: null },
        { data: data.libro_mes, error: null },
        { count: data.productos_activos, error: null },
        { data: data.ventas_clientes, error: null },
        { data: data.balance, error: null },
        { data: data.ultimas_ventas, error: null },
        { data: data.stock_bajo, error: null },
        { data: data.ventas_6m, error: null },
        { data: data.lotes, error: null },
        { data: data.ventas_hoy, error: null },
        { count: data.total_ventas, error: null },
      ]
    }
  } catch {
    /* sigue con el camino de antes */
  }
  conteosInicio.delete(empresaId)
  return respaldo()
}
"""
escribir(src / 'lib' / 'inicioPaquete.js', LIB)
print('✓ src/lib/inicioPaquete.js')

# ───────── EmpresaDashboard ─────────
t = leer(dash)
if 'inicioPaquete' in t:
    print('· EmpresaDashboard.jsx ya estaba')
else:
    n = cambiar(t, [
     ('import de la guía', "import OnboardingChecklist from '../components/OnboardingChecklist'\n",
      "import OnboardingChecklist from '../components/OnboardingChecklist'\nimport { cargarInicio, conteosInicio } from '../lib/inicioPaquete'\n"),
     ('inicio de las consultas', "] = await Promise.all([\n        supabase.from('empresas').select('*').eq('id', empresaId).single(),\n",
      "] = await cargarInicio(empresaId, { inicioMes, seisMesesAtras, hoy: hoy.toISOString().slice(0, 10) }, () => Promise.all([\n        supabase.from('empresas').select('*').eq('id', empresaId).single(),\n"),
     ('fin de las consultas', "          .eq('tipo', 'venta'),\n      ])\n\n      if (empRes.error) {",
      "          .eq('tipo', 'venta'),\n      ]))\n\n      if (empRes.error) {"),
     ('guía de primeros pasos', "<OnboardingChecklist empresa={empresa} onOcultar={() => setOnboardingOculto(true)} />",
      "<OnboardingChecklist empresa={empresa} conteos={conteosInicio.get(empresaId)} onOcultar={() => setOnboardingOculto(true)} />"),
    ], 'EmpresaDashboard.jsx')
    if n is not None:
        escribir(dash, n); print('✓ EmpresaDashboard.jsx')

# ───────── OnboardingChecklist ─────────
t = leer(chk)
if 'conteos' in t:
    print('· OnboardingChecklist.jsx ya estaba')
else:
    n = cambiar(t, [
     ('firma', "export default function OnboardingChecklist({ empresa, onOcultar }) {",
      "export default function OnboardingChecklist({ empresa, onOcultar, conteos }) {"),
     ('inicio del cálculo', "  useEffect(() => {\n    async function calcular() {\n",
      "  useEffect(() => {\n"
      "    // Si Inicio ya trajo los conteos, no se vuelve a preguntar nada al servidor.\n"
      "    if (conteos) {\n"
      "      setEstado({\n"
      "        productos: (conteos.productos || 0) > 0,\n"
      "        ventas: (conteos.ventas || 0) > 0,\n"
      "        clientes: (conteos.clientes || 0) > 0,\n"
      "        bancos: (conteos.bancos || 0) > 0,\n"
      "        equipo: (conteos.miembros || 0) > 1,\n"
      "        catalogo: (conteos.catalogos || 0) > 0,\n"
      "        compras: (conteos.compras || 0) > 0,\n"
      "      })\n"
      "      return\n"
      "    }\n"
      "    // Inicio todavía está cargando: se espera para no preguntar de más.\n"
      "    if (!empresa) return\n"
      "    async function calcular() {\n"),
     ('fin del efecto', "    calcular()\n  }, [empresaId])\n", "    calcular()\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [empresaId, conteos, empresa?.id])\n"),
    ], 'OnboardingChecklist.jsx')
    if n is not None:
        escribir(chk, n); print('✓ OnboardingChecklist.jsx')
print('Listo. Falta pegar inicio_paquete.sql en Supabase → SQL Editor (hasta entonces la app usa el camino de antes).')
