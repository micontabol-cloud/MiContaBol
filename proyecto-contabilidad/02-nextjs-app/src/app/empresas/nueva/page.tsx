import { crearEmpresa } from '@/app/actions/empresas'

export default function NuevaEmpresaPage() {
  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Crear empresa</h1>
      <form action={crearEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Nombre
          <input name="nombre" required style={{ width: '100%' }} />
        </label>
        <label>
          NIT
          <input name="nit" style={{ width: '100%' }} />
        </label>
        <label>
          Régimen tributario
          <select name="regimen_tributario" defaultValue="simplificado" style={{ width: '100%' }}>
            <option value="simplificado">Simplificado</option>
            <option value="general">General</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <button type="submit">Crear empresa</button>
      </form>
    </main>
  )
}
