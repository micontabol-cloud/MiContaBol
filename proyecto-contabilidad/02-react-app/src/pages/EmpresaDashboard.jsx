import { useParams } from 'react-router-dom'

export default function EmpresaDashboard() {
  const { id } = useParams()

  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Empresa</h1>
      <p>ID: {id}</p>
      <p>Aquí va el dashboard — plan de cuentas, asientos, reportes. (Siguiente paso a construir)</p>
    </main>
  )
}
