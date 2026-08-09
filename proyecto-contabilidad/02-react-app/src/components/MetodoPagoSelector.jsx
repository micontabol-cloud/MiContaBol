export default function MetodoPagoSelector({ metodos, valor, onChange, etiqueta = '¿Cómo te pagan?' }) {
  return (
    <div>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>{etiqueta}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {metodos.map((m) => {
          const activo = valor === m.id
          const sinCuenta = !m.es_credito && !m.cuenta_id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              title={sinCuenta ? 'A este método le falta configurar su cuenta' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                minWidth: 96,
                padding: '0.7rem 0.85rem',
                borderRadius: 12,
                border: activo ? '2px solid #F2555A' : '1px solid #E6ECF3',
                background: activo ? 'rgba(242, 85, 90, 0.06)' : '#FFFFFF',
                color: '#1F3A5F',
                fontWeight: activo ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{m.icono || '💰'}</span>
              <span>{m.nombre}</span>
              {sinCuenta && <span style={{ fontSize: '0.68rem', color: '#F59E0B' }}>sin configurar</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
