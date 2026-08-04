# Proyecto de contabilidad — orden de ejecución

## 1. `01-supabase-schema/`

Corre estos archivos en el **SQL Editor de tu proyecto de Supabase**, en
este orden exacto:

1. `001_init_contabilidad.sql` — crea todas las tablas, triggers y RLS
2. `002_seed_plan_cuentas_ejemplo.sql` — opcional, ejemplo de plan de
   cuentas (edita el UUID de `v_empresa_id` antes de correrlo — necesitas
   una empresa creada primero, ver el README de esa carpeta)
3. `003_crear_empresa.sql` — función para crear empresas desde la app

Detalles de qué valida cada trigger, cómo funciona el RLS, etc. están en
`01-supabase-schema/README.md`.

## 2. `02-nextjs-app/`

Una vez el schema esté aplicado en Supabase, sigue el
`02-nextjs-app/README.md` para generar el proyecto Next.js con el CLI
oficial y copiar estos archivos encima (cliente Supabase, middleware de
sesión, login, formulario de crear empresa).

## Resumen del flujo completo

```
Supabase (schema + RLS)  →  Next.js app (auth + UI)  →  GitHub  →  Vercel
      01-supabase-schema         02-nextjs-app
```
