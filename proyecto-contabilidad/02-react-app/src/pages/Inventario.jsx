import { Link, useParams } from 'react-router-dom'

export default function Inventario() {
  const { id: empresaId } = useParams()
  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <p>
        <Link to={`/empresas/${empresaId}`}>&larr; Volver</Link>
      </p>
      <h1>Inventario</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link to={`/empresas/${empresaId}/inventario/productos`}>Productos y configuración</Link>
        <Link to={`/empresas/${empresaId}/inventario/venta`}>+ Nueva venta de productos</Link>
        <Link to={`/empresas/${empresaId}/inventario/compra`}>+ Nueva compra de inventario</Link>
        <Link to={`/empresas/${empresaId}/cuentas-por-cobrar`}>Cuentas por cobrar</Link>
        <Link to={`/empresas/${empresaId}/analisis-costo`}>Análisis: costo fijo vs. costo promedio</Link>
      </nav>
    </main>
  )
}
