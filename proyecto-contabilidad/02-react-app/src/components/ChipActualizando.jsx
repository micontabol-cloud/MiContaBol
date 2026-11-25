import { useActualizando } from '../lib/datos'

// Aviso chico mientras la pantalla se refresca con datos nuevos por detrás.
export default function ChipActualizando() {
  const activo = useActualizando()
  if (!activo) return null
  return (
    <div className="chip-actualizando" role="status" aria-live="polite">
      Actualizando…
    </div>
  )
}
