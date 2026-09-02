import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MailCheck, ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

export default function Login() {
  // 'ingresar' | 'registrar' | 'confirmar'
  const [modo, setModo] = useState('ingresar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const navigate = useNavigate()

  const registrando = modo === 'registrar'

  function cambiarModo(nuevo) {
    setModo(nuevo)
    setMensaje(null)
    setAviso(null)
  }

  // Traduce los errores de Supabase a algo que un comerciante
  // entienda. "Invalid login credentials" no le dice nada a nadie.
  function traducirError(error) {
    const m = (error?.message || '').toLowerCase()

    if (m.includes('email not confirmed')) {
      return {
        texto: 'Todavía no confirmaste tu correo. Revisa tu bandeja de entrada.',
        ofrecerReenvio: true,
      }
    }
    if (m.includes('invalid login credentials')) {
      return { texto: 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.' }
    }
    if (m.includes('user already registered')) {
      return {
        texto: 'Ya existe una cuenta con ese correo. Prueba ingresando.',
        ofrecerIngreso: true,
      }
    }
    if (m.includes('password should be at least')) {
      return { texto: 'La contraseña necesita al menos 6 caracteres.' }
    }
    if (m.includes('unable to validate email')) {
      return { texto: 'Ese correo no parece válido. Revísalo.' }
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return { texto: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.' }
    }
    return { texto: error?.message || 'Algo salió mal. Intenta de nuevo.' }
  }

  async function enviar(e) {
    e.preventDefault()
    setMensaje(null)
    setAviso(null)
    setCargando(true)

    if (registrando) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setCargando(false)

      if (error) {
        setMensaje(traducirError(error))
        return
      }

      // Si Supabase devuelve sesión, la confirmación está
      // desactivada y puede entrar directo
      if (data?.session) {
        navigate('/empresas')
        return
      }

      setModo('confirmar')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)

    if (error) {
      setMensaje(traducirError(error))
      return
    }

    navigate('/empresas')
  }

  async function reenviarCorreo() {
    setReenviando(true)
    setAviso(null)

    const { error } = await supabase.auth.resend({ type: 'signup', email })

    setReenviando(false)

    if (error) {
      setMensaje(traducirError(error))
      return
    }

    setAviso('Te mandamos el correo otra vez. Puede tardar un par de minutos.')
  }

  return (
    <div className="auth-split">
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
        <div style={{ width: '100%', maxWidth: 380, fontFamily: 'sans-serif', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <Logo iconSize={40} textSize="1.25rem" />
          </div>

          {/* ─── Pantalla de confirmar correo ─── */}
          {modo === 'confirmar' ? (
            <>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.12)',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <MailCheck size={30} strokeWidth={1.8} style={{ color: '#22C55E' }} />
              </div>

              <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.5rem' }}>Confirma tu correo</h1>

              <p style={{ color: '#64748B', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
                Le mandamos un correo a <strong style={{ color: '#253046' }}>{email}</strong>. Ábrelo y toca el
                enlace para activar tu cuenta.
              </p>

              <div
                style={{
                  background: '#F7F9FC',
                  border: '1px solid #E6ECF3',
                  borderRadius: 12,
                  padding: '1rem 1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#1F3A5F', fontSize: '0.92rem' }}>
                  ¿No te llegó?
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.1rem',
                    color: '#64748B',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                  }}
                >
                  <li>Puede tardar un par de minutos</li>
                  <li>Revisa la carpeta de spam o correo no deseado</li>
                  <li>Fíjate que el correo esté bien escrito</li>
                </ul>
              </div>

              {aviso && (
                <p
                  style={{
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 10,
                    padding: '0.6rem 0.8rem',
                    color: '#15803D',
                    fontSize: '0.88rem',
                    margin: '0 0 1rem',
                  }}
                >
                  {aviso}
                </p>
              )}

              {mensaje && <p style={{ color: '#EF4444', fontSize: '0.9rem' }}>{mensaje.texto}</p>}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-hero" type="button" onClick={() => cambiarModo('ingresar')}>
                  Ya lo confirmé, ingresar
                </button>
                <button type="button" onClick={reenviarCorreo} disabled={reenviando}>
                  {reenviando ? 'Enviando...' : 'Reenviar correo'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ─── Ingresar o registrarse ─── */}
              <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.35rem' }}>
                {registrando ? 'Crea tu cuenta' : 'Ingresar'}
              </h1>
              <p style={{ color: '#64748B', margin: '0 0 1.5rem' }}>
                {registrando
                  ? 'Un mes gratis del plan Negocio. Sin tarjeta.'
                  : 'Mi contabilidad en el bolsillo.'}
              </p>

              <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    autoComplete="email"
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
                    autoComplete={registrando ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  {registrando && (
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#A3AFBF', marginTop: '0.25rem' }}>
                      Al menos 6 caracteres.
                    </span>
                  )}
                </label>

                {mensaje && (
                  <div>
                    <p style={{ color: '#EF4444', margin: '0.25rem 0 0', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      {mensaje.texto}
                    </p>

                    {mensaje.ofrecerReenvio && (
                      <button
                        type="button"
                        onClick={reenviarCorreo}
                        disabled={reenviando}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#1F3A5F',
                          padding: 0,
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          marginTop: '0.35rem',
                        }}
                      >
                        {reenviando ? 'Enviando...' : 'Reenviar el correo de confirmación'}
                      </button>
                    )}

                    {mensaje.ofrecerIngreso && (
                      <button
                        type="button"
                        onClick={() => cambiarModo('ingresar')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#1F3A5F',
                          padding: 0,
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          marginTop: '0.35rem',
                        }}
                      >
                        Ir a ingresar
                      </button>
                    )}
                  </div>
                )}

                {aviso && (
                  <p
                    style={{
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 10,
                      padding: '0.6rem 0.8rem',
                      color: '#15803D',
                      fontSize: '0.88rem',
                      margin: 0,
                    }}
                  >
                    {aviso}
                  </p>
                )}

                {/* Un solo botón: así Enter hace lo que el usuario
                    espera, en vez de disparar el primero que
                    encuentre en el formulario. */}
                <button className="btn-hero" type="submit" disabled={cargando} style={{ marginTop: '0.5rem' }}>
                  {cargando
                    ? registrando
                      ? 'Creando cuenta...'
                      : 'Entrando...'
                    : registrando
                    ? 'Crear mi cuenta'
                    : 'Ingresar'}
                </button>

                {registrando && (
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                    Al crear tu cuenta aceptas nuestros{' '}
                    <Link to="/terminos" target="_blank">
                      términos y condiciones
                    </Link>{' '}
                    y nuestra{' '}
                    <Link to="/privacidad" target="_blank">
                      política de privacidad
                    </Link>
                    .
                  </p>
                )}
              </form>

              {/* Cambiar de modo */}
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid #E6ECF3',
                  textAlign: 'center',
                }}
              >
                {registrando ? (
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748B' }}>
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => cambiarModo('ingresar')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1F3A5F',
                        padding: 0,
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        textDecoration: 'underline',
                      }}
                    >
                      Ingresa aquí
                    </button>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748B' }}>
                    ¿Primera vez?{' '}
                    <button
                      type="button"
                      onClick={() => cambiarModo('registrar')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#F2555A',
                        padding: 0,
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        textDecoration: 'underline',
                      }}
                    >
                      Crea tu cuenta gratis
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {modo !== 'ingresar' && (
            <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link
                to="/"
                style={{
                  fontSize: '0.85rem',
                  color: '#A3AFBF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ArrowLeft size={14} strokeWidth={2} />
                Volver al inicio
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
