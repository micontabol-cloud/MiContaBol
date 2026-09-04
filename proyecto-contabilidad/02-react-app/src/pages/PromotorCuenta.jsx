import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Wallet, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fechaCorta = (iso) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('T')[0].split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${Number(d)} ${meses[Number(m) - 1]}`
}

export default function PromotorCuenta() {
  const { id: empresaId } = useParams()

  const [resumen, setResumen] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const [{ data: r, error: errR }, { data: m }] = await Promise.all([
        supabase.rpc('mi_resumen_promotor'),
        supabase.rpc('mi_cuenta_promotor'),
      ])

      if (errR) setError(errR.message)
      setResumen(r)
      setMovimientos(m || [])
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

  const debe = Number(resumen?.debes || 0)

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: 0 }}>Mi cuenta</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 1.5rem' }}>
        Lo que le debes al negocio por lo que vendiste.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {/* Lo que debe */}
      <div
        style={{
          background: debe > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.07)',
          border: `1px solid ${debe > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: 16,
          padding: '1.75rem',
          textAlign: 'center',
        }}
      >
        {debe > 0 ? (
          <>
            <Wallet size={30} strokeWidth={1.8} style={{ color: '#F59E0B' }} />
            <p style={{ margin: '0.75rem 0 0', color: '#64748B', fontSize: '0.95rem' }}>
              Tienes que entregar
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '2.2rem', fontWeight: 800, color: '#F59E0B' }}>
              {fmt(debe)}
            </p>
            <p
              style={{
                margin: '0.85rem auto 0',
                maxWidth: 420,
                fontSize: '0.92rem',
                color: '#64748B',
                lineHeight: 1.6,
              }}
            >
              Es lo que corresponde al negocio por lo que ya vendiste. Cuando lo entregues, ellos lo registran y
              este monto baja.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 size={30} strokeWidth={1.8} style={{ color: '#22C55E' }} />
            <p style={{ margin: '0.75rem 0 0', fontSize: '1.2rem', fontWeight: 700, color: '#15803D' }}>
              Estás al día
            </p>
            <p style={{ margin: '0.35rem 0 0', color: '#64748B', fontSize: '0.92rem' }}>
              No le debes nada al negocio.
            </p>
          </>
        )}
      </div>

      {/* Cómo funciona */}
      <div
        style={{
          background: '#F7F9FC',
          border: '1px solid #E6ECF3',
          borderRadius: 12,
          padding: '1rem 1.15rem',
          marginTop: '1.25rem',
          fontSize: '0.9rem',
          color: '#64748B',
          lineHeight: 1.6,
        }}
      >
        Ganas el <strong style={{ color: '#1F3A5F' }}>{resumen?.descuento}%</strong> de cada venta. Si vendes algo
        en Bs 285, le entregas Bs {(285 * (1 - Number(resumen?.descuento || 0) / 100)).toFixed(2)} al negocio y te
        quedas con Bs {(285 * (Number(resumen?.descuento || 0) / 100)).toFixed(2)}.
      </div>

      {/* Movimientos */}
      <h2 style={{ marginTop: '2rem' }}>Movimientos</h2>

      {movimientos.length === 0 ? (
        <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem 0' }}>
          Todavía no hay movimientos en tu cuenta.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {movimientos.map((m, i) => {
            const esCargo = Number(m.debe) > 0

            return (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6ECF3',
                  borderRadius: 12,
                  padding: '0.85rem 1.1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
                    {esCargo ? 'Venta registrada' : 'Pago entregado'}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#A3AFBF' }}>
                    {fechaCorta(m.fecha)}
                    {m.detalle && ` · ${m.detalle}`}
                  </p>
                </div>

                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      color: esCargo ? '#F59E0B' : '#22C55E',
                    }}
                  >
                    {esCargo ? '+' : '−'} {fmt(esCargo ? m.debe : m.haber)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#A3AFBF' }}>
                    saldo {fmt(m.saldo)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ color: '#A3AFBF', fontSize: '0.85rem', marginTop: '1.5rem', lineHeight: 1.55 }}>
        Los pagos los registra el negocio cuando les entregas el dinero. Si entregaste algo y no aparece aquí,
        avísales.
      </p>
    </main>
  )
}
