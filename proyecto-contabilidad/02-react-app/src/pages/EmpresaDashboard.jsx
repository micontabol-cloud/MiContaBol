import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function EmpresaDashboard() {
  const { id } = useParams()
  const [empresa, setEmpresa] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('empresas').select('*').eq('id', id).single()
      setEmpresa(data)
    }
    cargar()
  }, [id])

  return (
    <main style={{ maxWidth: 720, fontFamily: 'sans-serif' }}>
      <h1>{empresa?.nombre || 'Cargando...'}</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Régimen: {empresa?.regimen_tributario} {empresa?.nit && `· NIT: ${empresa.nit}`}
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        Usa el menú de la izquierda para moverte entre plan de cuentas, ventas, inventario, asientos y reportes.
      </p>
    </main>
  )
}
