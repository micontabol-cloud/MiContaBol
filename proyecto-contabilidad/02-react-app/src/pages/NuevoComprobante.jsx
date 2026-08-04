import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function NuevoComprobante() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [tipo, setTipo] = useState('venta')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [clienteProveedor, setClienteProveedor] = useState('')
  const [concepto, setConcepto] = useState('')
  const [montoTotal, setMontoTotal] = useState('')
  const [cuentaPrincipalId, setCuentaPrincipalId] = useState('')
  const [cuentaContrapartidaId, setCuentaContrapartidaId] = useState('')

  const [cuentas, setCuentas] = useState([])
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargarCuentas() {
      const { data } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo')
        .eq('empresa_id', empresaId)
        .eq('permite_movimiento', true)
        .eq('activo', true)
        .order('codigo')
      setCuentas(data || [])
    }
    cargarCuentas()
  }, [empresaId])

  const cuentasPrincipales = cuentas.filter((c) => c.tipo === (tipo === 'venta' ? 'ingreso' : 'gasto'))
  const cuentasContrapartida = cuentas.filter((c) => c.tipo === 'activo' || c.tipo === 'pasivo')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!cuentaPrincipalId || !cuentaContrapartidaId) {
      setError('Selecciona ambas cuentas antes de continuar.')
      return
    }

    setGuardando(true)

    const { error } = await supabase.rpc('crear_comprobante_con_asiento', {
      p_empresa_id: empresaId,
      p_tipo: tipo,
      p_fecha: fecha,
      p_cliente_proveedor: clienteProveedor || null,
      p_concepto: concepto || null,
      p_monto_total: parseFloat(montoTotal),
      p_cuenta_principal_id: cuentaPrincipalId,
      p_cuenta_contrapartida_id: cuentaContrapartidaId,
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate(`/empresas/${empresaId}/comprobantes`)
  }

  return (
    <main style={{ maxWidth: 480, margin: '3rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}/comprobantes`}>&larr; Volver</Link>
      </p>
      <h1>Nueva {tipo === 'venta' ? 'venta' : 'compra'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Tipo
          <br />
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value)
              setCuentaPrincipalId('')
            }}
            style={{ width: '100%' }}
          >
            <option value="venta">Venta</option>
            <option value="compra">Compra</option>
          </select>
        </label>

        <label>
          Fecha
          <br />
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>

        <label>
          {tipo === 'venta' ? 'Cliente' : 'Proveedor'}
          <br />
          <input
            value={clienteProveedor}
            onChange={(e) => setClienteProveedor(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Concepto
          <br />
          <input value={concepto} onChange={(e) => setConcepto(e.target.value)} style={{ width: '100%' }} />
        </label>

        <label>
          Monto total
          <br />
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        <label>
          {tipo === 'venta' ? 'Cuenta de ingreso' : 'Cuenta de gasto'}
          <br />
          <select
            required
            value={cuentaPrincipalId}
            onChange={(e) => setCuentaPrincipalId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">-- Selecciona --</option>
            {cuentasPrincipales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
          {cuentasPrincipales.length === 0 && (
            <span style={{ color: '#EF4444', fontSize: '0.85em' }}>
              No tienes cuentas de tipo {tipo === 'venta' ? 'ingreso' : 'gasto'} todavía — agrega una en Plan de
              cuentas primero.
            </span>
          )}
        </label>

        <label>
          {tipo === 'venta' ? 'Cuenta que recibe el pago' : 'Cuenta con la que pagas'}
          <br />
          <select
            required
            value={cuentaContrapartidaId}
            onChange={(e) => setCuentaContrapartidaId(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">-- Selecciona --</option>
            {cuentasContrapartida.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>

        {error && <p style={{ color: '#EF4444' }}>{error}</p>}

        <button type="submit" disabled={guardando}>
          Registrar {tipo === 'venta' ? 'venta' : 'compra'}
        </button>
      </form>
    </main>
  )
}
