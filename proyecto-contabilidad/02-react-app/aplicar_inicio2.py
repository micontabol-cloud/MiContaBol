#!/usr/bin/env python3
"""MiContaBol · Inicio: perfil y plan salen a la vez que todo lo demás (paso 14).

Medición real: "mi perfil" y "mi plan" se pedían recién cuando terminaba la consulta principal de
Inicio (a los 744 ms) y tardaban otros ~650 ms. Ahora salen al mismo tiempo: el nombre en el saludo
de Boli y el plan aparecen ~0,6 s antes.

Se puede correr varias veces. Uso:  cd 02-react-app && python3 aplicar_inicio2.py
"""
import sys, pathlib

p = pathlib.Path('src/pages/EmpresaDashboard.jsx')
if not p.exists():
    sys.exit('Corre esto dentro de la carpeta 02-react-app (donde está la carpeta src).')
t = p.read_text(encoding='utf-8')

llamadas = (
    "      supabase.rpc('mi_perfil').then(({ data }) => setPerfil(data))\n"
    "      supabase.rpc('mi_suscripcion').then(({ data }) => setSuscripcion(data))\n"
)
marca = "      // perfil y plan salen a la vez que lo demás\n"
destino = "      setError(null)\n\n      const hoy = new Date()\n"

if marca in t:
    print('· EmpresaDashboard.jsx ya estaba')
elif t.count(llamadas) != 1 or t.count(destino) != 1:
    print('! EmpresaDashboard.jsx: no encontré lo esperado (no lo toqué)')
else:
    t = t.replace(llamadas, '', 1)
    t = t.replace(destino, "      setError(null)\n\n" + marca + llamadas + "\n      const hoy = new Date()\n", 1)
    p.write_text(t, encoding='utf-8')
    print('✓ EmpresaDashboard.jsx: perfil y plan salen a la vez')
