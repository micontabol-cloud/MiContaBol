-- =========================================================
-- 003_crear_empresa.sql
--
-- Resuelve el problema de huevo-y-gallina de RLS: un usuario
-- autenticado no puede insertar en miembros_empresa sin ya
-- ser miembro. Esta función crea la empresa y la membresía
-- admin en una sola transacción atómica.
-- =========================================================

create or replace function crear_empresa(
  p_nombre text,
  p_nit text default null,
  p_regimen_tributario text default 'simplificado'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes estar autenticado para crear una empresa';
  end if;

  insert into empresas (nombre, nit, regimen_tributario)
  values (p_nombre, p_nit, p_regimen_tributario)
  returning id into v_empresa_id;

  insert into miembros_empresa (usuario_id, empresa_id, rol)
  values (auth.uid(), v_empresa_id, 'admin');

  return v_empresa_id;
end;
$$;

-- Solo usuarios autenticados pueden llamarla (no el rol anon)
grant execute on function crear_empresa(text, text, text) to authenticated;

-- ---------------------------------------------------------
-- Política para agregar más miembros después (ej: invitar
-- a un contador o a un socio). Solo un admin de la empresa
-- puede agregar nuevos miembros.
-- ---------------------------------------------------------
create policy miembros_insert on miembros_empresa
  for insert
  with check (
    exists (
      select 1 from miembros_empresa m
      where m.empresa_id = miembros_empresa.empresa_id
        and m.usuario_id = auth.uid()
        and m.rol = 'admin'
    )
  );
