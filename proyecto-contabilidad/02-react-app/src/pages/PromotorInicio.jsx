import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, Wallet, TrendingUp, Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'

const fmt = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotorInicio() {
  const { id: empresaId } = useParams()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase.rpc('mi_resumen_promotor')
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

  const debe = Number(datos?.debes || 0)
  const ganancia = Number(datos?.ganancia_mes || 0)
  const enMano = Number(datos?.consignado || 0)

  return (
    <main style={{ maxWidth: 800, fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: 0 }}>Hola, {datos?.nombre}</h1>
      <p style={{ color: '#64748B', margin: '0.25rem 0 1.75rem' }}>Así vienes este mes.</p>

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card destacada-utilidad">
          <p className="stat-label">Tu ganancia del mes</p>
          <p className="stat-value" style={{ color: '#22C55E' }}>
            {fmt(ganancia)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Vendiste</p>
          <p className="stat-value">{fmt(datos?.vendido_mes)}</p>
        </div>

        <div className="stat-card" style={debe > 0 ? { borderColor: 'rgba(245,158,11,0.4)' } : undefined}>
          <p className="stat-label">Debes al negocio</p>
          <p className="stat-value" style={{ color: debe > 0 ? '#F59E0B' : undefined }}>
            {fmt(debe)}
          </p>
        </div>
      </div>

      {/* Acción principal */}
      <Link to={`/empresas/${empresaId}/promotor/vender`}>
        <button
          className="btn-hero"
          type="button"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          Registrar una venta
        </button>
      </Link>

      {/* Qué tengo */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6ECF3',
          borderRadius: 16,
          padding: '1.15rem 1.3rem',
          marginTop: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <Package size={22} strokeWidth={1.8} style={{ color: '#1F3A5F', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1F3A5F' }}>
              {datos?.tipo_acceso === 'total'
                ? 'Puedes vender todo el inventario'
                : enMano > 0
                ? `Tienes ${enMano} ${enMano === 1 ? 'producto' : 'productos'} en tu poder`
                : 'No tienes mercadería asignada'}
            </p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55 }}>
              {datos?.tipo_acceso === 'total'
                ? 'No necesitas que te entreguen mercadería: vendes de lo que hay en la tienda.'
                : enMano > 0
                ? 'Solo puedes vender lo que te entregaron.'
                : 'Pídele al dueño que te entregue productos para vender.'}
            </p>

            <Link
              to={`/empresas/${empresaId}/promotor/catalogo`}
              style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Ver qué puedo vender &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Cuánto gano */}
      <section
        style={{
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.28)',
          borderRadius: 16,
          padding: '1.15rem 1.3rem',
          marginTop: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <TrendingUp size={22} strokeWidth={1.8} style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#15803D' }}>
              Ganas el {datos?.descuento}% de cada venta
            </p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55 }}>
              Si vendes algo en Bs 285, le pagas Bs{' '}
              {(285 * (1 - Number(datos?.descuento || 0) / 100)).toFixed(2)} al negocio y te quedas con Bs{' '}
              {(285 * (Number(datos?.descuento || 0) / 100)).toFixed(2)}.
            </p>
          </div>
        </div>
      </section>

      {/* Lo que debe */}
      {debe > 0 && (
        <section
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 16,
            padding: '1.15rem 1.3rem',
            marginTop: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <Wallet size={22} strokeWidth={1.8} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#8a5a00' }}>
                Tienes que entregar {fmt(debe)}
              </p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.55 }}>
                Es lo que corresponde al negocio por lo que ya vendiste.
              </p>

              <Link
                to={`/empresas/${empresaId}/promotor/cuenta`}
                style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.92rem', fontWeight: 600 }}
              >
                Ver el detalle &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
