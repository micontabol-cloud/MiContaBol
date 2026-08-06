import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Elegir un cliente o proveedor existente, o crear uno nuevo sin salir
 * de la pantalla. Un comerciante atendiendo no puede irse a otra
 * sección a registrar al cliente en medio de una venta.
 *
 * tipo: 'cliente' | 'proveedor'
 * valor: id seleccionado (o null)
 */
export default function SelectorContacto({
  empresaId,
  tipo = 'cliente',
  valor,
  onChange,
  onChangeNombre,
  obligatorio = false,
}) {
  const tabla = tipo === 'cliente' ? 'clientes' : 'proveedores'
  const etiqueta = tipo === 'cliente' ? 'Cliente' : 'Proveedor'

  const [contactos, setContactos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState(null)
  const contenedorRef = useRef(null)

  async function cargar() {
    const { data } = await supabase
      .from(tabla)
      .select('id, nombre, telefono')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre')
    setContactos(data || [])
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, tipo])

  // Cerrar la lista al tocar fuera
  useEffect(() => {
    function alTocarFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alTocarFuera)
    return () => document.removeEventListener('mousedown', alTocarFuera)
  }, [])

  const seleccionado = contactos.find((c) => c.id === valor)

  // Avisamos el nombre hacia arriba para que quien nos use pueda
  // mostrarlo sin volver a consultar la base.
  useEffect(() => {
    if (onChangeNombre) onChangeNombre(seleccionado?.nombre || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionado?.id, seleccionado?.nombre])
  const q = busqueda.trim().toLowerCase()
  const filtrados = q ? contactos.filter((c) => c.nombre.toLowerCase().includes(q)) : contactos
  const nombreExacto = contactos.some((c) => c.nombre.trim().toLowerCase() === q)

  async function crearContacto() {
    const nombre = busqueda.trim()
    if (!nombre) return

    setError(null)
    setCreando(true)

    const { data, error } = await supabase
      .from(tabla)
      .insert({ empresa_id: empresaId, nombre })
      .select('id, nombre')
      .single()

    setCreando(false)

    if (error) {
      setError(error.message)
      return
    }

    await cargar()
    onChange(data.id)
    setBusqueda('')
    setAbierto(false)
  }

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
        {etiqueta}
        {obligatorio && <strong style={{ color: '#F2555A' }}> (obligatorio si es fiado)</strong>}
      </p>

      {seleccionado ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            padding: '0.55rem 0.75rem',
            background: '#FFFFFF',
          }}
        >
          <span style={{ fontWeight: 600, color: '#1F3A5F' }}>{seleccionado.nombre}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setBusqueda('')
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              padding: 0,
              fontSize: '0.82rem',
              textDecoration: 'underline',
            }}
          >
            Cambiar
          </button>
        </div>
      ) : (
        <input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          placeholder={`Buscar o crear ${tipo}...`}
          style={{ width: '100%' }}
        />
      )}

      {abierto && !seleccionado && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: '#FFFFFF',
            border: '1px solid #E6ECF3',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(31, 58, 95, 0.12)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {filtrados.length === 0 && !q && (
            <p style={{ margin: 0, padding: '0.7rem 0.85rem', color: '#A3AFBF', fontSize: '0.88rem' }}>
              Todavía no tienes {tipo === 'cliente' ? 'clientes' : 'proveedores'}. Escribe un nombre para crear el
              primero.
            </p>
          )}

          {filtrados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id)
                setAbierto(false)
                setBusqueda('')
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #F7F9FC',
                padding: '0.6rem 0.85rem',
                fontSize: '0.9rem',
                color: '#253046',
                borderRadius: 0,
              }}
            >
              {c.nombre}
              {c.telefono && <span style={{ color: '#A3AFBF', marginLeft: '0.5rem' }}>{c.telefono}</span>}
            </button>
          ))}

          {q && !nombreExacto && (
            <button
              type="button"
              onClick={crearContacto}
              disabled={creando}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(242, 85, 90, 0.06)',
                border: 'none',
                padding: '0.7rem 0.85rem',
                fontSize: '0.9rem',
                color: '#F2555A',
                fontWeight: 600,
                borderRadius: 0,
              }}
            >
              + Crear "{busqueda.trim()}"
            </button>
          )}
        </div>
      )}

      {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>{error}</p>}
    </div>
  )
}
