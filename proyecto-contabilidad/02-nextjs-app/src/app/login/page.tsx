import { signIn, signUp } from '@/app/actions/auth'

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Ingresar</h1>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Email
          <input name="email" type="email" required style={{ width: '100%' }} />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required minLength={6} style={{ width: '100%' }} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button formAction={signIn} type="submit">
            Ingresar
          </button>
          <button formAction={signUp} type="submit">
            Crear cuenta
          </button>
        </div>
      </form>
    </main>
  )
}
