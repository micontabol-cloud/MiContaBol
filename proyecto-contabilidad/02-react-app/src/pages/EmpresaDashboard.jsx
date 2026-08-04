import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const chipStyle = {
  display: 'block',
  padding: '0.85rem 1rem',
  border: '1px solid #E6ECF3',
  borderRadius: 10,
  color: '#1F3A5F',
  fontWeight: 600,
  fontSize: '0.9rem',
}

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

  const secciones = [
    { to: `/empresas/${id}/cuentas`, label: 'Plan de cuentas' },
    { to: `/empresas/${id}/comprobantes`, label: 'Ventas y compras' },
    { to: `/empresas/${id}/inventario`, label: 'Inventario' },
    { to: `/empresas/${id}/cuentas-por-cobrar`, label: 'Cuentas por cobrar' },
    { to: `/empresas/${id}/asientos`, label: 'Asientos contables' },
    { to: `/empresas/${id}/libro-mayor`, label: 'Libro mayor' },
    { to: `/empresas/${id}/balance-comprobacion`, label: 'Balance de comprobación' },
    { to: `/empresas/${id}/estados-financieros`, label: 'Estados financieros' },
    { to: `/empresas/${id}/miembros`, label: 'Miembros' },
  ]

  return (
    <main style={{ maxWidth: 720, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>
      <h1>{empresa?.nombre || 'Empresa'}</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>Régimen: {empresa?.regimen_tributario}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.5rem',
        }}
      >
        {secciones.map((s) => (
          <Link key={s.to} to={s.to} className="nav-chip" style={chipStyle}>
            {s.label}
          </Link>
        ))}
      </div>
    </main>
  )
}
