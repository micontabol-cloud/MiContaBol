import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, CreditCard, Package } from 'lucide-react'
import { supabase } from '../supabaseClient'

const COLORES_SUGERIDOS = [
  '#1F3A5F', '#0F766E', '#7C2D92', '#B45309',
  '#BE123C', '#166534', '#1E40AF', '#9A3412',
]

const RUBROS = [
  { valor: 'zapateria', label: 'Zapatería' },
  { valor: 'minimarket', label: 'Minimarket / Abarrotes' },
  { valor: 'joyeria', label: 'Joyería' },
  { valor: 'boutique', label: 'Boutique / Ropa' },
  { valor: 'ferreteria', label: 'Ferretería' },
  { valor: 'farmacia', label: 'Farmacia' },
  { valor: 'otro', label: 'Otro' },
]

export default function PerfilEmpresa() {
  const { id: empresaId } = useParams()
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    rubro: 'otro',
    regimen_tributario: 'simplificado',
    color_marca: '#1F3A5F',
    whatsapp: '',
    direccion: '',
    horarios: '',
    instagram: '',
    facebook: '',
    maps_url: '',
  })

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase.from('empresas').select('*').eq('id', empresaId).single()
    if (error) setError(error.message)
    setEmpresa(data)
    if (data) {
      setForm({
        nombre: data.nombre || '',
        nit: data.nit || '',
        rubro: data.rubro || 'otro',
        regimen_tributario: data.regimen_tributario || 'simplificado',
        color_marca: data.color_marca || '#1F3A5F',
        whatsapp: data.whatsapp || '',
        direccion: data.direccion || '',
        horarios: data.horarios || '',
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        maps_url: data.maps_url || '',
      })
    }
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  async function subirLogo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setError(null)
    setSubiendo(true)

    const ext = archivo.name.split('.').pop()
    const ruta = `marca/${empresaId}/logo-${Date.now()}.${ext}`
    const { error: errSubida } = await supabase.storage.from('productos').upload(ruta, archivo, { upsert: true })

    if (errSubida) {
      setSubiendo(false)
      return setError(`No se pudo subir el logo: ${errSubida.message}`)
    }

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta)
    await supabase.from('empresas').update({ logo_url: data.publicUrl }).eq('id', empresaId)
    setSubiendo(false)
    cargar()
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    const { error } = await supabase.from('empresas').update(form).eq('id', empresaId)

    setGuardando(false)
    if (error) return setError(error.message)

    setAviso('Guardado.')
    setTimeout(() => setAviso(null), 3000)
    cargar()
  }

  if (cargando) {
    return (
      <main style={{ maxWidth: 760, fontFamily: 'sans-serif' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 760, fontFamily: 'sans-serif' }}>
      <h1>Perfil de tu negocio</h1>
      <p style={{ color: '#64748B', marginTop: '-0.5rem' }}>
        Los datos de tu negocio y su imagen. Se usan en tus catálogos y reportes.
      </p>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}
      {aviso && <p style={{ color: '#22C55E', fontWeight: 600 }}>{aviso}</p>}

      {/* Logo */}
      <h2>Logo</h2>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {empresa?.logo_url ? (
          <img
            src={empresa.logo_url}
            alt="Logo"
            style={{
              height: 90,
              maxWidth: 200,
              objectFit: 'contain',
              background: '#FFFFFF',
              border: '1px solid #E6ECF3',
              borderRadius: 12,
              padding: '0.5rem',
            }}
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 90,
              borderRadius: 12,
              background: '#F7F9FC',
              border: '1px dashed #E6ECF3',
              display: 'grid',
              placeItems: 'center',
              color: '#A3AFBF',
              fontSize: '0.85rem',
            }}
          >
            Sin logo
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <input type="file" accept="image/*" onChange={subirLogo} disabled={subiendo} style={{ fontSize: '0.8rem' }} />
          {subiendo && <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Subiendo...</span>}
          {empresa?.logo_url && (
            <button
              type="button"
              onClick={async () => {
                await supabase.from('empresas').update({ logo_url: null }).eq('id', empresaId)
                cargar()
              }}
              style={{ alignSelf: 'flex-start' }}
            >
              Quitar logo
            </button>
          )}
          <span style={{ fontSize: '0.8rem', color: '#A3AFBF', maxWidth: 240 }}>
            Se ve mejor con fondo transparente (PNG).
          </span>
        </div>
      </div>

      <form onSubmit={guardar}>
        {/* Datos */}
        <h2>Datos del negocio</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 460 }}>
          <label>
            Nombre
            <br />
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            NIT
            <br />
            <input value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>
            Rubro
            <br />
            <select value={form.rubro} onChange={(e) => setForm({ ...form, rubro: e.target.value })} style={{ width: '100%' }}>
              {RUBROS.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Régimen tributario
            <br />
            <select
              value={form.regimen_tributario}
              onChange={(e) => setForm({ ...form, regimen_tributario: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="simplificado">Simplificado</option>
              <option value="general">General</option>
              <option value="otro">Otro</option>
            </select>
          </label>
        </div>

        {/* Color */}
        <h2>Color de tu marca</h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
          Se usa en la portada, los precios y los botones de tus catálogos.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {COLORES_SUGERIDOS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color_marca: c })}
              aria-label={`Color ${c}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: c,
                border: form.color_marca === c ? '3px solid #253046' : '1px solid #E6ECF3',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
          <input
            type="color"
            value={form.color_marca}
            onChange={(e) => setForm({ ...form, color_marca: e.target.value })}
            style={{ width: 50, height: 38, padding: 2 }}
            title="Elegir otro color"
          />
        </div>

        {/* Contacto */}
        <h2>Cómo te contactan tus clientes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 460 }}>
          <label>
            WhatsApp (con código de país)
            <br />
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="591 70000000"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Dirección
            <br />
            <input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Av. Cañoto #123, Santa Cruz"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Enlace de Google Maps (opcional)
            <br />
            <input
              value={form.maps_url}
              onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Horarios
            <br />
            <input
              value={form.horarios}
              onChange={(e) => setForm({ ...form, horarios: e.target.value })}
              placeholder="Lun a Sáb de 9:00 a 19:00"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Instagram
            <br />
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@minegocio"
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Facebook (enlace)
            <br />
            <input
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              placeholder="https://facebook.com/minegocio"
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <button className="btn-hero" type="submit" disabled={guardando} style={{ marginTop: '1.25rem' }}>
          Guardar
        </button>
      </form>

      <h2 style={{ marginTop: '2.5rem' }}>Otras configuraciones</h2>
      <div className="panel-cards">
        <Link to={`/empresas/${empresaId}/miembros`} className="panel-card" style={{ display: 'block' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={17} strokeWidth={1.8} />
            Miembros
          </h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
            Invita a tu contador o a quien atiende, con permisos distintos.
          </p>
        </Link>

        <Link to={`/empresas/${empresaId}/formas-de-pago`} className="panel-card" style={{ display: 'block' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={17} strokeWidth={1.8} />
            Formas de pago
          </h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
            Efectivo, QR, tarjeta... y a qué cuenta va cada una.
          </p>
        </Link>

        <Link to={`/empresas/${empresaId}/inventario/productos`} className="panel-card" style={{ display: 'block' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={17} strokeWidth={1.8} />
            Cuentas contables
          </h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
            Qué cuenta usa cada operación. Ya quedaron configuradas solas.
          </p>
        </Link>
      </div>
    </main>
  )
}
