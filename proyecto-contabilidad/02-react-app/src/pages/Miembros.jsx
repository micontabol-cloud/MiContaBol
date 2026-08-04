import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const ROLES = ['admin', 'contador', 'operador']

export default function Miembros() {
  const { id: empresaId } = useParams()
  const { session } = useAuth()
  const [miembros, setMiembros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('operador')
  const [invitando, setInvitando] = useState(false)

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.rpc('listar_miembros_empresa', { p_empresa_id: empresaId })
    if (error) {
      setError(error.message)
    } else {
      setMiembros(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const miRol = miembros.find((m) => m.usuario_id === session?.user?.id)?.rol
  const soyAdmin = miRol === 'admin'

  async function handleInvitar(e) {
    e.preventDefault()
    setError(null)
    setInvitando(true)

    const { error } = await supabase.rpc('invitar_miembro_por_email', {
      p_empresa_id: empresaId,
      p_email: email,
      p_rol: rol,
    })

    setInvitando(false)

    if (error) {
      setError(error.message)
      return
    }

    setEmail('')
    cargar()
  }

  async function handleEliminar(usuarioId) {
    if (!window.confirm('¿Quitar a esta persona de la empresa?')) return

    const { error } = await supabase
      .from('miembros_empresa')
      .delete()
      .eq('empresa_id', empresaId)
      .eq('usuario_id', usuarioId)

    if (error) {
      setError(error.message)
      return
    }
    cargar()
  }

  return (
    <main style={{ maxWidth: 600, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Miembros de la empresa</h1>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Email</th>
              <th style={{ padding: '4px 8px' }}>Rol</th>
              {soyAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {miembros.map((m) => (
              <tr key={m.usuario_id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{m.email}</td>
                <td style={{ padding: '4px 8px' }}>{m.rol}</td>
                {soyAdmin && (
                  <td style={{ padding: '4px 8px' }}>
                    <button type="button" onClick={() => handleEliminar(m.usuario_id)}>
                      Quitar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {soyAdmin && (
        <form
          onSubmit={handleInvitar}
          style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <label>
            Email de la persona
            <br />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Rol
            <br />
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={invitando}>
            Agregar
          </button>
        </form>
      )}

      {!soyAdmin && !cargando && (
        <p style={{ color: '#64748B', marginTop: '1rem' }}>Solo un admin de la empresa puede agregar o quitar miembros.</p>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.85em', marginTop: '1rem' }}>
        Nota: la persona que agregues debe tener ya una cuenta creada (registrada antes en la pantalla de login)
        para poder vincularla.
      </p>
    </main>
  )
}
