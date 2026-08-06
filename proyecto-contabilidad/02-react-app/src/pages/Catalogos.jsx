import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const TIPOS = [
  { valor: 'catalogo', label: 'Catálogo', ayuda: 'Tus productos con foto y precio.' },
  { valor: 'oferta', label: 'Oferta por tiempo limitado', ayuda: 'Precio rebajado con fecha de fin.' },
  { valor: 'liquidacion', label: 'Liquidación', ayuda: 'Para sacar lo que no rota.' },
  { valor: 'lista_precios', label: 'Lista de precios', ayuda: 'Sin fotos, compacta. Para mayoristas.' },
]

export default function Catalogos() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()
  const [catalogos, setCatalogos] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('catalogo')
  const [fechaFin, setFechaFin] = useState('')
  const [creando, setCreando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [catRes, empRes] = await Promise.all([
      supabase
        .from('catalogos')
        .select('*, catalogo_items(id)')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false }),
      supabase.from('empresas').select('nombre, whatsapp').eq('id', empresaId).single(),
    ])
    if (catRes.error) setError(catRes.error.message)
    setCatalogos(catRes.data || [])
    setEmpresa(empRes.data)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function crear(e) {
    e.preventDefault()
    setError(null)
    setCreando(true)

    const { data, error } = await supabase.rpc('crear_catalogo', {
      p_empresa_id: empresaId,
      p_nombre: nombre,
      p_tipo: tipo,
      p_fecha_fin: fechaFin || null,
    })

    setCreando(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/catalogos/${data}`)
  }

  const publicados = catalogos.filter((c) => c.publicado)

  const hallazgos = []
  if (!empresa?.whatsapp) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          Falta tu número de WhatsApp: sin él, tus clientes no pueden consultarte desde el catálogo.{' '}
          <Link to={`/empresas/${empresaId}/catalogos/whatsapp`}>Agregarlo</Link>
        </>
      ),
    })
  }
  if (publicados.length > 0) {
    hallazgos.push({
      color: '#22C55E',
      texto: (
        <>
          Tienes <strong>{publicados.length}</strong> {publicados.length === 1 ? 'catálogo publicado' : 'catálogos publicados'} listos para compartir.
        </>
      ),
    })
  }

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Catálogo"
        pregunta="¿Qué le vas a mostrar hoy a tus clientes?"
        pose={publicados.length > 0 ? 'exito' : 'consejo'}
        hallazgos={hallazgos}
        mensajeVacio="Arma tu primer catálogo y compártelo por WhatsApp."
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

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
          Eliges productos de tu inventario, publicas, y obtienes un enlace para mandar por WhatsApp. Tus clientes lo
          abren en el celular y ven fotos y precios actualizados. Al tocar un producto te escriben directo.
        </p>
      </div>

      <h2>Crear uno nuevo</h2>
      <form onSubmit={crear} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label>
          Nombre
          <br />
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Ofertas de agosto"
            style={{ width: 210 }}
          />
        </label>
        <label>
          Tipo
          <br />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
          <span style={{ display: 'block', fontSize: '0.78rem', color: '#A3AFBF', marginTop: '0.2rem' }}>
            {TIPOS.find((t) => t.valor === tipo)?.ayuda}
          </span>
        </label>
        <label>
          Termina el (opcional)
          <br />
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </label>
        <button className="btn-hero" type="submit" disabled={creando}>
          Crear y elegir productos
        </button>
      </form>

      <h2 style={{ marginTop: '2rem' }}>Tus catálogos</h2>
      {cargando ? (
        <p>Cargando...</p>
      ) : catalogos.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no has creado ninguno.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Productos</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {catalogos.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.nombre}</td>
                <td style={{ padding: '6px 8px', color: '#64748B', fontSize: '0.88rem' }}>
                  {TIPOS.find((t) => t.valor === c.tipo)?.label}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{c.catalogo_items?.length || 0}</td>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    className="chip-estado"
                    style={
                      c.publicado
                        ? { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                        : { background: '#F7F9FC', color: '#64748B' }
                    }
                  >
                    {c.publicado ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <Link to={`/empresas/${empresaId}/catalogos/${c.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
