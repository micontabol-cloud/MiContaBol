import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NuevaEmpresa() {
  const [nombre, setNombre] = useState('')
  const [nit, setNit] = useState('')
  const [regimen, setRegimen] = useState('simplificado')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { data: empresaId, error } = await supabase.rpc('crear_empresa', {
      p_nombre: nombre,
      p_nit: nit || null,
      p_regimen_tributario: regimen,
    })

    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}`)
  }

  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>
      <h1>Crear empresa</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Nombre
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          NIT
          <input value={nit} onChange={(e) => setNit(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Régimen tributario
          <select value={regimen} onChange={(e) => setRegimen(e.target.value)} style={{ width: '100%' }}>
            <option value="simplificado">Simplificado</option>
            <option value="general">General</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        {error && <p style={{ color: '#EF4444' }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          Crear empresa
        </button>
      </form>
    </main>
  )
}
