'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearEmpresa(formData: FormData) {
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const nit = formData.get('nit') as string
  const regimen = formData.get('regimen_tributario') as string

  const { data: empresaId, error } = await supabase.rpc('crear_empresa', {
    p_nombre: nombre,
    p_nit: nit || null,
    p_regimen_tributario: regimen || 'simplificado',
  })

  if (error) {
    // TODO: en una versión real, devuelve esto a un estado de formulario
    // (useFormState) en vez de lanzar un error genérico.
    throw new Error(error.message)
  }

  redirect(`/empresas/${empresaId}`)
}
