"""
MiContaBol · Boli (asistente con IA) — instalación en la app.

Cómo se usa (dentro de la carpeta 02-react-app, donde está package.json):

    python3 aplicar_boli.py

Antes de correrlo, la carpeta "src" de este zip ya debe estar copiada encima del
proyecto (son archivos nuevos). Este script solo hace los cambios chicos en
archivos que ya existían:

  - EmpresaLayout.jsx: pone a Boli en pantalla (se descarga solo cuando hace falta)
  - ios/.../Info.plist y android/.../AndroidManifest.xml: permisos del micrófono
    (solo si esas carpetas existen)

Se puede correr dos veces sin problema.
"""
import json
import pathlib
import sys

raiz = pathlib.Path(".").resolve()
src = raiz / "src"

if not (raiz / "package.json").exists() or not (src / "App.jsx").exists():
    sys.exit("No encuentro package.json ni src/App.jsx. Corré esto dentro de 02-react-app.")

faltan = [
    p
    for p in [
        "src/components/BoliAsistente.jsx",
        "src/styles/boli.css",
        "src/lib/boliVoz.js",
        "src/lib/vozNativa.js",
        "src/lib/plataforma.js",
        "src/components/BoliMascot.jsx",
        "public/boli/boli-hola.png",
    ]
    if not (raiz / p).exists()
]
if faltan:
    sys.exit(
        "Faltan estos archivos:\n  "
        + "\n  ".join(faltan)
        + "\n(Los de Boli vienen en este zip: copiá la carpeta src encima del proyecto."
        " Si falta public/boli/boli-hola.png, primero hay que aplicar el paso 3 de la página principal.)"
    )

avisos = []


def leer(ruta):
    return ruta.read_text(encoding="utf-8")


def guardar(ruta, texto):
    ruta.write_text(texto, encoding="utf-8")


# ── 1. EmpresaLayout.jsx: mostrar a Boli ────────────────────────────────────
ruta = src / "pages" / "EmpresaLayout.jsx"
t = leer(ruta)
if "BoliAsistente" in t:
    print("EmpresaLayout.jsx: ya estaba aplicado.")
else:
    imp_react = "import { Suspense, useEffect, useState } from 'react'"
    imp_rol = "import { RolProvider, useRol, puedeConfigurar, esAdmin } from '../contexts/RolContext'\n"
    cierre = "      </nav>\n    </div>\n  )\n}\n\nexport default function EmpresaLayout()"

    if t.count(imp_react) != 1 or t.count(imp_rol) != 1 or t.count(cierre) != 1:
        avisos.append(
            "EmpresaLayout.jsx no tiene la forma esperada. Agregá a mano: "
            "const BoliAsistente = lazy(() => import('../components/BoliAsistente')) y, al final de LayoutInterno, "
            "{!promotor && (<Suspense fallback={null}><BoliAsistente empresaId={id} /></Suspense>)}"
        )
    else:
        t = t.replace(imp_react, "import { Suspense, lazy, useEffect, useState } from 'react'")
        t = t.replace(
            imp_rol,
            imp_rol
            + "\n// Boli (asistente con IA) pesa poco, pero no hace falta para dibujar la pantalla:\n"
            "// se descarga aparte. Quién puede usarlo lo decide la base de datos.\n"
            "const BoliAsistente = lazy(() => import('../components/BoliAsistente'))\n",
        )
        t = t.replace(
            cierre,
            "      </nav>\n\n"
            "      {!promotor && (\n"
            "        <Suspense fallback={null}>\n"
            "          <BoliAsistente empresaId={id} />\n"
            "        </Suspense>\n"
            "      )}\n"
            "    </div>\n  )\n}\n\nexport default function EmpresaLayout()",
        )
        guardar(ruta, t)
        print("EmpresaLayout.jsx: Boli agregado.")

# ── 2. ¿Está instalado el plugin de voz de la app? ──────────────────────────
plugin = raiz / "node_modules" / "@capacitor-community" / "speech-recognition"
if not plugin.exists():
    mayor = ""
    try:
        mayor = json.loads(leer(raiz / "node_modules" / "@capacitor" / "core" / "package.json"))["version"].split(".")[0]
    except Exception:
        pass
    sugerida = f"npm i @capacitor-community/speech-recognition@{mayor}" if mayor else "npm i @capacitor-community/speech-recognition"
    avisos.append(
        "Falta el plugin de voz (sin él, 'npm run build' falla). Instalalo con:\n"
        f"      {sugerida}\n"
        "      (si npm dice que esa versión no existe, probá sin el número)"
    )
else:
    print("Plugin de voz: instalado.")

# ── 3. Permisos del micrófono en la app (solo si existen las carpetas nativas) ─
plist = raiz / "ios" / "App" / "App" / "Info.plist"
if plist.exists():
    t = leer(plist)
    if "NSSpeechRecognitionUsageDescription" in t and "NSMicrophoneUsageDescription" in t:
        print("Info.plist: ya estaba aplicado.")
    else:
        agregar = ""
        if "NSMicrophoneUsageDescription" not in t:
            agregar += (
                "\t<key>NSMicrophoneUsageDescription</key>\n"
                "\t<string>Boli usa el micrófono para que le hables en vez de escribir.</string>\n"
            )
        if "NSSpeechRecognitionUsageDescription" not in t:
            agregar += (
                "\t<key>NSSpeechRecognitionUsageDescription</key>\n"
                "\t<string>Boli convierte tu voz en texto para entender tu pregunta.</string>\n"
            )
        i = t.rfind("</dict>")
        if i == -1:
            avisos.append("Info.plist no tiene la forma esperada: agregá a mano NSMicrophoneUsageDescription y NSSpeechRecognitionUsageDescription.")
        else:
            guardar(plist, t[:i] + agregar + t[i:])
            print("Info.plist: permisos del micrófono agregados.")
else:
    print("iOS: no hay ios/App/App/Info.plist aquí; si la carpeta nativa está en otro lado, agregá los 2 permisos del LEEME a mano.")

manifiesto = raiz / "android" / "app" / "src" / "main" / "AndroidManifest.xml"
if manifiesto.exists():
    t = leer(manifiesto)
    if "android.permission.RECORD_AUDIO" in t:
        print("AndroidManifest.xml: ya estaba aplicado.")
    else:
        i = t.rfind("</manifest>")
        if i == -1:
            avisos.append("AndroidManifest.xml no tiene la forma esperada: agregá a mano el permiso RECORD_AUDIO.")
        else:
            guardar(manifiesto, t[:i] + '    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n' + t[i:])
            print("AndroidManifest.xml: permiso del micrófono agregado.")
else:
    print("Android: no hay android/app/src/main/AndroidManifest.xml aquí; si la carpeta nativa está en otro lado, agregá el permiso del LEEME a mano.")

print()
if avisos:
    print("REVISAR A MANO:")
    for a in avisos:
        print("  -", a)
else:
    print("Listo. Ahora: npm run build")
