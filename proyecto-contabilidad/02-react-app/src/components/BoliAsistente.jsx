import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Send, X } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { ES_APP } from '../lib/plataforma'
import { iniciarVoz, vozDisponible } from '../lib/boliVoz'
import '../styles/boli.css'

/**
 * Boli, el asistente. Responde preguntas sobre los números del negocio.
 * SOLO LEE: no registra ni cambia nada.
 *
 * Quién lo ve y cuántos mensajes tiene lo decide la base de datos
 * (boli_estado); aquí solo se dibuja. Si la función no existe todavía o la
 * persona no tiene permiso, el componente no muestra nada.
 *
 * En la app del celular no se nombran planes ni precios (reglas de las tiendas).
 */

const SUGERENCIAS = [
  '¿Cuánto vendí hoy?',
  '¿Qué productos se están acabando?',
  '¿Quién me debe plata?',
  '¿Estoy ganando este mes?',
]

const fechaLarga = (iso) => {
  if (!iso) return ''
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })
  } catch {
    return iso
  }
}

/** Por qué no se puede preguntar (null si se puede). */
function motivoDeBloqueo(estado) {
  if (!estado) return null
  if (estado.vencida) return 'vencida'
  if (Number(estado.limite) <= 0) return 'sin_plan'
  if (Number(estado.restantes) <= 0) return 'limite'
  return null
}

function textoAviso(motivo, estado) {
  const renueva = fechaLarga(estado?.renueva_el)
  switch (motivo) {
    case 'limite':
      return `Usaste tus ${estado?.limite ?? ''} mensajes con Boli de este mes. Se renuevan el ${renueva}.`
    case 'vencida':
      return ES_APP
        ? 'Boli no está disponible para tu cuenta en este momento.'
        : 'Tu plan venció, por eso Boli está en pausa. Renuévalo para volver a usarlo.'
    case 'sin_plan':
      return ES_APP ? 'Boli no está disponible para tu cuenta en este momento.' : 'Tu plan actual no incluye a Boli.'
    case 'sin_permiso':
      return 'Boli está disponible solo para quien administra el negocio.'
    default:
      return 'Boli no pudo responder ahora. Intenta de nuevo en un momento. Este intento no se cuenta.'
  }
}

/** Texto con **negritas** y listas con guion, sin usar HTML crudo. */
function Texto({ texto }) {
  const lineas = String(texto).split('\n')
  const bloques = []
  let lista = null

  const negritas = (t, clave) =>
    t.split(/\*\*(.+?)\*\*/g).map((parte, i) => (i % 2 ? <strong key={`${clave}-${i}`}>{parte}</strong> : parte))

  lineas.forEach((raw, i) => {
    const l = raw.trimEnd()
    const item = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/)
    if (item) {
      if (!lista) {
        lista = []
        bloques.push({ tipo: 'ul', items: lista, clave: i })
      }
      lista.push(negritas(item[1], i))
    } else {
      lista = null
      if (l.trim()) bloques.push({ tipo: 'p', contenido: negritas(l, i), clave: i })
    }
  })

  return bloques.map((b) =>
    b.tipo === 'ul' ? (
      <ul key={b.clave}>
        {b.items.map((it, j) => (
          <li key={j}>{it}</li>
        ))}
      </ul>
    ) : (
      <p key={b.clave}>{b.contenido}</p>
    ),
  )
}

