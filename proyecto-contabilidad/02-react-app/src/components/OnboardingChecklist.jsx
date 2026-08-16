import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../supabaseClient'
import BoliMascot from './BoliMascot'

/**
 * Guía de primeros pasos. No guarda "pasos completados" en ninguna
 * tabla: cada paso se deduce de los datos reales. Así nunca se
 * desincroniza — si el usuario borra todos sus productos, ese paso
 * vuelve a aparecer pendiente, que es lo correcto.
 */
export default function OnboardingChecklist({ empresa, onOcultar }) {
  const { id: empresaId } = useParams()
  const [estado, setEstado] = useState(null)
  const [ocultando, setOcultando] = useState(false)

  useEffect(() => {
    async function calcular() {
      const [prodRes, ventaRes, clienteRes, bancoRes, miembroRes, catalogoRes, compraRes] = await Promise.all([
        supabase
          .from('productos')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .is('eliminado_at', null),
        supabase
          .from('comprobantes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'venta'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('cuentas_bancarias').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('miembros_empresa').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase.from('catalogos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
        supabase
          .from('comprobantes')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .is('anulado_at', null)
          .eq('tipo', 'compra'),
      ])

      setEstado({
        productos: (prodRes.count || 0) > 0,
        ventas: (ventaRes.count || 0) > 0,
        clientes: (clienteRes.count || 0) > 0,
        bancos: (bancoRes.count || 0) > 0,
        equipo: (miembroRes.count || 0) > 1,
        catalogo: (catalogoRes.count || 0) > 0,
        compras: (compraRes.count || 0) > 0,
      })
    }
    calcular()
  }, [empresaId])

  if (!estado || !empresa) return null

  const cuentasListas = Boolean(
    empresa.cuenta_ventas_id && empresa.cuenta_costo_ventas_id && empresa.cuenta_inventario_id
  )

  // Los esenciales primero: sin esto la app no sirve. Los demás son
  // mejoras que valen la pena pero no bloquean.
  const esenciales = [
    {
      hecho: estado.productos,
      titulo: 'Carga tus productos',
      texto:
        'Es lo primero. Si tienes muchos, súbelos desde Excel en un solo paso en vez de escribirlos uno por uno.',
      accion: estado.productos ? 'Ver productos' : 'Importar desde Excel',
      a: estado.productos
        ? `/empresas/${empresaId}/inventario/productos`
        : `/empresas/${empresaId}/inventario/importar`,
    },
    {
      hecho: estado.ventas,
      titulo: 'Registra tu primera venta',
      texto:
        'Vas a ver al instante cuánto ganaste con ella. Toda la contabilidad se arma sola por detrás, sin que hagas nada.',
      accion: 'Vender',
      a: `/empresas/${empresaId}/inventario/venta`,
    },
    {
      hecho: cuentasListas,
      titulo: 'Revisa tus cuentas contables',
      texto:
        'Ya quedaron configuradas solas al crear tu negocio. Solo confirma que estén bien; normalmente no hay nada que cambiar.',
      accion: 'Revisar',
      a: `/empresas/${empresaId}/inventario/productos`,
    },
  ]

  const siguientes = [
    {
      hecho: estado.clientes,
      titulo: 'Anota a tus clientes',
      texto: 'Necesario si vendes fiado: así sabes quién te debe, cuánto, y desde cuándo.',
      accion: 'Agregar cliente',
      a: `/empresas/${empresaId}/clientes`,
    },
    {
      hecho: estado.compras,
      titulo: 'Registra una compra',
      texto:
        'Cuando compras mercadería, tu stock sube solo y queda el costo real. Es lo que hace que tus márgenes sean ciertos.',
      accion: 'Registrar compra',
      a: `/empresas/${empresaId}/inventario/compra`,
    },
    {
      hecho: estado.bancos,
      titulo: 'Agrega tu cuenta de banco',
      texto:
        'Con su saldo inicial podrás conciliar: comparar lo que dice tu banco contra tus libros y encontrar diferencias.',
      accion: 'Agregar banco',
      a: `/empresas/${empresaId}/bancos`,
    },
    {
      hecho: estado.catalogo,
      titulo: 'Publica tu catálogo',
      texto:
        'Eliges productos y obtienes un enlace para WhatsApp, más un código QR para pegar en tu vitrina. Tus clientes te escriben desde ahí.',
      accion: 'Crear catálogo',
      a: `/empresas/${empresaId}/catalogos`,
    },
    {
      hecho: estado.equipo,
      titulo: 'Invita a tu equipo',
      texto:
        'Quien atiende puede registrar ventas sin ver tus ganancias ni tu contabilidad. Tu contador puede entrar solo a lo suyo.',
      accion: 'Invitar',
      a: `/empresas/${empresaId}/miembros`,
    },
  ]

  const pasos = [...esenciales, ...siguientes]

  const completados = pasos.filter((p) => p.hecho).length
  const listoEsencial = esenciales.every((p) => p.hecho)
  const listo = completados === pasos.length

  async function ocultar() {
    setOcultando(true)
    await supabase.from('empresas').update({ onboarding_oculto: true }).eq('id', empresaId)
    setOcultando(false)
    onOcultar?.()
  }

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E6ECF3',
        borderRadius: 16,
        boxShadow: '0 1px 2px rgba(31, 58, 95, 0.05), 0 4px 12px rgba(31, 58, 95, 0.04)',
        padding: '1.25rem 1.4rem',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <BoliMascot pose={listo ? 'celebrando' : 'consejo'} size={62} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            {listo ? '¡Ya lo usaste todo!' : listoEsencial ? 'Ya puedes vender' : 'Empecemos con lo básico'}
          </h2>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0', fontSize: '0.92rem' }}>
            {listo
              ? 'Completaste toda la guía. Puedes esconderla cuando quieras.'
              : listoEsencial
              ? `Lo esencial está listo. Estas ${siguientes.filter((p) => !p.hecho).length} cosas te van a servir cuando las necesites.`
              : `${completados} de ${pasos.length} listos. Lo esencial toma unos minutos.`}
          </p>

          {/* Barra de avance */}
          <div
            style={{
              height: 6,
              background: '#F7F9FC',
              borderRadius: 999,
              overflow: 'hidden',
              margin: '0.75rem 0 0',
              border: '1px solid #E6ECF3',
            }}
          >
            <div
              style={{
                width: `${(completados / pasos.length) * 100}%`,
                height: '100%',
                background: listo ? '#22C55E' : '#F2555A',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <button type="button" onClick={ocultar} disabled={ocultando} style={{ fontSize: '0.82rem' }}>
          Esconder guía
        </button>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, margin: '1.1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {pasos.map((p, i) => (
          <Fragment key={p.titulo}>
          {i === esenciales.length && (
            <li style={{ listStyle: 'none', marginTop: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#A3AFBF', letterSpacing: '0.03em' }}>
                CUANDO LO NECESITES
              </p>
            </li>
          )}
          <li
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
              padding: '0.7rem 0.85rem',
              borderRadius: 12,
              background: p.hecho ? 'rgba(34, 197, 94, 0.06)' : '#F7F9FC',
              border: `1px solid ${p.hecho ? 'rgba(34, 197, 94, 0.25)' : '#E6ECF3'}`,
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: p.hecho ? '#22C55E' : '#FFFFFF',
                border: p.hecho ? 'none' : '1px solid #E6ECF3',
                color: p.hecho ? '#FFFFFF' : '#A3AFBF',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {p.hecho ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>

            <div style={{ flex: 1, minWidth: 180 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: '#1F3A5F',
                  textDecoration: p.hecho ? 'line-through' : 'none',
                  opacity: p.hecho ? 0.65 : 1,
                }}
              >
                {p.titulo}
              </p>
              {!p.hecho && (
                <p style={{ margin: '0.15rem 0 0', color: '#64748B', fontSize: '0.87rem' }}>{p.texto}</p>
              )}
            </div>

            {!p.hecho && (
              <Link to={p.a}>
                <button
                  className={i < esenciales.length ? 'btn-hero' : undefined}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', whiteSpace: 'nowrap' }}
                >
                  {p.accion}
                </button>
              </Link>
            )}
          </li>
          </Fragment>
        ))}
      </ol>
    </section>
  )
}
