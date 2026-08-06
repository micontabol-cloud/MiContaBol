import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

function normalizar(s) {
  return (s || '').trim().toLowerCase()
}

export default function Clientes() {
  const { id: empresaId } = useParams()
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [cxc, setCxc] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [nitCi, setNitCi] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: cl, error: errCl }, { data: v }, { data: c }] = await Promise.all([
      supabase.from('clientes').select('*').eq('empresa_id', empresaId).order('nombre'),
      supabase
        .from('comprobantes')
        .select('cliente_proveedor, monto_total')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'venta'),
      supabase.from('vista_cuentas_por_cobrar').select('cliente_proveedor, saldo_pendiente').eq('empresa_id', empresaId),
    ])
    if (errCl) setError(errCl.message)
    setClientes(cl || [])
    setVentas(v || [])
    setCxc(c || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  function totalCompradoDe(nombreCliente) {
    return ventas
      .filter((v) => normalizar(v.cliente_proveedor) === normalizar(nombreCliente))
      .reduce((sum, v) => sum + Number(v.monto_total), 0)
  }

  function saldoPendienteDe(nombreCliente) {
    return cxc
      .filter((c) => normalizar(c.cliente_proveedor) === normalizar(nombreCliente))
      .reduce((sum, c) => sum + Number(c.saldo_pendiente), 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('clientes').insert({
      empresa_id: empresaId,
      nombre,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      nit_ci: nitCi || null,
    })

    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }

    setNombre('')
    setTelefono('')
    setEmail('')
    setDireccion('')
    setNitCi('')
    cargar()
  }

  async function alternarActivo(c) {
    setError(null)
    const { error } = await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    if (error) {
      setError(error.message)
      return
    }
    cargar()
  }

  const clientesVisibles = clientes.filter((c) => mostrarInactivos || c.activo)

  const conMetricas = clientes
    .filter((c) => c.activo)
    .map((c) => ({ ...c, total: totalCompradoDe(c.nombre), pendiente: saldoPendienteDe(c.nombre) }))

  const mejores = conMetricas.filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
  const deudores = conMetricas.filter((c) => c.pendiente > 0.005).sort((a, b) => b.pendiente - a.pendiente).slice(0, 5)
  const totalDeuda = conMetricas.reduce((s, c) => s + c.pendiente, 0)

  const hallazgos = []
  if (mejores.length > 0) {
    hallazgos.push({
      color: '#22C55E',
      texto: (
        <>
          Tu mejor cliente es <strong>{mejores[0].nombre}</strong> con {fmt(mejores[0].total)} en compras.
        </>
      ),
    })
  }
  if (deudores.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          <strong>{deudores.length}</strong> {deudores.length === 1 ? 'cliente te debe' : 'clientes te deben'} en
          total {fmt(totalDeuda)}.
        </>
      ),
    })
  }
  if (clientes.filter((c) => c.activo).length === 0) {
    hallazgos.push({ color: '#64748B', texto: 'Todavía no tienes clientes registrados.' })
  }

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Clientes"
        pregunta="¿Quiénes son tus mejores clientes?"
        pose={deudores.length > 0 ? 'pensando' : 'agradecido'}
        hallazgos={hallazgos}
        mensajeVacio="Nadie te debe nada — todos al día."
      />

      {mejores.length > 0 && (
        <div className="panel-cards" style={{ margin: '1.75rem 0' }}>
          <section className="panel-card">
            <h3>Los que más te compran</h3>
            <ul className="panel-lista">
              {mejores.map((c) => (
                <li key={c.id}>
                  <span>{c.nombre}</span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{fmt(c.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-card">
            <h3>Los que te deben</h3>
            {deudores.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Nadie te debe nada.</p>
            ) : (
              <ul className="panel-lista">
                {deudores.map((c) => (
                  <li key={c.id}>
                    <span>{c.nombre}</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{fmt(c.pendiente)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <Link to={`/empresas/${empresaId}/cuentas-por-cobrar`}>Ir a cobrar &rarr;</Link>
            </p>
          </section>
        </div>
      )}

      <h2>Directorio</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', margin: '1.5rem 0' }}
      >
        <label>
          Nombre
          <br />
          <input required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: 180 }} />
        </label>
        <label>
          Teléfono
          <br />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ width: 130 }} />
        </label>
        <label>
          Email
          <br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: 180 }} />
        </label>
        <label>
          NIT/CI
          <br />
          <input value={nitCi} onChange={(e) => setNitCi(e.target.value)} style={{ width: 110 }} />
        </label>
        <label>
          Dirección
          <br />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ width: 200 }} />
        </label>
        <button type="submit" disabled={guardando}>
          Agregar cliente
        </button>
      </form>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={mostrarInactivos}
          onChange={(e) => setMostrarInactivos(e.target.checked)}
        />{' '}
        Mostrar clientes desactivados
      </label>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : clientesVisibles.length === 0 ? (
        <p>Todavía no tienes clientes registrados. Agrega el primero arriba.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Teléfono</th>
              <th style={{ padding: '4px 8px' }}>Email</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total comprado</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo pendiente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientesVisibles.map((c) => {
              const pendiente = saldoPendienteDe(c.nombre)
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3', opacity: c.activo ? 1 : 0.5 }}>
                  <td style={{ padding: '4px 8px' }}>{c.nombre}</td>
                  <td style={{ padding: '4px 8px' }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '4px 8px' }}>{c.email || '—'}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{totalCompradoDe(c.nombre).toFixed(2)}</td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color: pendiente > 0.005 ? '#EF4444' : undefined,
                    }}
                  >
                    {pendiente.toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <button type="button" onClick={() => alternarActivo(c)}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.8rem', marginTop: '1.5rem' }}>
        Nota: el total comprado y el saldo pendiente se calculan comparando este nombre con el que escribiste en
        cada venta. Si lo escribes distinto entre ventas (mayúsculas/espacios no importan, pero errores de tipeo
        sí), esa venta no se va a agrupar automáticamente con este cliente.
      </p>
    </main>
  )
}
