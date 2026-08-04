-- =========================================================
-- 001_init_contabilidad.sql
-- Core contable multi-tenant (partida doble) para Supabase
--
-- Fase 1: sin integración fiscal SIN. Diseñado para que ese
-- módulo se agregue después sin tocar este core.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. EMPRESAS (tenants)
-- ---------------------------------------------------------
create table empresas (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  nit                   text,
  regimen_tributario    text not null default 'simplificado'
                          check (regimen_tributario in ('simplificado', 'general', 'otro')),
  moneda                text not null default 'BOB',
  -- Preparado para Fase 2 (facturación electrónica SIN).
  -- Mientras el régimen sea 'simplificado', queda en null.
  modalidad_facturacion text,
  created_at            timestamptz not null default now()
);

comment on column empresas.modalidad_facturacion is
  'Reservado para Fase 2: electronica_en_linea | computarizada_en_linea | portal_web_en_linea | manual | null';

-- ---------------------------------------------------------
-- 2. MIEMBROS_EMPRESA (usuario <-> empresa, con rol)
--    Un contador puede pertenecer a varias empresas/clientes.
-- ---------------------------------------------------------
create table miembros_empresa (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  empresa_id  uuid not null references empresas(id) on delete cascade,
  rol         text not null default 'operador'
                check (rol in ('admin', 'contador', 'operador')),
  created_at  timestamptz not null default now(),
  unique (usuario_id, empresa_id)
);

-- Función auxiliar para RLS: ¿el usuario autenticado pertenece a esta empresa?
create or replace function is_member_of_empresa(p_empresa_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from miembros_empresa
    where usuario_id = auth.uid()
      and empresa_id = p_empresa_id
  );
$$;

-- ---------------------------------------------------------
-- 3. PLAN DE CUENTAS (chart of accounts, jerárquico, por empresa)
-- ---------------------------------------------------------
create table plan_cuentas (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references empresas(id) on delete cascade,
  codigo             text not null,
  nombre             text not null,
  tipo               text not null
                       check (tipo in ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'orden')),
  naturaleza         text not null
                       check (naturaleza in ('deudora', 'acreedora')),
  cuenta_padre_id    uuid references plan_cuentas(id),
  permite_movimiento boolean not null default true,
  activo             boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- ---------------------------------------------------------
-- 4. COMPROBANTES (ventas/compras internos, no fiscales aún)
-- ---------------------------------------------------------
create table comprobantes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references empresas(id) on delete cascade,
  tipo             text not null check (tipo in ('venta', 'compra')),
  -- Bandera para Fase 2: hoy siempre 'interno'.
  tipo_documento   text not null default 'interno'
                     check (tipo_documento in ('interno', 'fiscal')),
  numero_interno   text not null,
  fecha            date not null,
  cliente_proveedor text,
  concepto         text,
  monto_total      numeric(14,2) not null check (monto_total >= 0),
  estado           text not null default 'borrador'
                     check (estado in ('borrador', 'confirmado', 'anulado')),
  created_at       timestamptz not null default now(),
  unique (empresa_id, numero_interno)
);

-- ---------------------------------------------------------
-- 5. ASIENTOS CONTABLES (journal entry header)
-- ---------------------------------------------------------
create table asientos_contables (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references empresas(id) on delete cascade,
  numero              integer not null,
  fecha               date not null,
  glosa               text,
  origen              text not null default 'manual'
                        check (origen in ('manual', 'venta', 'compra', 'ajuste', 'apertura', 'reversion')),
  comprobante_id      uuid references comprobantes(id),
  asiento_reversion_de uuid references asientos_contables(id),
  estado              text not null default 'borrador'
                        check (estado in ('borrador', 'confirmado', 'anulado')),
  creado_por          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  confirmado_at       timestamptz,
  unique (empresa_id, numero)
);

-- ---------------------------------------------------------
-- 6. MOVIMIENTOS CONTABLES (journal lines, debe/haber)
-- ---------------------------------------------------------
create table movimientos_contables (
  id         uuid primary key default gen_random_uuid(),
  asiento_id uuid not null references asientos_contables(id) on delete cascade,
  cuenta_id  uuid not null references plan_cuentas(id),
  debe       numeric(14,2) not null default 0 check (debe >= 0),
  haber      numeric(14,2) not null default 0 check (haber >= 0),
  glosa      text,
  orden      integer not null default 0,
  check (not (debe > 0 and haber > 0))
);

create index idx_movimientos_asiento on movimientos_contables(asiento_id);
create index idx_movimientos_cuenta on movimientos_contables(cuenta_id);
create index idx_asientos_empresa_fecha on asientos_contables(empresa_id, fecha);

-- =========================================================
-- TRIGGERS DE INTEGRIDAD
-- =========================================================

