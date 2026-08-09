import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function MisEmpresas() {
  const { session } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [esAdmin, setEsAdmin] = useState(false)
  const [cupo, setCupo] = useState(null)
  const [pagosPendientes, setPagosPendientes] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!session) return

    async function cargar() {
      // Filtramos explícitamente por membresía: ahora que el super admin
      // puede VER todas las empresas (vía RLS), esta pantalla debe seguir
      // mostrando solo las que son realmente "mías" (donde soy miembro).
      const { data, error } = await supabase
        .from('miembros_empresa')
        .select('rol, empresas(*)')
        .eq('usuario_id', session.user.id)

      if (!error) {
        setEmpresas(data.map((m) => ({ ...m.empresas, rol: m.rol })))
      }

      const { data: admin } = await supabase.rpc('soy_super_admin')
      setEsAdmin(!!admin)

      const { data: c } = await supabase.rpc('mi_cupo_empresas')
      setCupo(c)

      if (admin) {
        const { data: n } = await supabase.rpc('contar_pagos_pendientes')
        setPagosPendientes(n || 0)
      }

      setCargando(false)
    }
    cargar()
  }, [session])

  return (
    <main style={{ maxWidth: 600, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <p style={{ margin: '0 0 1.25rem', fontWeight: 700, color: '#F2555A', fontSize: '1.1rem' }}>MiContaBol</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mis empresas</h1>
        {cupo?.puede_crear && (
          <Link to="/empresas/nueva">
            <button className="btn-hero">+ Nuevo negocio</button>
          </Link>
        )}
      </div>

      <p style={{ marginTop: '0.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <Link to="/perfil">Mi perfil &rarr;</Link>
        {esAdmin && (
          <Link to="/admin">
            Panel de administrador
            {pagosPendientes > 0 && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  background: '#F2555A',
                  color: '#FFFFFF',
                  borderRadius: 999,
                  padding: '0.1rem 0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {pagosPendientes} por revisar
              </span>
            )}
            {' '}&rarr;
          </Link>
        )}
      </p>

      {cargando ? (
        <p>Cargando...</p>
      ) : empresas.length === 0 ? (
        <p>Todavía no tienes ningún negocio. Crea el primero con el botón de arriba.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {empresas.map((e) => (
            <li
              key={e.id}
              style={{
                padding: '0.85rem 1rem',
                border: '1px solid #E6ECF3',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Link to={`/empresas/${e.id}`} style={{ fontWeight: 600 }}>
                {e.nombre}
              </Link>
              <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{e.regimen_tributario}</span>
            </li>
          ))}
        </ul>
      )}
      {cupo && !cupo.puede_crear && (
        <p
          style={{
            marginTop: '1.5rem',
            padding: '0.85rem 1rem',
            background: '#F7F9FC',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            color: '#64748B',
            fontSize: '0.88rem',
          }}
        >
          Tu cuenta incluye {cupo.limite} {cupo.limite === 1 ? 'negocio' : 'negocios'}. Si llevas otro negocio,
          necesitas una cuenta aparte con su propia membresía.
        </p>
      )}
    </main>
  )
}
