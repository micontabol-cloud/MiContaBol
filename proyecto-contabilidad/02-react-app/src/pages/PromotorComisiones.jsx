import { useEffect, useState } from 'react'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotorComisiones() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase.rpc('mis_comisiones_promotor', { p_meses: 12 })
      if (err) setError(err.message)
      setDatos(data)
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) {
    return (
      <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#EF4444' }}>{error}</p>
      </main>
    )
  }

  const meses = datos?.meses || []
  const maxComision = Math.max(...meses.map((m) => Number(m.comision) || 0), 1)

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Lo que he ganado</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0' }}>Tus comisiones mes a mes.</p>
        </div>

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.88rem',
            background: visible ? 'rgba(34,197,94,0.08)' : '#FFFFFF',
            borderColor: visible ? 'rgba(34,197,94,0.4)' : undefined,
            color: visible ? '#15803D' : '#64748B',
          }}
        >
          {visible ? <Eye size={16} strokeWidth={1.9} /> : <EyeOff size={16} strokeWidth={1.9} />}
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {!visible ? (
        <div
          style={{
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 16,
            padding: '3rem 1.5rem',
            marginTop: '1.5rem',
            textAlign: 'center',
          }}
        >
          <EyeOff size={32} strokeWidth={1.5} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Tus números están ocultos. Toca <strong>Mostrar</strong> cuando estés en un lugar donde nadie más vea
            la pantalla.
          </p>
        </div>
      ) : (
        <>
          {/* Total */}
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.07)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 16,
              padding: '1.75rem',
              textAlign: 'center',
              marginTop: '1.5rem',
            }}
          >
            <TrendingUp size={28} strokeWidth={1.8} style={{ color: '#22C55E' }} />
            <p style={{ margin: '0.6rem 0 0', color: '#64748B', fontSize: '0.95rem' }}>
              Ganaste en total, desde que empezaste
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '2.2rem', fontWeight: 800, color: '#22C55E' }}>
              {fmt(datos?.total_historico)}
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: '#64748B' }}>
              Ganas el {datos?.descuento}% de cada venta
            </p>
          </div>

          {meses.length === 0 ? (
            <p style={{ color: '#64748B', textAlign: 'center', padding: '2.5rem 0' }}>
              Todavía no tienes ventas registradas.
            </p>
          ) : (
            <>
              {/* Gráfico */}
              <section style={{ marginTop: '2rem' }}>
                <h2 style={{ marginTop: 0 }}>Cómo vienes</h2>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6ECF3',
                    borderRadius: 16,
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: 120 }}>
                    {[...meses].reverse().map((m) => {
                      const v = Number(m.comision) || 0
                      const alto = Math.max(4, (v / maxComision) * 88)

                      return (
                        <div
                          key={m.mes}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#22C55E',
                              marginBottom: '0.25rem',
                            }}
                          >
                            {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              height: `${alto}px`,
                              background: '#22C55E',
                              opacity: 0.85,
                              borderRadius: '5px 5px 0 0',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#64748B',
                              marginTop: '0.35rem',
                              textAlign: 'center',
                            }}
                          >
                            {m.etiqueta?.split(' ')[0]?.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              {/* Detalle por mes */}
              <section style={{ marginTop: '2rem' }}>
                <h2 style={{ marginTop: 0 }}>Mes a mes</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {meses.map((m) => (
                    <div
                      key={m.mes}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E6ECF3',
                        borderRadius: 12,
                        padding: '1rem 1.15rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F', textTransform: 'capitalize' }}>
                          {m.etiqueta}
                        </p>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#22C55E' }}>
                          {fmt(m.comision)}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '1.25rem',
                          flexWrap: 'wrap',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#64748B',
                        }}
                      >
                        <span>
                          {m.ventas} {Number(m.ventas) === 1 ? 'venta' : 'ventas'}
                        </span>
                        <span>{m.unidades} unidades</span>
                        <span>Cobraste {fmt(m.cobraste)}</span>
                        <span>Entregaste {fmt(m.pagaste)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}