export default function BoliAsistente({ empresaId }) {
  const [estado, setEstado] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const [avisoVoz, setAvisoVoz] = useState('')

  const listaRef = useRef(null)
  const inputRef = useRef(null)
  const fabRef = useRef(null)
  const vozRef = useRef(null)
  const baseRef = useRef('')
  const contador = useRef(0)

  const vozOk = vozDisponible()

  // Cada empresa tiene su propia conversación y su propio estado.
  useEffect(() => {
    let cancelado = false
    setEstado(null)
    setMensajes([])
    setTexto('')
    setAbierto(false)
    supabase.rpc('boli_estado', { p_empresa_id: empresaId }).then(({ data, error }) => {
      if (!cancelado) setEstado(error ? { puede: false } : data)
    })
    return () => {
      cancelado = true
    }
  }, [empresaId])

  const pararVoz = useCallback(() => {
    vozRef.current?.parar()
    vozRef.current = null
    setEscuchando(false)
  }, [])

  useEffect(() => () => vozRef.current?.parar(), [])

  const cerrar = useCallback(() => {
    pararVoz()
    setAbierto(false)
    setTimeout(() => fabRef.current?.focus(), 0)
  }, [pararVoz])

  // Esc cierra; el fondo de la página no se mueve mientras Boli está abierto
  useEffect(() => {
    if (!abierto) return undefined
    const tecla = (e) => e.key === 'Escape' && cerrar()
    document.addEventListener('keydown', tecla)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = antes
    }
  }, [abierto, cerrar])

  // Siempre mostrar lo último
  useEffect(() => {
    const el = listaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes, enviando, abierto])

  const escuchar = useCallback(async () => {
    if (vozRef.current) {
      pararVoz()
      return
    }
    setAvisoVoz('')
    baseRef.current = texto.trim()
    setEscuchando(true)
    const sesion = await iniciarVoz({
      onTexto: (t) => setTexto(baseRef.current ? `${baseRef.current} ${t}` : t),
      onFin: () => {
        vozRef.current = null
        setEscuchando(false)
        inputRef.current?.focus({ preventScroll: true })
      },
      onError: (codigo) => {
        if (codigo === 'permiso')
          setAvisoVoz('Para hablarle a Boli, permite el micrófono en los ajustes de tu dispositivo.')
        else if (codigo === 'sin_voz') setAvisoVoz('No te escuché. Toca el micrófono e inténtalo de nuevo.')
        else setAvisoVoz('No pude usar el micrófono. Puedes escribir tu pregunta.')
      },
    })
    vozRef.current = sesion
  }, [texto, pararVoz])

  const abrir = useCallback(
    (hablar) => {
      setAbierto(true)
      if (hablar) escuchar()
      else if (window.matchMedia?.('(pointer: fine)').matches) setTimeout(() => inputRef.current?.focus(), 50)
    },
    [escuchar],
  )

  const enviar = useCallback(
    async (pregunta) => {
      const q = String(pregunta ?? texto).trim()
      if (!q || enviando || motivoDeBloqueo(estado)) return
      pararVoz()
      setAvisoVoz('')
      setTexto('')

      const mio = { id: ++contador.current, rol: 'user', texto: q }
      setMensajes((m) => [...m, mio])
      setEnviando(true)

      // Contexto: los últimos mensajes de la conversación (sin los avisos)
      const historial = [...mensajes, mio]
        .filter((m) => m.rol === 'user' || m.rol === 'boli')
        .slice(-10)
        .map((m) => ({ rol: m.rol === 'user' ? 'user' : 'assistant', texto: m.texto }))

      let respuesta
      try {
        const { data, error } = await supabase.functions.invoke('boli', {
          body: { empresa_id: empresaId, mensajes: historial },
        })
        respuesta = error ? { ok: false, motivo: 'error' } : data
      } catch {
        respuesta = { ok: false, motivo: 'error' }
      }

      if (respuesta?.limite != null || respuesta?.usados != null) {
        setEstado((e) => {
          const limite = respuesta.limite ?? e?.limite
          const usados = respuesta.usados ?? e?.usados
          return {
            ...e,
            limite,
            usados,
            restantes: respuesta.restantes ?? (respuesta.motivo === 'limite' ? 0 : Math.max(limite - usados, 0)),
            renueva_el: respuesta.renueva_el ?? e?.renueva_el,
          }
        })
      }
      if (respuesta?.motivo === 'vencida') setEstado((e) => ({ ...e, vencida: true }))
      if (respuesta?.motivo === 'sin_plan') setEstado((e) => ({ ...e, limite: 0 }))

      setMensajes((m) => [
        ...m,
        respuesta?.ok
          ? { id: ++contador.current, rol: 'boli', texto: respuesta.respuesta }
          : { id: ++contador.current, rol: 'aviso', motivo: respuesta?.motivo || 'error' },
      ])
      setEnviando(false)
    },
    [texto, enviando, estado, mensajes, empresaId, pararVoz],
  )

  if (!estado?.puede) return null

  const bloqueo = motivoDeBloqueo(estado)
  const quedan = Number(estado.restantes)
  const cupoBajo = !bloqueo && quedan <= 5

  return (
    <div className="boli">
      {!abierto && (
        <div className="boli-fab">
          {vozOk && (
            <button
              type="button"
              className="boli-fab-mic"
              onClick={() => abrir(true)}
              aria-label="Hablar con Boli"
              title="Hablar con Boli"
            >
              <Mic size={20} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            ref={fabRef}
            className="boli-fab-boli"
            onClick={() => abrir(false)}
            aria-label="Abrir a Boli, tu asistente"
            title="Pregúntale a Boli"
          >
            <img src="/boli/boli-hola.webp" alt="" width="52" height="52" />
          </button>
        </div>
      )}

      {abierto && (
        <>
          <div className="boli-fondo" onClick={cerrar} aria-hidden="true" />
          <section className="boli-hoja" role="dialog" aria-label="Boli, tu asistente">
            <header className="boli-cabecera">
              <img src="/boli/boli-hola.webp" alt="" width="40" height="40" className="boli-cabecera-cara" />
              <div className="boli-cabecera-texto">
                <strong>Boli</strong>
                <span>Te explico tus números. Solo consulto, no cambio nada.</span>
              </div>
              <button type="button" className="boli-cerrar" onClick={cerrar} aria-label="Cerrar a Boli">
                <X size={20} strokeWidth={2} />
              </button>
            </header>

            <div className="boli-lista" ref={listaRef} role="log" aria-live="polite">
              {mensajes.length === 0 && (
                <div className="boli-vacio">
                  <img src="/boli/boli-hola.webp" alt="" width="96" height="96" />
                  <p className="boli-vacio-titulo">Hola, soy Boli</p>
                  <p className="boli-vacio-texto">Pregúntame por tus ventas, tu inventario o lo que te deben. Puedes escribir o hablar.</p>
                  {!bloqueo && (
                    <div className="boli-sugerencias">
                      {SUGERENCIAS.map((s) => (
                        <button type="button" key={s} className="boli-chip" onClick={() => enviar(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {mensajes.map((m) =>
                m.rol === 'aviso' ? (
                  <div key={m.id} className="boli-aviso" role="status">
                    <p>{textoAviso(m.motivo, estado)}</p>
                    {!ES_APP && (m.motivo === 'limite' || m.motivo === 'sin_plan' || m.motivo === 'vencida') && (
                      <Link to="/suscripcion" onClick={cerrar}>
                        Ver mi plan
                      </Link>
                    )}
                  </div>
                ) : (
                  <div key={m.id} className={`boli-burbuja boli-burbuja-${m.rol}`}>
                    <Texto texto={m.texto} />
                  </div>
                ),
              )}

              {enviando && (
                <div className="boli-burbuja boli-burbuja-boli boli-pensando" aria-label="Boli está revisando tus números">
                  <span className="boli-punto" />
                  <span className="boli-punto" />
                  <span className="boli-punto" />
                  <em>Revisando tus números…</em>
                </div>
              )}
            </div>

            {bloqueo && mensajes.length === 0 && (
              <div className="boli-aviso boli-aviso-fijo" role="status">
                <p>{textoAviso(bloqueo, estado)}</p>
                {!ES_APP && (bloqueo === 'limite' || bloqueo === 'sin_plan' || bloqueo === 'vencida') && (
                  <Link to="/suscripcion" onClick={cerrar}>
                    Ver mi plan
                  </Link>
                )}
              </div>
            )}

            {avisoVoz && (
              <p className="boli-voz-aviso" role="status">
                {avisoVoz}
              </p>
            )}

            {Number(estado.limite) > 0 && !estado.vencida && (
              <p className={'boli-cupo' + (cupoBajo ? ' bajo' : '')}>
                {cupoBajo && quedan > 0
                  ? `Te quedan ${quedan} ${quedan === 1 ? 'mensaje' : 'mensajes'} este mes`
                  : `${estado.usados} de ${estado.limite} mensajes este mes`}
              </p>
            )}

            <form
              className="boli-form"
              onSubmit={(e) => {
                e.preventDefault()
                enviar()
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="boli-input"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={bloqueo ? 'Boli está en pausa' : escuchando ? 'Te escucho…' : 'Escribe tu pregunta'}
                disabled={!!bloqueo}
                maxLength={500}
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Tu pregunta para Boli"
              />
              {vozOk && (
                <button
                  type="button"
                  className={'boli-btn-mic' + (escuchando ? ' activo' : '')}
                  onClick={escuchar}
                  disabled={!!bloqueo}
                  aria-pressed={escuchando}
                  aria-label={escuchando ? 'Dejar de escuchar' : 'Hablar'}
                >
                  <Mic size={20} strokeWidth={2} />
                </button>
              )}
              <button
                type="submit"
                className="boli-btn-enviar"
                disabled={!!bloqueo || enviando || !texto.trim()}
                aria-label="Enviar pregunta"
              >
                <Send size={19} strokeWidth={2} />
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  )
}
