import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import RevisionPagos from '../components/RevisionPagos'
import ConfiguracionPagos from '../components/ConfiguracionPagos'
import EliminarEmpresa from '../components/EliminarEmpresa'
import GestionSuscripciones from '../components/GestionSuscripciones'

export default function Admin() {
  const [autorizado, setAutorizado] = useState(null) // null = verificando todavía
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [porEliminar, setPorEliminar] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    async function verificarYCargar() {
      const { data: esAdmin, error: errAdmin } = await supabase.rpc('soy_super_admin')

      if (errAdmin || !esAdmin) {
        setAutorizado(false)
        setCargando(false)
        return
      }

      setAutorizado(true)

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setEmpresas(data)
      }
      setCargando(false)
    }
    verificarYCargar()
  }, [])

  async function recargarEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('created_at', { ascending: false })
    setEmpresas(data || [])
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <p>Verificando acceso...</p>
      </main>
    )
  }

  if (!autorizado) {
    return (
      <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <h1>No autorizado</h1>
        <p>No tienes acceso a esta sección.</p>
        <p>
          <Link to="/empresas">&larr; Volver a Mis empresas</Link>
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 700, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>
      <h1>Panel de administrador</h1>
      <p style={{ color: '#64748B' }}>Vista de solo lectura de todas las empresas de la plataforma.</p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && (
        <p
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: '0.7rem 0.9rem',
            color: '#15803D',
          }}
        >
          {aviso}
        </p>
      )}

      {empresas.length === 0 ? (
        <p>No hay empresas registradas todavía.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>NIT</th>
              <th style={{ padding: '4px 8px' }}>Régimen</th>
              <th style={{ padding: '4px 8px' }}>Creada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{e.nombre}</td>
                <td style={{ padding: '4px 8px' }}>{e.nit || '—'}</td>
                <td style={{ padding: '4px 8px' }}>{e.regimen_tributario}</td>
                <td style={{ padding: '4px 8px' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                  <Link to={`/empresas/${e.id}`}>Ver</Link>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => setPorEliminar(e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      padding: 0,
                      fontSize: '0.88rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <GestionSuscripciones />

      <RevisionPagos />

      <ConfiguracionPagos />


      {porEliminar && (
        <EliminarEmpresa
          empresa={porEliminar}
          onCerrar={() => setPorEliminar(null)}
          onEliminada={(res) => {
            setPorEliminar(null)
            setAviso(
              `Se eliminó «${res.nombre}» con sus ${res.productos} productos y ${res.comprobantes} comprobantes.`
            )
            setTimeout(() => setAviso(null), 8000)
            recargarEmpresas()
          }}
        />
      )}

    </main>
  )
}
