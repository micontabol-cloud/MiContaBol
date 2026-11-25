#!/usr/bin/env python3
"""MiContaBol · entrar más rápido (paso 12).

Desde que tocas "Ingresar" hasta ver Inicio había unas 7 esperas una detrás de otra al servidor.

1. "Mis empresas": pedía 4 cosas en fila (membresía, si eres admin, cupo, pagos pendientes).
   Ahora pide las 3 necesarias a la vez, el contador de pagos pendientes ya no hace esperar a
   nadie, y recuerda la última lista para mostrarla al instante la próxima vez.
2. Rol en el negocio: se recuerda, así el menú aparece completo desde el primer momento
   (antes salía incompleto hasta que llegaba la respuesta).
3. Mientras escribes tu clave se baja en silencio la pantalla que sigue; y mientras eliges tu
   negocio, Inicio y su gráfico.

Requiere haber aplicado antes aplicar_datos.py (usa src/lib/datos.js).
Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_entrada.py
"""
import re, sys, pathlib

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

def parchar(ruta, marca, pasos):
    p = src / ruta
    t = leer(p)
    if marca in t:
        print(f'· {ruta} ya estaba'); return
    n = cambiar(t, pasos, ruta)
    if n is not None:
        escribir(p, n); print(f'✓ {ruta}')

# ───────────────────────── Mis empresas ─────────────────────────
parchar('pages/MisEmpresas.jsx', 'lib/datos', [
 ('imports', "import { useAuth } from '../contexts/AuthContext'\n",
             "import { useAuth } from '../contexts/AuthContext'\nimport { leerCache, guardarCache } from '../lib/datos'\n"),
 ('carga de datos',
  """      const { data, error } = await supabase
        .from('miembros_empresa')
        .select('rol, empresas(*)')
        .eq('usuario_id', session.user.id)

      if (!error) {
        setEmpresas(data.map((m) => ({ ...m.empresas, rol: m.rol })))
      }

      const { data: admin } = await supabase.rpc('soy_super_admin')
      setEsAdmin(!!admin)

      const { data: c } = await supabase.rpc('mi_cupo_empresas')
      setCupo(c)

      if (admin) {
        const { data: n } = await supabase.rpc('contar_pagos_pendientes')
        setPagosPendientes(n || 0)
      }

      setCargando(false)
    }
""",
  """      // Lo último que viste sale al instante y se actualiza por detrás.
      const clave = 'misEmpresas'
      const guardado = await leerCache(clave)
      if (guardado) {
        setEmpresas(guardado.empresas)
        setEsAdmin(guardado.esAdmin)
        setCupo(guardado.cupo)
        setCargando(false)
      }

      // Las tres cosas se piden a la vez (antes eran una detrás de otra).
      const [miembrosRes, adminRes, cupoRes] = await Promise.all([
        supabase.from('miembros_empresa').select('rol, empresas(*)').eq('usuario_id', session.user.id),
        supabase.rpc('soy_super_admin'),
        supabase.rpc('mi_cupo_empresas'),
      ])

      const nuevas = miembrosRes.error ? null : miembrosRes.data.map((m) => ({ ...m.empresas, rol: m.rol }))
      const admin = !!adminRes.data
      if (nuevas) setEmpresas(nuevas)
      setEsAdmin(admin)
      setCupo(cupoRes.data)
      if (nuevas) guardarCache(clave, { empresas: nuevas, esAdmin: admin, cupo: cupoRes.data })
      setCargando(false)

      // El contador de pagos pendientes llega cuando llegue: ya no hace esperar a nadie.
      if (admin) supabase.rpc('contar_pagos_pendientes').then(({ data: n }) => setPagosPendientes(n || 0))
    }
"""),
 ('aviso para bajar lo siguiente',
  "  const [cargando, setCargando] = useState(true)\n",
  """  const [cargando, setCargando] = useState(true)

  // Mientras eliges tu negocio se baja en silencio la pantalla de Inicio y su gráfico.
  useEffect(() => {
    const t = setTimeout(() => {
      import('./EmpresaDashboard')
__GRAFICO__    }, 600)
    return () => clearTimeout(t)
  }, [])
""".replace('__GRAFICO__', "      import('../components/GraficoVentas')\n" if (src / 'components' / 'GraficoVentas.jsx').exists() else '')),
])

# ───────────────────────── Rol en el negocio ─────────────────────────
parchar('contexts/RolContext.jsx', 'lib/datos', [
 ('imports', "import { supabase } from '../supabaseClient'\n",
             "import { supabase } from '../supabaseClient'\nimport { leerCache, guardarCache } from '../lib/datos'\n"),
 ('carga del rol',
  """      setCargando(true)
      const { data } = await supabase.rpc('rol_en_empresa', { p_empresa_id: empresaId })
      if (!cancelado) {
        setRol(data || null)
        setCargando(false)
      }
    }
""",
  """      // El rol casi nunca cambia: se recuerda para que el menú salga completo al instante.
      const clave = `rol:${empresaId}`
      const guardado = await leerCache(clave)
      if (cancelado) return
      if (guardado && guardado.rol) {
        setRol(guardado.rol)
        setCargando(false)
      } else {
        setCargando(true)
      }
      const { data } = await supabase.rpc('rol_en_empresa', { p_empresa_id: empresaId })
      if (!cancelado) {
        setRol(data || null)
        setCargando(false)
      }
      if (data) guardarCache(clave, { rol: data })
    }
"""),
])

# ───────────────────────── Login: bajar lo siguiente mientras escribes ─────────────────────────
p = src / 'pages' / 'Login.jsx'
t = leer(p)
if "import('./MisEmpresas')" in t:
    print('· pages/Login.jsx ya estaba')
else:
    pasos = [
     ('import de react', "import { useState } from 'react'\n", "import { useEffect, useState } from 'react'\n"),
     ('navigate', "  const navigate = useNavigate()\n",
      "  const navigate = useNavigate()\n\n  // Mientras escribes tu clave, se baja en silencio la pantalla que sigue.\n  useEffect(() => {\n    const t = setTimeout(() => import('./MisEmpresas'), 300)\n    return () => clearTimeout(t)\n  }, [])\n"),
    ]
    n = cambiar(t, pasos, 'pages/Login.jsx')
    if n is not None:
        escribir(p, n); print('✓ pages/Login.jsx')
print('Listo.')
