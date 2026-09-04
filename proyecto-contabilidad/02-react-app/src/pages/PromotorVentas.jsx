import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fechaCorta = (iso) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('T')[0].split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${Number(d)} ${meses[Number(m) - 1]}`
}

export default function PromotorVentas() {
  const { id: empresaId } = useParams()

  const [ventas, setVentas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const [{ data: v, error: errV }, { data: r }] = await Promise.all([
        supabase.rpc('mis_ventas_promotor'),
        supabase.rpc('mi_resumen_promotor'),
      ])

      if (errV) setError(errV.message)
      setVentas(v || [])
      setResumen(r)
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) {
    return (
      <main style={{ maxWidth: 850, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  const totalCobrado = ventas.reduce((s, v) => s + Number(v.cobraste || 0), 0)
  const totalGanancia = ventas.reduce((s, v) => s + Number(v.tu_ganancia || 0), 0)

  return (
    <main style={{ maxWidth: 850, fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: 0 }}>Mis ventas</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 1.5rem' }}>Lo que llevas vendido este mes.</p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {ventas.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <p className="stat-label">Cobraste</p>
            <p className="stat-value">{fmt(totalCobrado)}</p>
          </div>
          <div className="stat-card destacada-utilidad">
            <p className="stat-label">Tu ganancia</p>
            <p className="stat-value" style={{ color: '#22C55E' }}>
              {fmt(totalGanancia)}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Ventas</p>
            <p className="stat-value">{ventas.length}</p>
          </div>
        </div>
      )}

      {ventas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <ShoppingCart size={44} strokeWidth={1.4} style={{ color: '#A3AFBF' }} />
          <p style={{ color: '#64748B', marginTop: '0.75rem' }}>Todavía no registraste ninguna venta este mes.</p>

          <Link to={`/empresas/${empresaId}/promotor/vender`}>
            <button className="btn-hero" type="button" style={{ marginTop: '1rem' }}>
              Registrar la primera
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {ventas.map((v) => (
              <div
                key={v.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 12,
                  padding: '0.9rem 1.15rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                      {v.cliente || 'Cliente'}
                      <span style={{ color: '#A3AFBF', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        {fechaCorta(v.fecha)}
                      </span>
                    </p>

                    {v.productos && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>{v.productos}</p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>{fmt(v.cobraste)}</p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#22C55E', fontWeight: 600 }}>
                      ganaste {fmt(v.tu_ganancia)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to={`/empresas/${empresaId}/promotor/vender`}>
            <button
              className="btn-hero"
              type="button"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Plus size={19} strokeWidth={2.5} />
              Registrar una venta
            </button>
          </Link>
        </>
      )}
    </main>
  )
}
