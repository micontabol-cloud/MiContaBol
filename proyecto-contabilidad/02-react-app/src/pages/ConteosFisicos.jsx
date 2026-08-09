import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

export default function ConteosFisicos() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()
  const [conteos, setConteos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [categoriaId, setCategoriaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [iniciando, setIniciando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [conteosRes, catRes] = await Promise.all([
      supabase
        .from('conteos_fisicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false }),
      supabase.from('categorias_producto').select('*').eq('empresa_id', empresaId).eq('activo', true).order('nombre'),
    ])
    if (conteosRes.error) setError(conteosRes.error.message)
    setConteos(conteosRes.data || [])
    setCategorias(catRes.data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const abierto = conteos.find((c) => c.estado === 'abierto')

  async function iniciar(e) {
    e.preventDefault()
    setError(null)
    setIniciando(true)

    const { data, error } = await supabase.rpc('iniciar_conteo', {
      p_empresa_id: empresaId,
      p_categoria_id: categoriaId || null,
      p_nombre: nombre || null,
    })

    setIniciando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/inventario/conteos/${data}`)
  }

  const hallazgos = abierto
    ? [
        {
          color: '#F59E0B',
          texto: (
            <>
              Tienes un conteo <strong>en curso</strong> desde el {abierto.fecha}. Puedes seguir donde lo dejaste.
            </>
          ),
        },
      ]
    : []

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Conteo físico"
        pregunta="¿Lo que dice el sistema coincide con lo que hay en el estante?"
        pose={abierto ? 'revisando' : 'consejo'}
        hallazgos={hallazgos}
        mensajeVacio="No tienes conteos en curso."
        acciones={
          abierto && (
            <Link to={`/empresas/${empresaId}/inventario/conteos/${abierto.id}`}>
              <button className="btn-hero">Seguir contando</button>
            </Link>
          )
        }
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {!abierto && (
        <>
          <div
            style={{
              background: '#F7F9FC',
              border: '1px solid #E6ECF3',
              borderRadius: 16,
              padding: '1.15rem',
              margin: '1.5rem 0',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
              Contar todo el negocio de una vez es agotador. Lo que funciona en la práctica es contar{' '}
              <strong>una categoría por vez</strong> — por ejemplo, lácteos esta semana y bebidas la próxima. Puedes
              dejar el conteo a medias y seguir después.
            </p>
          </div>

          <h2>Empezar un conteo</h2>
          <form onSubmit={iniciar} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label>
              ¿Qué vas a contar?
              <br />
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Todo el inventario</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    Solo {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre (opcional)
              <br />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Conteo de agosto"
                style={{ width: 200 }}
              />
            </label>
            <button className="btn-hero" type="submit" disabled={iniciando}>
              Empezar a contar
            </button>
          </form>
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Conteos anteriores</h2>
      {cargando ? (
        <p>Cargando...</p>
      ) : conteos.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no has hecho ningún conteo.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {conteos.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '6px 8px' }}>{c.fecha}</td>
                <td style={{ padding: '6px 8px' }}>{c.nombre || '—'}</td>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    className="chip-estado"
                    style={
                      c.estado === 'abierto'
                        ? { background: 'rgba(245, 158, 11, 0.15)', color: '#8a5a00' }
                        : c.estado === 'cerrado'
                        ? { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                        : { background: '#F7F9FC', color: '#64748B' }
                    }
                  >
                    {c.estado === 'abierto' ? 'En curso' : c.estado === 'cerrado' ? 'Cerrado' : 'Cancelado'}
                  </span>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <Link to={`/empresas/${empresaId}/inventario/conteos/${c.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
