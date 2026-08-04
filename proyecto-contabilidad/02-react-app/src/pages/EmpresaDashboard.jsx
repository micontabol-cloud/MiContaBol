import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>{empresa?.nombre || 'Empresa'}</h1>
      <p style={{ color: '#666' }}>Régimen: {empresa?.regimen_tributario}</p>
      <nav style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
        <Link to={`/empresas/${id}/cuentas`}>Plan de cuentas</Link>
        <Link to={`/empresas/${id}/comprobantes`}>Ventas y compras</Link>
        <Link to={`/empresas/${id}/asientos`}>Asientos contables</Link>
        <Link to={`/empresas/${id}/libro-mayor`}>Libro mayor</Link>
        <Link to={`/empresas/${id}/balance-comprobacion`}>Balance de comprobación</Link>
        <Link to={`/empresas/${id}/estados-financieros`}>Estados financieros</Link>
      </nav>
    </main>
  )
}
