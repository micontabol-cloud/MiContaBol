# Contabilidad — scaffold inicial

## 1. Crear el proyecto Next.js

Estos archivos están pensados para caer encima de un proyecto generado con
el CLI oficial (así te aseguras de tener config y versiones actuales):

```bash
npx create-next-app@latest contabilidad-app --typescript --app --src-dir --no-tailwind --import-alias "@/*"
cd contabilidad-app
npm install @supabase/ssr @supabase/supabase-js
```

Cuando te pregunte por ESLint, Turbopack, etc., cualquier respuesta está
bien — no afecta a estos archivos.

## 2. Copiar estos archivos

Copia el contenido de esta carpeta dentro de `contabilidad-app/`,
respetando la misma estructura (`src/lib/supabase/`, `src/middleware.ts`,
`src/app/actions/`, `src/app/login/`, `src/app/empresas/nueva/`,
`src/app/page.tsx`). El `create-next-app` ya te genera un `src/app/page.tsx`
y `src/app/layout.tsx` — sobreescribe el `page.tsx` con el de aquí, deja el
`layout.tsx` que ya tienes.

## 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con
los datos de tu proyecto (Project Settings → API en el dashboard de
Supabase).

## 4. Habilitar el provider de Email en Supabase

En el dashboard: **Authentication → Providers → Email**, verifica que
esté habilitado. Por defecto Supabase pide confirmación por correo antes
de dejar iniciar sesión — para desarrollo local puedes desactivar
"Confirm email" en **Authentication → Settings** si quieres probar más
rápido sin revisar tu bandeja de entrada cada vez.

## 5. Correr

```bash
npm run dev
```

Flujo esperado: `/login` → crear cuenta → `/empresas/nueva` → llena el
formulario → te redirige a `/empresas/<id>` (esa página aún no existe,
es el siguiente paso).

## Qué sigue

- Página `/empresas/[id]` con el dashboard de la empresa
- CRUD del plan de cuentas
- Formulario de asiento contable (líneas dinámicas debe/haber que deben
  cuadrar antes de poder confirmar)
- Vista de Libro Mayor y Balance de Comprobación
