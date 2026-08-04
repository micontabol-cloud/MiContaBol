# Schema inicial — Contabilidad multi-tenant (Fase 1)

## Cómo aplicarlo

1. En tu proyecto de Supabase, ve a **SQL Editor**.
2. Corre `001_init_contabilidad.sql` primero (crea todo: tablas, triggers, RLS).
3. `002_seed_plan_cuentas_ejemplo.sql` es opcional — es solo un plan de cuentas
   de ejemplo. Mejor conviértelo en un endpoint/función que lo inserte al
   crear una empresa nueva, en vez de correrlo a mano.

También puedes meter estos archivos en `supabase/migrations/` de tu repo y
usar `supabase db push` con el CLI, para que quede versionado junto al código.

## Qué valida el schema

- **Asiento balanceado**: no puedes confirmar un asiento si debe ≠ haber
  (trigger `validar_asiento_balanceado`).
- **Inmutabilidad**: un asiento confirmado no se puede editar ni borrar.
  Los ajustes se hacen con un nuevo asiento (`origen = 'reversion'`) que
  referencia al original vía `asiento_reversion_de`.
- **Aislamiento por empresa**: RLS activado en todo, usando
  `is_member_of_empresa()`. Un usuario solo ve datos de las empresas
  donde aparece en `miembros_empresa`.

## Preparado para Fase 2 (facturación electrónica SIN)

Dos campos ya están ahí esperando, sin que el core dependa de ellos:

- `empresas.modalidad_facturacion` — hoy `null`, luego guardará la
  modalidad que el SIN le asigne a la empresa.
- `comprobantes.tipo_documento` — hoy siempre `'interno'`, luego podrá
  ser `'fiscal'` cuando el comprobante tenga CUF, XML firmado, etc.

Cuando llegue ese momento, la integración con el SIN debería vivir en su
propio módulo/servicio que **escribe** a `comprobantes` y genera el
asiento correspondiente — sin tocar `asientos_contables` ni
`movimientos_contables` directamente.

## Libro mayor y reportes

El libro mayor no se guarda como tabla — se calcula agrupando
`movimientos_contables` por `cuenta_id`. Conviene armarlo como vista SQL
(o función) más adelante, para no duplicar lógica entre el backend y los
reportes.

## Siguiente paso sugerido

Definir los endpoints/Server Actions para:
1. Crear empresa + agregar el primer miembro (admin)
2. CRUD de plan de cuentas
3. Crear asiento en borrador → agregar movimientos → confirmar
4. Reporte de Libro Mayor y Balance de Comprobación (sumas y saldos)
