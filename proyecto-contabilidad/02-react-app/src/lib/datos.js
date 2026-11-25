import { useSyncExternalStore } from 'react'
import { supabase } from '../supabaseClient'

// ── Listas completas ─────────────────────────────────────────────────────────
// Supabase entrega máximo 1.000 filas por consulta. Si una lista tiene más, antes se cortaba
// sin avisar. Aquí se pide la primera página y, solo si venía llena, las siguientes de a cuatro
// a la vez. `construir` debe devolver una consulta NUEVA cada vez y con un orden estable
// (termina el orden con una columna única, como id).
export async function traerTodo(construir, tam = 1000) {
  const primera = await construir().range(0, tam - 1)
  if (primera.error || !primera.data || primera.data.length < tam) return primera
  let filas = primera.data
  let pagina = 1
  for (;;) {
    const tanda = await Promise.all(
      [0, 1, 2, 3].map((i) => construir().range((pagina + i) * tam, (pagina + i + 1) * tam - 1))
    )
    for (const r of tanda) {
      if (r.error) return { data: filas, error: r.error }
      filas = filas.concat(r.data || [])
      if (!r.data || r.data.length < tam) return { data: filas, error: null }
    }
    pagina += 4
  }
}

// ── Recordar lo último que viste ─────────────────────────────────────────────
const PREFIJO = 'mcb_c1:'
const MAX_CARACTERES = 600 * 1024

function hoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function usuarioId() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user?.id || null
  } catch {
    return null
  }
}

export async function leerCache(clave) {
  try {
    const uid = await usuarioId()
    if (!uid) return null
    const txt = localStorage.getItem(`${PREFIJO}${uid}:${clave}`)
    if (!txt) return null
    const g = JSON.parse(txt)
    return g && g.dia === hoy() ? g.datos : null // de otro día: no sirve
  } catch {
    return null
  }
}

export async function guardarCache(clave, datos) {
  try {
    const uid = await usuarioId()
    if (!uid) return
    const llave = `${PREFIJO}${uid}:${clave}`
    const txt = JSON.stringify({ dia: hoy(), datos })
    if (txt.length > MAX_CARACTERES) {
      localStorage.removeItem(llave) // muy pesado: mejor no guardar
      return
    }
    localStorage.setItem(llave, txt)
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue igual, solo sin recordar */
  }
}

export function limpiarCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* nada */
  }
}

supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') limpiarCache()
})

// ── Aviso "Actualizando…" ────────────────────────────────────────────────────
let contador = 0
let vigilante = null
const oyentes = new Set()
const avisar = () => oyentes.forEach((f) => f())

export function actualizando(encendido) {
  contador = Math.max(0, contador + (encendido ? 1 : -1))
  clearTimeout(vigilante)
  // Por si una carga se cae a medias: el aviso no se queda pegado para siempre.
  if (contador > 0) vigilante = setTimeout(() => { contador = 0; avisar() }, 30000)
  avisar()
}

export function useActualizando() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => contador > 0
  )
}
