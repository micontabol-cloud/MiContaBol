-- =========================================================
-- 002_seed_plan_cuentas_ejemplo.sql
--
-- Bolivia no exige un plan de cuentas único obligatorio (a
-- diferencia de otros países de la región), así que esto es
-- solo un punto de partida razonable para una PyME. Cada
-- empresa debería poder editarlo desde la UI.
--
-- Pega esto tal cual en el SQL Editor de Supabase. Antes de correrlo,
-- reemplaza el UUID de v_empresa_id por el id real de tu empresa.
-- Para obtenerlo: select id, nombre from empresas;
-- =========================================================

do $$
declare
  v_empresa_id uuid := '00000000-0000-0000-0000-000000000000'; -- <-- reemplaza este UUID
begin
  insert into plan_cuentas (empresa_id, codigo, nombre, tipo, naturaleza, permite_movimiento) values
    (v_empresa_id, '1', 'ACTIVO', 'activo', 'deudora', false),
    (v_empresa_id, '1.1', 'Activo Corriente', 'activo', 'deudora', false),
    (v_empresa_id, '1.1.01', 'Caja', 'activo', 'deudora', true),
    (v_empresa_id, '1.1.02', 'Bancos', 'activo', 'deudora', true),
    (v_empresa_id, '1.1.03', 'Cuentas por Cobrar', 'activo', 'deudora', true),
    (v_empresa_id, '1.1.04', 'Inventario / Mercadería', 'activo', 'deudora', true),

    (v_empresa_id, '2', 'PASIVO', 'pasivo', 'acreedora', false),
    (v_empresa_id, '2.1', 'Pasivo Corriente', 'pasivo', 'acreedora', false),
    (v_empresa_id, '2.1.01', 'Cuentas por Pagar', 'pasivo', 'acreedora', true),
    (v_empresa_id, '2.1.02', 'Préstamos por Pagar', 'pasivo', 'acreedora', true),

    (v_empresa_id, '3', 'PATRIMONIO', 'patrimonio', 'acreedora', false),
    (v_empresa_id, '3.1.01', 'Capital', 'patrimonio', 'acreedora', true),
    (v_empresa_id, '3.1.02', 'Resultados Acumulados', 'patrimonio', 'acreedora', true),

    (v_empresa_id, '4', 'INGRESOS', 'ingreso', 'acreedora', false),
    (v_empresa_id, '4.1.01', 'Ventas', 'ingreso', 'acreedora', true),
    (v_empresa_id, '4.1.02', 'Otros Ingresos', 'ingreso', 'acreedora', true),

    (v_empresa_id, '5', 'GASTOS', 'gasto', 'deudora', false),
    (v_empresa_id, '5.1.01', 'Costo de Ventas', 'gasto', 'deudora', true),
    (v_empresa_id, '5.1.02', 'Sueldos y Salarios', 'gasto', 'deudora', true),
    (v_empresa_id, '5.1.03', 'Alquiler', 'gasto', 'deudora', true),
    (v_empresa_id, '5.1.04', 'Servicios Básicos', 'gasto', 'deudora', true),
    (v_empresa_id, '5.1.05', 'Otros Gastos', 'gasto', 'deudora', true);
end $$;
