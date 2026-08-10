import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

export default function Bancos() {
  const { id: empresaId } = useParams()
  const navigate = useNavigate()

  const [cuentas, setCuentas] = useState([])
  const [conciliaciones, setConciliaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [banco, setBanco] = useState('')
  const [alias, setAlias] = useState('')
  const [numero, setNumero] = useState('')
  const [tipo, setTipo] = useState('corriente')
  const [creando, setCreando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [saldoDe, setSaldoDe] = useState(null)
  const [saldoInicial, setSaldoInicial] = useState('')
  const [fechaSaldo, setFechaSaldo] = useState(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().slice(0, 10)
  })
  const [guardandoSaldo, setGuardandoSaldo] = useState(false)

  const [conciliarDe, setConciliarDe] = useState(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [saldoExtracto, setSaldoExtracto] = useState('')
  const [abriendo, setAbriendo] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data: cb, error: errCb }, { data: con }] = await Promise.all([
      supabase.rpc('saldos_bancarios', { p_empresa_id: empresaId }),
      supabase
        .from('conciliaciones')
        .select('*, cuentas_bancarias(banco, alias)')
        .eq('empresa_id', empresaId)
        .order('fecha_hasta', { ascending: false })
        .limit(20),
    ])
    if (errCb) setError(errCb.message)
    setCuentas(cb || [])
    setConciliaciones(con || [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function crearCuenta(e) {
    e.preventDefault()
    setError(null)
    setCreando(true)

    const { error } = await supabase.rpc('crear_cuenta_bancaria', {
      p_empresa_id: empresaId,
      p_banco: banco,
      p_alias: alias || null,
      p_numero: numero || null,
      p_tipo: tipo,
    })

    setCreando(false)
    if (error) return setError(error.message)

    setBanco('')
    setAlias('')
    setNumero('')
    setMostrarForm(false)
    cargar()
  }

  async function guardarSaldoInicial(e) {
    e.preventDefault()
    setError(null)
    setGuardandoSaldo(true)

    const { error } = await supabase.rpc('registrar_saldo_inicial_banco', {
      p_cuenta_bancaria_id: saldoDe.id,
      p_saldo: parseFloat(saldoInicial) || 0,
      p_fecha: fechaSaldo,
    })

    setGuardandoSaldo(false)
    if (error) return setError(error.message)

    setSaldoDe(null)
    setSaldoInicial('')
    cargar()
  }

  async function abrirConciliacion(e) {
    e.preventDefault()
    setError(null)
    setAbriendo(true)

    const { data, error } = await supabase.rpc('crear_conciliacion', {
      p_cuenta_bancaria_id: conciliarDe.id,
      p_fecha_desde: desde,
      p_fecha_hasta: hasta,
      p_saldo_extracto: parseFloat(saldoExtracto) || 0,
    })

    setAbriendo(false)
    if (error) return setError(error.message)

    navigate(`/empresas/${empresaId}/bancos/conciliacion/${data}`)
  }

  const totalBancos = cuentas.reduce((s, c) => s + Number(c.saldo), 0)
  const sinApertura = cuentas.filter((c) => !c.tiene_apertura)
  const abierta = conciliaciones.find((c) => c.estado === 'abierta')

  const hallazgos = []
  if (cuentas.length === 0) {
    hallazgos.push({ color: '#64748B', texto: 'Todavía no registraste ninguna cuenta bancaria.' })
  } else {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tienes <strong>{fmt(totalBancos)}</strong> repartidos en {cuentas.length}{' '}
          {cuentas.length === 1 ? 'cuenta' : 'cuentas'}.
        </>
      ),
    })
  }
  if (sinApertura.length > 0) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          <strong>{sinApertura.length}</strong>{' '}
          {sinApertura.length === 1 ? 'cuenta no tiene' : 'cuentas no tienen'} su saldo inicial cargado.
        </>
      ),
    })
  }
  if (abierta) {
    hallazgos.push({
      color: '#F59E0B',
      texto: (
        <>
          Tienes una conciliación <strong>en curso</strong> de{' '}
          {abierta.cuentas_bancarias?.banco}.{' '}
          <Link to={`/empresas/${empresaId}/bancos/conciliacion/${abierta.id}`}>Continuar</Link>
        </>
      ),
    })
  }

  return (
    <main style={{ maxWidth: 950, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Bancos"
        pregunta="¿Lo que dice tu banco coincide con tus libros?"
        pose={sinApertura.length > 0 || abierta ? 'revisando' : 'exito'}
        hallazgos={hallazgos}
        mensajeVacio="Todo conciliado."
        acciones={
          <button type="button" className="btn-hero" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Agregar cuenta bancaria'}
          </button>
        }
      />

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {mostrarForm && (
        <form
          onSubmit={crearCuenta}
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 16,
            padding: '1.15rem',
            margin: '1.5rem 0',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <label>
            Banco
            <br />
            <input
              required
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Banco Nacional de Bolivia"
              style={{ width: 220 }}
            />
          </label>
          <label>
            Alias (opcional)
            <br />
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Cuenta principal"
              style={{ width: 150 }}
            />
          </label>
          <label>
            Número
            <br />
            <input value={numero} onChange={(e) => setNumero(e.target.value)} style={{ width: 150 }} />
          </label>
          <label>
            Tipo
            <br />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="corriente">Corriente</option>
              <option value="ahorro">Caja de ahorro</option>
              <option value="otra">Otra</option>
            </select>
          </label>
          <button className="btn-hero" type="submit" disabled={creando}>
            Agregar
          </button>
          <p style={{ width: '100%', margin: 0, fontSize: '0.82rem', color: '#A3AFBF' }}>
            Se le crea automáticamente su propia cuenta contable, para poder ver y conciliar cada banco por separado.
          </p>
        </form>
      )}

      <h2 style={{ marginTop: '2rem' }}>Tus cuentas</h2>

      {cargando ? (
        <p>Cargando...</p>
      ) : cuentas.length === 0 ? (
        <p style={{ color: '#64748B' }}>Agrega tu primera cuenta con el botón de arriba.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cuentas.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6ECF3',
                borderRadius: 14,
                padding: '1rem 1.15rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
                    {c.banco}
                    {c.alias && <span style={{ color: '#64748B', fontWeight: 400 }}> · {c.alias}</span>}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#A3AFBF' }}>
                    {c.numero && `N° ${c.numero} · `}
                    {c.tipo === 'corriente' ? 'Corriente' : c.tipo === 'ahorro' ? 'Caja de ahorro' : 'Otra'} ·{' '}
                    {c.cuenta_codigo} · {c.movimientos} movimientos
                  </p>
                  {!c.tiene_apertura && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#F59E0B', fontWeight: 600 }}>
                      Falta cargar el saldo inicial
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: Number(c.saldo) >= 0 ? '#1F3A5F' : '#EF4444' }}>
                    {fmt(c.saldo)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#A3AFBF' }}>según tus libros</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                {!c.tiene_apertura && (
                  <button
                    type="button"
                    onClick={() => {
                      setSaldoDe(saldoDe?.id === c.id ? null : c)
                      setConciliarDe(null)
                    }}
                  >
                    Cargar saldo inicial
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConciliarDe(conciliarDe?.id === c.id ? null : c)
                    setSaldoDe(null)
                    const h = new Date()
                    setDesde(new Date(h.getFullYear(), h.getMonth(), 1).toISOString().slice(0, 10))
                    setHasta(new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().slice(0, 10))
                  }}
                >
                  Conciliar
                </button>
                <Link to={`/empresas/${empresaId}/libro-mayor?cuenta=${c.cuenta_id}`}>
                  <button type="button">Ver movimientos</button>
                </Link>
              </div>

              {saldoDe?.id === c.id && (
                <form
                  onSubmit={guardarSaldoInicial}
                  style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}
                >
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: '#64748B' }}>
                    ¿Cuánto tenías en esta cuenta cuando empezaste a usar MiContaBol? Se registra como asiento de
                    apertura contra tu capital.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label>
                      Saldo
                      <br />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saldoInicial}
                        onChange={(e) => setSaldoInicial(e.target.value)}
                        style={{ width: 140 }}
                      />
                    </label>
                    <label>
                      A la fecha
                      <br />
                      <input type="date" required value={fechaSaldo} onChange={(e) => setFechaSaldo(e.target.value)} />
                    </label>
                    <button className="btn-hero" type="submit" disabled={guardandoSaldo}>
                      Guardar
                    </button>
                  </div>
                </form>
              )}

              {conciliarDe?.id === c.id && (
                <form
                  onSubmit={abrirConciliacion}
                  style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #E6ECF3' }}
                >
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: '#64748B' }}>
                    Ten tu extracto bancario a mano. Necesitas el período y el saldo final que muestra el banco.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <label>
                      Desde
                      <br />
                      <input type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
                    </label>
                    <label>
                      Hasta
                      <br />
                      <input type="date" required value={hasta} onChange={(e) => setHasta(e.target.value)} />
                    </label>
                    <label>
                      Saldo del extracto
                      <br />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={saldoExtracto}
                        onChange={(e) => setSaldoExtracto(e.target.value)}
                        placeholder="Lo que dice tu banco"
                        style={{ width: 160 }}
                      />
                    </label>
                    <button className="btn-hero" type="submit" disabled={abriendo}>
                      Empezar conciliación
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Conciliaciones</h2>
      {conciliaciones.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no has conciliado ninguna cuenta.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Cuenta</th>
              <th style={{ padding: '4px 8px' }}>Período</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Saldo del banco</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {conciliaciones.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '6px 8px' }}>
                  {c.cuentas_bancarias?.banco}
                  {c.cuentas_bancarias?.alias && ` · ${c.cuentas_bancarias.alias}`}
                </td>
                <td style={{ padding: '6px 8px', fontSize: '0.9rem' }}>
                  {c.fecha_desde} al {c.fecha_hasta}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(c.saldo_extracto).toFixed(2)}</td>
                <td style={{ padding: '6px 8px' }}>
                  <span
                    className="chip-estado"
                    style={
                      c.estado === 'abierta'
                        ? { background: 'rgba(245, 158, 11, 0.15)', color: '#8a5a00' }
                        : { background: 'rgba(34, 197, 94, 0.12)', color: '#15803D' }
                    }
                  >
                    {c.estado === 'abierta' ? 'En curso' : 'Cerrada'}
                  </span>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <Link to={`/empresas/${empresaId}/bancos/conciliacion/${c.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
