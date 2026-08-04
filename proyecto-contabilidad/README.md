# Proyecto de contabilidad — flujo sin terminal (como LecheTrack)

## Qué cambia respecto a la versión anterior

Antes usábamos Next.js, que necesita generarse con una herramienta de
línea de comandos. Ahora es **React + Vite**, que yo puedo escribir a
mano por completo — no necesitas Node ni Terminal para nada de esto.
Vercel instala y construye todo en la nube cuando conectas el repo.

## Orden de pasos

### 1. `01-supabase-schema/` (sin cambios)

Corre estos `.sql` en el SQL Editor de tu proyecto de Supabase, en orden:
`001_init_contabilidad.sql` → `002_seed_plan_cuentas_ejemplo.sql`
(opcional) → `003_crear_empresa.sql`.

### 2. `02-react-app/`

En tu repo de GitHub (`MiContaBol`):

1. **Borra** la carpeta vieja `02-nextjs-app/` (clic en la carpeta →
   ícono de basura, o selecciona todos los archivos y elimínalos).
2. **Add file → Upload files** y arrastra toda la carpeta `02-react-app/`
   de este paquete.
3. Confirma el commit.

### 3. Variables de entorno en Vercel

1. Entra a [vercel.com](https://vercel.com), conecta tu cuenta de GitHub
   si no lo has hecho.
2. **Add New → Project** → elige el repo `MiContaBol`.
3. En **Root Directory**, selecciona la carpeta `02-react-app` (importante:
   tu repo tiene varias carpetas, Vercel necesita saber cuál construir).
4. Antes de darle a "Deploy", abre **Environment Variables** y agrega:
   - `VITE_SUPABASE_URL` → la URL de tu proyecto Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu anon/public key
   (ambas están en Supabase: Project Settings → API)
5. Dale a **Deploy**.

Cada vez que subas cambios a la carpeta `02-react-app` en GitHub, Vercel
vuelve a desplegar automáticamente.

## Cómo probar que funciona

Una vez desplegado, Vercel te da una URL (algo como
`micontabol.vercel.app`). Ábrela:
1. Debería mandarte a `/login`
2. Crea una cuenta con tu email
3. Te lleva a `/empresas/nueva` — crea tu primera empresa
4. Te redirige a `/empresas/<id>` (el dashboard todavía es un placeholder,
   ese es el siguiente paso a construir)

## Nota sobre `vercel.json`

Este archivo le dice a Vercel que todas las rutas (`/login`,
`/empresas/nueva`, etc.) deben cargar la app de React, no buscar un
archivo con ese nombre. Sin él, recargar la página en cualquier ruta que
no sea la principal daría un error 404. Ya está incluido, no lo borres.
