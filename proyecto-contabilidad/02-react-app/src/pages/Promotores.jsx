import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

/**
 * Versión de diagnóstico.
 *
 * Muestra en pantalla lo que está pasando, en vez de quedar en
 * blanco cuando algo falla. Cuando confirmemos que funciona,
 * volvemos a la versión completa.
 */
export default function Promotores() {
  const { id: empresaId } = useParams()

  const [paso, setPaso] = useState('iniciando')
  const [rol, setRol] = useState(null)
  const [datos, setDatos] = useState(null)
  const [errores, setErrores] = useState([])

  useEffect(() => {
    async function probar() {
      const fallos = []

      // 1. ¿Hay sesión?
      setPaso('verificando sesión')
      const { data: sesion } = await supabase.auth.getSession()
      if (!sesion?.session) {
        fallos.push('No hay sesión iniciada')
      }

      // 2. ¿Qué rol tengo?
      setPaso('consultando rol')
      const { data: r, error: errRol } = await supabase.rpc('rol_en_empresa', {
        p_empresa_id: empresaId,
      })
      if (errRol) fallos.push(`rol_en_empresa: ${errRol.message}`)
      setRol(r)

      // 3. El resumen
      setPaso('cargando promotores')
      const { data: d, error: errDatos } = await supabase.rpc('resumen_promotores', {
        p_empresa_id: empresaId,
      })
      if (errDatos) fallos.push(`resumen_promotores: ${errDatos.message}`)
      setDatos(d)

      setErrores(fallos)
      setPaso('listo')
    }

    probar().catch((e) => {
      setErrores([`Error inesperado: ${e.message}`])
      setPaso('falló')
    })
  }, [empresaId])

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h1>Promotores</h1>

      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 12,
          padding: '1.15rem',
          marginTop: '1rem',
          fontSize: '0.92rem',
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>Diagnóstico</p>

        <p style={{ margin: '0.6rem 0 0' }}>
          Paso actual: <strong>{paso}</strong>
        </p>

        <p style={{ margin: 0 }}>
          Empresa: <code style={{ fontSize: '0.85rem' }}>{empresaId || '(sin id)'}</code>
        </p>

        <p style={{ margin: 0 }}>
          Tu rol:{' '}
          <strong style={{ color: rol ? '#22C55E' : '#EF4444' }}>{rol || 'no se pudo obtener'}</strong>
        </p>

        <p style={{ margin: 0 }}>
          Promotores encontrados:{' '}
          <strong>{datos?.promotores ? datos.promotores.length : 'no se pudo cargar'}</strong>
        </p>
      </div>

      {errores.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.07)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 12,
            padding: '1.15rem',
            marginTop: '1rem',
          }}
        >
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#B91C1C' }}>Lo que falló</p>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#253046', lineHeight: 1.7 }}>
            {errores.map((e, i) => (
              <li key={i} style={{ fontSize: '0.9rem' }}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {paso === 'listo' && errores.length === 0 && (
        <p
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: '0.9rem 1.1rem',
            color: '#15803D',
            marginTop: '1rem',
          }}
        >
          Todo funciona. Avísame y te paso la pantalla completa.
        </p>
      )}

      {datos && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#64748B', fontSize: '0.9rem' }}>
            Ver los datos que devolvió
          </summary>
          <pre
            style={{
              background: '#F7F9FC',
              border: '1px solid #E6ECF3',
              borderRadius: 10,
              padding: '0.9rem',
              fontSize: '0.8rem',
              overflow: 'auto',
              marginTop: '0.5rem',
            }}
          >
            {JSON.stringify(datos, null, 2)}
          </pre>
        </details>
      )}
    </main>
  )
}
