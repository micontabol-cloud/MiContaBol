import { supabase } from '../supabaseClient'

// Cuántos hay de cada cosa para la guía de primeros pasos (viene en el mismo paquete de Inicio).
export const conteosInicio = new Map()

// Pide todo lo de Inicio en UNA sola consulta. Devuelve lo mismo, en el mismo orden, que las 12
// consultas de antes. Si la función aún no existe en la base de datos (o falla), usa `respaldo`,
// que es el camino de antes: más lento, pero funciona.
export async function cargarInicio(empresaId, fechas, respaldo) {
  try {
    const { data, error } = await supabase.rpc('inicio_paquete', {
      p_empresa_id: empresaId,
      p_inicio_mes: fechas.inicioMes,
      p_seis_meses: fechas.seisMesesAtras,
      p_hoy: fechas.hoy,
    })
    if (!error && data && data.empresa) {
      conteosInicio.set(empresaId, { ...data.onboarding, ventas: data.total_ventas })
      return [
        { data: data.empresa, error: null },
        { data: data.plan_cuentas, error: null },
        { data: data.libro_mes, error: null },
        { count: data.productos_activos, error: null },
        { data: data.ventas_clientes, error: null },
        { data: data.balance, error: null },
        { data: data.ultimas_ventas, error: null },
        { data: data.stock_bajo, error: null },
        { data: data.ventas_6m, error: null },
        { data: data.lotes, error: null },
        { data: data.ventas_hoy, error: null },
        { count: data.total_ventas, error: null },
      ]
    }
  } catch {
    /* sigue con el camino de antes */
  }
  conteosInicio.delete(empresaId)
  return respaldo()
}
