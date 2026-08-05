import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  async function handleSignIn(e) {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    navigate('/empresas')
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setMensaje(null)
    setCargando(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setCargando(false)
    if (error) {
      setMensaje(error.message)
      return
    }
    setMensaje('Cuenta creada. Si tu proyecto pide confirmar el correo, revisa tu bandeja antes de ingresar.')
  }

  return (
    <div className="auth-split">
      {/* Panel de imagen — reemplaza el degradado por una foto real cuando la tengas
          (ver README de esta actualización para sugerencias de búsqueda). */}
      <div className="auth-image-panel">
        <div className="auth-image-panel-text">
          <p style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>Dedícate a vender.</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 1rem' }}>
            Nosotros hacemos el resto.
          </p>
          <p style={{ color: '#C7D2E0', fontSize: '0.95rem', margin: 0 }}>
            Controla tu negocio desde el celular, sin saber de contabilidad.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 360, fontFamily: 'sans-serif', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <Logo iconSize={30} />
          </div>

          <h1 style={{ fontSize: '1.75rem' }}>Ingresar</h1>
          <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>Mi contabilidad en el bolsillo.</p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </label>
            {mensaje && <p style={{ color: '#EF4444' }}>{mensaje}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={handleSignIn} disabled={cargando}>
                Ingresar
              </button>
              <button type="button" onClick={handleSignUp} disabled={cargando}>
                Crear cuenta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