-- A) Un asiento solo puede pasar a 'confirmado' si debe = haber
create or replace function validar_asiento_balanceado()
returns trigger
language plpgsql
as $$
declare
  v_debe  numeric(14,2);
  v_haber numeric(14,2);
begin
  if NEW.estado = 'confirmado' and OLD.estado is distinct from 'confirmado' then
    select coalesce(sum(debe), 0), coalesce(sum(haber), 0)
      into v_debe, v_haber
      from movimientos_contables
      where asiento_id = NEW.id;

    if v_debe <> v_haber then
      raise exception 'Asiento % no balanceado: debe=% haber=%', NEW.id, v_debe, v_haber;
    end if;

    if v_debe = 0 then
      raise exception 'Asiento % no tiene movimientos', NEW.id;
    end if;

    NEW.confirmado_at := now();
  end if;
  return NEW;
end;
$$;

create trigger trg_validar_asiento_balanceado
  before update on asientos_contables
  for each row
  execute function validar_asiento_balanceado();

-- B) Inmutabilidad: un asiento confirmado no se edita ni se borra.
--    Las correcciones se hacen con un asiento de reversión (origen = 'reversion').
create or replace function bloquear_edicion_asiento_confirmado()
returns trigger
language plpgsql
as $$
begin
  if OLD.estado = 'confirmado' then
    if TG_OP = 'DELETE' then
      raise exception 'No se puede eliminar un asiento confirmado (id=%). Use un asiento de reversión.', OLD.id;
    end if;
    if TG_OP = 'UPDATE' and NEW.estado <> 'anulado' then
      raise exception 'No se puede modificar un asiento confirmado (id=%). Use un asiento de reversión.', OLD.id;
    end if;
  end if;
  return OLD;
end;
$$;

create trigger trg_bloquear_edicion_asiento
  before update or delete on asientos_contables
  for each row
  execute function bloquear_edicion_asiento_confirmado();

-- C) Mismo principio para las líneas: no tocar movimientos de un asiento confirmado.
create or replace function bloquear_edicion_movimiento_confirmado()
returns trigger
language plpgsql
as $$
declare
  v_estado text;
begin
  select estado into v_estado
    from asientos_contables
    where id = coalesce(OLD.asiento_id, NEW.asiento_id);

  if v_estado = 'confirmado' then
    raise exception 'No se pueden modificar movimientos de un asiento confirmado.';
  end if;
  return OLD;
end;
$$;

create trigger trg_bloquear_edicion_movimiento
  before update or delete on movimientos_contables
  for each row
  execute function bloquear_edicion_movimiento_confirmado();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table empresas enable row level security;
alter table miembros_empresa enable row level security;
alter table plan_cuentas enable row level security;
alter table comprobantes enable row level security;
alter table asientos_contables enable row level security;
alter table movimientos_contables enable row level security;

-- Empresas: visible solo si soy miembro
create policy empresas_select on empresas
  for select using (is_member_of_empresa(id));
create policy empresas_update on empresas
  for update using (is_member_of_empresa(id));

-- Miembros: veo los miembros de mis propias empresas
create policy miembros_select on miembros_empresa
  for select using (is_member_of_empresa(empresa_id));

-- Plan de cuentas
create policy plan_cuentas_all on plan_cuentas
  for all using (is_member_of_empresa(empresa_id))
  with check (is_member_of_empresa(empresa_id));

-- Comprobantes
create policy comprobantes_all on comprobantes
  for all using (is_member_of_empresa(empresa_id))
  with check (is_member_of_empresa(empresa_id));

-- Asientos
create policy asientos_all on asientos_contables
  for all using (is_member_of_empresa(empresa_id))
  with check (is_member_of_empresa(empresa_id));

-- Movimientos (se filtran vía el asiento al que pertenecen)
create policy movimientos_select on movimientos_contables
  for select using (
    exists (
      select 1 from asientos_contables a
      where a.id = movimientos_contables.asiento_id
        and is_member_of_empresa(a.empresa_id)
    )
  );
create policy movimientos_insert on movimientos_contables
  for insert with check (
    exists (
      select 1 from asientos_contables a
      where a.id = movimientos_contables.asiento_id
        and is_member_of_empresa(a.empresa_id)
    )
  );
create policy movimientos_update on movimientos_contables
  for update using (
    exists (
      select 1 from asientos_contables a
      where a.id = movimientos_contables.asiento_id
        and is_member_of_empresa(a.empresa_id)
    )
  );
create policy movimientos_delete on movimientos_contables
  for delete using (
    exists (
      select 1 from asientos_contables a
      where a.id = movimientos_contables.asiento_id
        and is_member_of_empresa(a.empresa_id)
    )
  );
