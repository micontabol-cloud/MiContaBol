import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function normalizar(s) {
  return (s || '').trim().toLowerCase()
}

export default function Proveedores() {
  const { id: empresaId } = useParams()
  const [proveedores, setProveedores] = useState([])
  const [resumen, setResumen] = useState(new Map())
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
      supabase.from('proveedores').select('*').eq('empresa_id', empresaId).order('nombre'),
      supabase.from('vista_resumen_proveedores').select('*').eq('empresa_id', empresaId),
      supabase.from('vista_cuentas_por_pagar').select('proveedor_id, saldo_pendiente').eq('empresa_id', empresaId),
    ])
    if (errCl) setError(errCl.message)
    setProveedores(cl || [])
    setResumen(new Map((v || []).map((r) => [r.proveedor_id, r])))
    setCxc(c || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  function totalCompradoA(proveedor) {
    return Number(resumen.get(proveedor.id)?.total_comprado || 0)
  }

  function saldoPendienteDe(proveedor) {
    return cxc
      .filter((c) => c.proveedor_id === proveedor.id)
      .reduce((sum, c) => sum + Number(c.saldo_pendiente), 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('proveedores').insert({
      empresa_id: empresaId,
      nombre,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      nit: nitCi || null,
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
    const { error } = await supabase.from('proveedores').update({ activo: !c.activo }).eq('id', c.id)
    if (error) {
      setError(error.message)
      return
    }
    cargar()
  }

  const proveedoresVisibles = proveedores.filter((c) => mostrarInactivos || c.activo)

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <h1>Proveedores</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Para registrar pagos de compras a crédito, ve a{' '}
        <Link to={`/empresas/${empresaId}/cuentas-por-pagar`}>Cuentas por pagar</Link>.
      </p>

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
          NIT
          <br />
          <input value={nitCi} onChange={(e) => setNitCi(e.target.value)} style={{ width: 110 }} />
        </label>
        <label>
          Dirección
          <br />
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ width: 200 }} />
        </label>
        <button type="submit" disabled={guardando}>
          Agregar proveedor
        </button>
      </form>

      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={mostrarInactivos}
          onChange={(e) => setMostrarInactivos(e.target.checked)}
        />{' '}
        Mostrar proveedores desactivados
      </label>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : proveedoresVisibles.length === 0 ? (
        <p>Todavía no tienes proveedores registrados. Agrega el primero arriba.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Nombre</th>
              <th style={{ padding: '4px 8px' }}>Teléfono</th>
              <th style={{ padding: '4px 8px' }}>Email</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Total comprado a él</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo pendiente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {proveedoresVisibles.map((c) => {
              const pendiente = saldoPendienteDe(c)
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3', opacity: c.activo ? 1 : 0.5 }}>
                  <td style={{ padding: '4px 8px' }}>{c.nombre}</td>
                  <td style={{ padding: '4px 8px' }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '4px 8px' }}>{c.email || '—'}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{totalCompradoA(c).toFixed(2)}</td>
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
        Los totales agrupan solo las compras donde elegiste a este proveedor de la lista. Las compras viejas,
        donde el nombre se escribía a mano, quedaron enlazadas automáticamente si el nombre coincidía.
      </p>
    </main>
  )
}
