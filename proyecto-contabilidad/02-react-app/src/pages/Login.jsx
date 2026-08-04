import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

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
    <main style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Ingresar</h1>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        {mensaje && <p style={{ color: '#a33' }}>{mensaje}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSignIn} disabled={cargando}>
            Ingresar
          </button>
          <button onClick={handleSignUp} disabled={cargando}>
            Crear cuenta
          </button>
        </div>
      </form>
    </main>
  )
}
