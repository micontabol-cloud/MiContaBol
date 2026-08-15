import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import BoliMascot from '../components/BoliMascot'
import VisorImagen from '../components/VisorImagen'

export default function Perfil() {
  const { session } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [ampliada, setAmpliada] = useState(false)

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.rpc('mi_perfil')
    if (error) setError(error.message)
    setPerfil(data)
    if (data) {
      setNombre(data.nombre || '')
      setTelefono(data.telefono || '')
      setFechaNacimiento(data.fecha_nacimiento || '')
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function subirAvatar(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setSubiendo(true)

    const ext = archivo.name.split('.').pop()
    const ruta = `perfiles/${session.user.id}/avatar-${Date.now()}.${ext}`

    const { error: errSubida } = await supabase.storage.from('productos').upload(ruta, archivo, { upsert: true })

    if (errSubida) {
      setSubiendo(false)
      return setError(`No se pudo subir la foto: ${errSubida.message}`)
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta)
    await supabase.rpc('guardar_mi_perfil', {
      p_nombre: nombre || null,
      p_telefono: telefono || null,
      p_fecha_nacimiento: fechaNacimiento || null,
      p_avatar_url: data.publicUrl,
    })

    setSubiendo(false)
    cargar()
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.rpc('guardar_mi_perfil', {
      p_nombre: nombre || null,
      p_telefono: telefono || null,
      p_fecha_nacimiento: fechaNacimiento || null,
      p_avatar_url: perfil?.avatar_url || null,
    })

    setGuardando(false)
    if (error) return setError(error.message)

    setAviso('Guardado.')
    setTimeout(() => setAviso(null), 3000)
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 620, margin: '3rem auto', fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 620, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empresas">&larr; Mis empresas</Link>
      </p>

      <h1>Tu perfil</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Estos son tus datos personales, no los de tu negocio. Si llevas varias empresas, este perfil es el mismo para
        todas.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        {perfil?.avatar_url ? (
          <button
            type="button"
            onClick={() => setAmpliada(true)}
            title="Ver más grande"
            style={{ padding: 0, border: 'none', background: 'transparent', borderRadius: '50%', cursor: 'zoom-in' }}
          >
            <img
              src={perfil.avatar_url}
              alt="Tu foto de perfil"
              style={{
                width: 92,
                height: 92,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #E6ECF3',
                display: 'block',
              }}
            />
          </button>
        ) : (
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              background: '#F7F9FC',
              border: '1px dashed #E6ECF3',
              display: 'grid',
              placeItems: 'center',
              color: '#A3AFBF',
              fontSize: '1.8rem',
              fontWeight: 700,
            }}
          >
            {(nombre || session?.user?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <input type="file" accept="image/*" onChange={subirAvatar} disabled={subiendo} style={{ fontSize: '0.8rem' }} />
          {subiendo && <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Subiendo...</span>}
          <span style={{ fontSize: '0.85rem', color: '#A3AFBF' }}>{session?.user?.email}</span>
        </div>
      </div>

      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <label>
          ¿Cómo te llamas?
          <br />
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Pepe Severiche"
            style={{ width: '100%' }}
          />
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
            Boli te va a saludar por tu nombre al entrar.
          </span>
        </label>

        <label>
          Tu teléfono
          <br />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="70000000"
            style={{ width: '100%' }}
          />
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
            Personal. El del negocio se configura aparte, en la imagen de tu negocio.
          </span>
        </label>

        <label>
          Tu cumpleaños
          <br />
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            style={{ width: 190 }}
          />
        </label>

        {fechaNacimiento && (
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              background: '#F7F9FC',
              border: '1px solid #E6ECF3',
              borderRadius: 14,
              padding: '0.85rem 1rem',
            }}
          >
            <BoliMascot pose="celebrando" size={54} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
              Ese día voy a recibirte con un{' '}
              <strong style={{ color: '#1F3A5F' }}>
                🎂 ¡Feliz cumpleaños{nombre ? `, ${nombre.trim().split(/\s+/)[0]}` : ''}!
              </strong>
            </p>
          </div>
        )}

        <button className="btn-hero" type="submit" disabled={guardando} style={{ alignSelf: 'flex-start' }}>
          Guardar
        </button>
      </form>

      <p style={{ color: '#A3AFBF', fontSize: '0.82rem', marginTop: '1.5rem' }}>
        Solo tú puedes ver estos datos. Ni los otros miembros de tus empresas ni el soporte de MiContaBol tienen
        acceso a tu fecha de nacimiento.
      </p>
      {ampliada && (
        <VisorImagen url={perfil?.avatar_url} alt={nombre || 'Tu foto de perfil'} onCerrar={() => setAmpliada(false)} />
      )}
    </main>
  )
}
