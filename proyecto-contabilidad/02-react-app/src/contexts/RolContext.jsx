import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { leerCache, guardarCache } from '../lib/datos'

const RolContext = createContext({ rol: null, cargando: true })

export function RolProvider({ empresaId, children }) {
  const [rol, setRol] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      // El rol casi nunca cambia: se recuerda para que el menú salga completo al instante.
      const clave = `rol:${empresaId}`
      const guardado = await leerCache(clave)
      if (cancelado) return
      if (guardado && guardado.rol) {
        setRol(guardado.rol)
        setCargando(false)
      } else {
        setCargando(true)
      }
      const { data } = await supabase.rpc('rol_en_empresa', { p_empresa_id: empresaId })
      if (!cancelado) {
        setRol(data || null)
        setCargando(false)
      }
      if (data) guardarCache(clave, { rol: data })
    }

    if (empresaId) cargar()
    return () => {
      cancelado = true
    }
  }, [empresaId])

  return <RolContext.Provider value={{ rol, cargando }}>{children}</RolContext.Provider>
}

export function useRol() {
  return useContext(RolContext)
}

/** Puede tocar configuración contable, cerrar períodos, revertir asientos. */
export function puedeConfigurar(rol) {
  return rol === 'admin' || rol === 'contador'
}

/** Puede gestionar miembros y datos de la empresa. */
export function esAdmin(rol) {
  return rol === 'admin'
}
