import { Link, useParams } from 'react-router-dom'

export default function Inventario() {
  const { id: empresaId } = useParams()
  return (
    <main style={{ maxWidth: 600, fontFamily: 'sans-serif' }}>
      <h1>Inventario</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>Productos y configuración</Link>
        <Link to={`/empresas/${empresaId}/analisis-costo`}>Análisis: costo fijo vs. costo promedio</Link>
      </nav>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '1.5rem' }}>
        Para registrar ventas o compras de productos, ve a los módulos de <Link to={`/empresas/${empresaId}/ventas`}>Ventas</Link> o{' '}
        <Link to={`/empresas/${empresaId}/compras`}>Compras</Link>.
      </p>
    </main>
  )
}
