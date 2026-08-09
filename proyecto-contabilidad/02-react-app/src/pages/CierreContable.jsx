import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PanelModulo from '../components/PanelModulo'
import AsientoPreview from '../components/AsientoPreview'

const fmt = (n) => `Bs ${Number(n || 0).toFixed(2)}`

function finDeAnioPasado() {
  const hoy = new Date()
  return `${hoy.getFullYear() - 1}-12-31`
}

export default function CierreContable() {
  const { id: empresaId } = useParams()
  const [cierres, setCierres] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [cuentaResultados, setCuentaResultados] = useState(null)
  const [fechaCierre, setFechaCierre] = useState(finDeAnioPasado())
  const [previa, setPrevia] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [cierresRes, empRes] = await Promise.all([
      supabase.from('cierres_contables').select('*').eq('empresa_id', empresaId).order('fecha_cierre', { ascending: false }),
      supabase.from('empresas').select('*').eq('id', empresaId).single(),
    ])

    setCierres(cierresRes.data || [])
    setEmpresa(empRes.data)

    if (empRes.data?.cuenta_resultados_id) {
      const { data } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre')
        .eq('id', empRes.data.cuenta_resultados_id)
        .single()
      setCuentaResultados(data)
    }

    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function calcularPrevia() {
    setError(null)
    setAviso(null)
    setConfirmando(false)
    setCalculando(true)

    const { data, error } = await supabase.rpc('previsualizar_cierre', {
      p_empresa_id: empresaId,
      p_fecha_cierre: fechaCierre,
    })

    setCalculando(false)

    if (error) {
      setError(error.message)
      setPrevia(null)
      return
    }

    if (!data || data.length === 0) {
      setPrevia(null)
      setAviso('No hay movimientos de ingresos ni gastos para cerrar en ese período.')
      return
    }

    setPrevia(data)
  }

  async function ejecutarCierre() {
    setError(null)
    setCerrando(true)

    const { error } = await supabase.rpc('cerrar_ejercicio', {
      p_empresa_id: empresaId,
      p_fecha_cierre: fechaCierre,
    })

    setCerrando(false)

    if (error) {
      setError(error.message)
      return
    }

    setPrevia(null)
    setConfirmando(false)
    setAviso('Ejercicio cerrado. Tu Estado de Resultados arranca de nuevo desde la fecha siguiente.')
    cargar()
  }

  const ingresos = (previa || []).filter((f) => f.tipo === 'ingreso')
  const gastos = (previa || []).filter((f) => f.tipo === 'gasto')
  const totalIngresos = ingresos.reduce((s, f) => s + Number(f.saldo), 0)
  const totalGastos = gastos.reduce((s, f) => s + (Number(f.total_debe) - Number(f.total_haber)), 0)
  const utilidad = totalIngresos - totalGastos

  const lineasPreview = previa
    ? [
        ...previa.map((f) => ({
          icono: f.tipo === 'ingreso' ? '📈' : '🧾',
          frase:
            f.tipo === 'ingreso'
              ? `"${f.nombre}" vuelve a cero (tenía ${fmt(Math.abs(f.saldo))}).`
              : `"${f.nombre}" vuelve a cero (tenía ${fmt(Math.abs(Number(f.total_debe) - Number(f.total_haber)))}).`,
          cuenta: { codigo: f.codigo, nombre: f.nombre },
          debe: Number(f.saldo) > 0 ? Number(f.saldo) : 0,
          haber: Number(f.saldo) < 0 ? Math.abs(Number(f.saldo)) : 0,
        })),
        {
          icono: utilidad >= 0 ? '🏦' : '⚠️',
          frase:
            utilidad >= 0
              ? `Tu ganancia de ${fmt(utilidad)} pasa a formar parte de tu patrimonio.`
              : `Tu pérdida de ${fmt(Math.abs(utilidad))} se descuenta de tu patrimonio.`,
          cuenta: cuentaResultados,
          debe: utilidad < 0 ? Math.abs(utilidad) : 0,
          haber: utilidad > 0 ? utilidad : 0,
        },
      ]
    : []

  const ultimoCierre = cierres[0]

  const hallazgos = []
  if (ultimoCierre) {
    hallazgos.push({
      color: '#3B82F6',
      texto: (
        <>
          Tu último cierre fue el <strong>{ultimoCierre.fecha_cierre}</strong>, con una{' '}
          {Number(ultimoCierre.utilidad) >= 0 ? 'ganancia' : 'pérdida'} de{' '}
          <strong>{fmt(Math.abs(ultimoCierre.utilidad))}</strong>.
        </>
      ),
    })
  } else {
    hallazgos.push({
      color: '#64748B',
      texto: 'Todavía no has cerrado ningún ejercicio.',
    })
  }

  if (!empresa?.cuenta_resultados_id && !cargando) {
    hallazgos.push({
      color: '#F59E0B',
      texto: 'Falta configurar tu cuenta de Resultados Acumulados antes de poder cerrar.',
    })
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 900, fontFamily: 'sans-serif' }}>
      <PanelModulo
        titulo="Cierre de ejercicio"
        pregunta="¿Cómo te fue el año y qué queda en tu patrimonio?"
        pose="consejo"
        hallazgos={hallazgos}
      />

      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          padding: '1rem 1.15rem',
          margin: '1.5rem 0',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
          Cerrar el ejercicio pone en cero tus ventas y gastos del período, y traslada la ganancia (o pérdida) a tu
          patrimonio. Después del cierre, ese período queda bloqueado: <strong>ya no podrás registrar movimientos
          con fecha anterior</strong>. Normalmente se hace una vez al año, al 31 de diciembre.
        </p>
      </div>

      <h2>Cerrar un período</h2>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label>
          Cerrar hasta el
          <br />
          <input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
        </label>
        <button type="button" onClick={calcularPrevia} disabled={calculando}>
          Ver qué pasaría
        </button>
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#3B82F6' }}>{aviso}</p>}

      {previa && (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="stat-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card destacada-ventas">
              <p className="stat-label">Ingresos del período</p>
              <p className="stat-value">{fmt(totalIngresos)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Gastos del período</p>
              <p className="stat-value">{fmt(totalGastos)}</p>
            </div>
            <div className="stat-card destacada-utilidad">
              <p className="stat-label">{utilidad >= 0 ? 'Ganancia del período' : 'Pérdida del período'}</p>
              <p className="stat-value" style={{ color: utilidad >= 0 ? '#22C55E' : '#EF4444' }}>
                {fmt(Math.abs(utilidad))}
              </p>
            </div>
          </div>

          <AsientoPreview
            titulo="Esto es lo que va a pasar al cerrar"
            lineas={lineasPreview}
            aviso={!cuentaResultados ? 'Falta configurar la cuenta de Resultados Acumulados.' : null}
          />

          {!confirmando ? (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              disabled={!cuentaResultados}
              style={{ marginTop: '1rem' }}
            >
              Cerrar el ejercicio
            </button>
          ) : (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 12,
              }}
            >
              <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#8a5a00' }}>
                ¿Seguro? Después del cierre no podrás registrar movimientos con fecha hasta el {fechaCierre}, y esto
                no se puede deshacer desde la app.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-hero" onClick={ejecutarCierre} disabled={cerrando}>
                  Sí, cerrar el ejercicio
                </button>
                <button type="button" onClick={() => setConfirmando(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Cierres anteriores</h2>
      {cierres.length === 0 ? (
        <p style={{ color: '#64748B' }}>Todavía no hay cierres registrados.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #E6ECF3' }}>
              <th style={{ padding: '4px 8px' }}>Cerrado hasta</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Ingresos</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Gastos</th>
              <th style={{ padding: '4px 8px', textAlign: 'right' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {cierres.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #E6ECF3' }}>
                <td style={{ padding: '4px 8px' }}>{c.fecha_cierre}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(c.total_ingresos).toFixed(2)}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(c.total_gastos).toFixed(2)}</td>
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: Number(c.utilidad) >= 0 ? '#22C55E' : '#EF4444',
                    fontWeight: 600,
                  }}
                >
                  {Number(c.utilidad).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
