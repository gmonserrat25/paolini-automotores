import { useEffect, useMemo, useRef, useState } from 'react'
import { pedirAlAsistente } from './datos'
import { FORMATOS, aPng, dibujarPieza, titulo } from './posts/dibujar'

/* La pantalla "Posts": se le pide al asistente una pieza para Instagram
   ("haceme un post del Yaris") y devuelve propuestas armadas con la foto real
   del auto. Cada propuesta se baja en PNG o se comparte directo desde el
   celular, y el texto del posteo se copia aparte. */

/* Las últimas combinaciones de diseño y fondo que se usaron, para que el
   asistente no repita y el feed no quede todo igual. Viven en este navegador:
   si se borran, no pasa nada. */
const CLAVE_RECIENTES = 'paolini-posts-recientes'
function leerRecientes() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RECIENTES)) ?? []
  } catch {
    return []
  }
}
function anotarReciente(pieza) {
  try {
    const lista = [...leerRecientes(), { diseno: pieza.diseno, fondo: pieza.fondo }].slice(-12)
    localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista))
  } catch {
    /* Sin almacenamiento: el asistente sólo pierde la memoria de lo usado. */
  }
}

/* Lo que el asistente necesita saber de cada auto del stock. */
const autoDe = (u) => ({
  id: u.id,
  marca: u.ficha?.marca ?? u.brand,
  modelo: u.ficha?.modelo ?? u.model,
  tipo: u.ficha?.tipo ?? u.type,
  color: u.ficha?.color ?? u.color,
  combustible: u.ficha?.combustible,
  anio: u.ficha?.anio,
  km: u.ficha?.km,
  precio: u.ficha?.precio ?? u.precioVenta,
  estado: u.estado,
  foto: u.image,
})

/* En el celular se puede mandar la imagen directo a Instagram o WhatsApp. */
const PUEDE_COMPARTIR = (() => {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'p.png', { type: 'image/png' })] })
  } catch {
    return false
  }
})()

const sinFoto = (a) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'foto'))

const nombreArchivo = (auto, pieza, n) =>
  `paolini-${titulo(`${auto.marca} ${auto.modelo}`).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${pieza.formato}-${n}.png`

function Pieza({ pieza, auto, numero }) {
  const lienzo = useRef(null)
  const [estado, setEstado] = useState('dibujando')

  useEffect(() => {
    let vivo = true
    dibujarPieza(lienzo.current, pieza, auto)
      .then(() => vivo && setEstado('lista'))
      .catch(() => vivo && setEstado('error'))
    return () => {
      vivo = false
    }
  }, [pieza, auto])

  async function archivo() {
    const png = await aPng(lienzo.current)
    return new File([png], nombreArchivo(auto, pieza, numero), { type: 'image/png' })
  }

  async function descargar() {
    const f = await archivo()
    const url = URL.createObjectURL(f)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    anotarReciente(pieza)
  }

  async function compartir() {
    try {
      await navigator.share({ files: [await archivo()] })
      anotarReciente(pieza)
    } catch {
      /* Cerró el menú de compartir: no es un error. */
    }
  }

  const boton =
    'rounded-full border border-white/[0.12] px-3.5 py-1.5 text-[13px] transition-colors hover:border-white/30 hover:bg-white/[0.05] disabled:opacity-40'
  const vertical = pieza.formato === 'historia'

  return (
    <figure className="min-w-0">
      <div className={`relative overflow-hidden rounded-xl bg-[#151516] ${vertical ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}>
        <canvas ref={lienzo} className={`h-full w-full transition-opacity duration-300 ${estado === 'lista' ? 'opacity-100' : 'opacity-0'}`} />
        {estado === 'dibujando' && <div className="p-esqueleto absolute inset-0 rounded-none" />}
        {estado === 'error' && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/60">
            No se pudo cargar la foto de este auto.
          </p>
        )}
      </div>
      <figcaption className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-white/50">
          <b className="font-jost text-sm font-semibold text-white">{numero}</b> · {FORMATOS[pieza.formato]?.nombre ?? 'Post'}
        </span>
        {PUEDE_COMPARTIR && (
          <button type="button" onClick={compartir} disabled={estado !== 'lista'} className={boton}>
            Compartir
          </button>
        )}
        <button type="button" onClick={descargar} disabled={estado !== 'lista'} className={boton}>
          Descargar
        </button>
      </figcaption>
    </figure>
  )
}

function TextoDelPosteo({ texto }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      /* Sin permiso de portapapeles: el texto igual se puede seleccionar. */
    }
  }
  return (
    <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/50">Texto del posteo</p>
        <button type="button" onClick={copiar} className="text-[13px] text-white/70 transition-colors hover:text-white">
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/80">{texto}</p>
    </div>
  )
}

function Respuesta({ mensaje, autos, desde }) {
  const piezas = mensaje.datos?.piezas ?? []
  return (
    <div className="p-card p-4 md:p-5">
      <p className="text-sm leading-relaxed text-white/90">{mensaje.texto}</p>
      {piezas.length > 0 && (
        <div className={`mt-4 grid gap-4 ${piezas.length === 1 ? 'max-w-sm' : 'grid-cols-2 lg:grid-cols-3'}`}>
          {piezas.map((p, i) => {
            const auto = autos.find((a) => a.id === p.autoId)
            return auto ? <Pieza key={i} pieza={p} auto={auto} numero={desde + i} /> : null
          })}
        </div>
      )}
      {mensaje.datos?.texto && piezas.length > 0 && <TextoDelPosteo texto={mensaje.datos.texto} />}
    </div>
  )
}

/* Ejemplos con autos reales del stock, para que se entienda qué pedir. */
const CAMIONETAS = /hilux|amarok|ranger|s10|frontier|saveiro|strada|toro|montana|oroch|alaskan|maverick/i

function ejemplos(autos) {
  const disponibles = autos.filter((a) => a.estado === 'disponible')
  const nombre = (a) => titulo(a.modelo).split(' ')[0]
  /* Las camionetas van en femenino: "la Hilux", "la Amarok". */
  const de = (a) => (a.tipo === 'Pickup' || CAMIONETAS.test(a.modelo) ? 'de la' : 'del')
  const [a, b, c] = disponibles
  return [
    a && `Haceme un post ${de(a)} ${titulo(a.marca)} ${nombre(a)} para insta`,
    b && `Una historia ${de(b)} ${nombre(b)}, sin precio`,
    c && `Post ${de(c)} ${nombre(c)} con la etiqueta «Recién ingresado»`,
  ].filter(Boolean)
}

export default function Asistente({ stock }) {
  const autos = useMemo(() => stock.map(autoDe).filter((a) => a.foto), [stock])
  const [mensajes, setMensajes] = useState([])
  const [pedido, setPedido] = useState('')
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState(null)
  const final = useRef(null)
  const campo = useRef(null)

  useEffect(() => {
    if (mensajes.length) final.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [mensajes.length])

  async function enviar(texto) {
    const limpio = texto.trim()
    if (!limpio || pensando) return
    setError(null)
    setPensando(true)
    setPedido('')
    const nuevos = [...mensajes, { rol: 'usuario', texto: limpio }]
    setMensajes(nuevos)
    try {
      const datos = await pedirAlAsistente({
        mensaje: limpio,
        /* Al asistente le vuelve lo que propuso, con el número de cada pieza,
           para que entienda "la segunda pero en rojo". */
        historial: mensajes.map((m) => ({ rol: m.rol, texto: m.rol === 'asistente' ? JSON.stringify(m.datos) : m.texto })),
        autos: autos.map(sinFoto),
        recientes: leerRecientes(),
      })
      const numerados = { ...datos, piezas: datos.piezas.map((p, i) => ({ numero: numeroInicial(mensajes) + i, ...p })) }
      setMensajes([...nuevos, { rol: 'asistente', texto: datos.respuesta, datos: numerados }])
    } catch (e) {
      setMensajes(mensajes)
      setPedido(limpio)
      setError(e.message)
    } finally {
      setPensando(false)
      campo.current?.focus()
    }
  }

  if (!autos.length) {
    return (
      <div className="p-card px-6 py-14 text-center">
        <p className="text-base">Todavía no hay autos con foto</p>
        <p className="mt-1 text-sm text-white/60">
          Cargá el stock en <a href="#carga" className="underline underline-offset-4">Carga</a> y volvé: el asistente arma los posts con esas fotos.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="font-jost text-[28px] font-medium leading-tight md:text-[34px]">Posts para Instagram</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">
          Pedí el post como se lo pedirías a alguien del local. Sale con la foto real del auto y un diseño distinto cada vez; después
          podés pedirle cambios.
        </p>
      </div>

      {mensajes.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {ejemplos(autos).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => enviar(e)}
              className="rounded-full border border-white/[0.1] px-4 py-2 text-left text-[13px] text-white/75 transition-colors hover:border-white/30 hover:text-white"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {mensajes.map((m, i) =>
        m.rol === 'usuario' ? (
          <div key={i} ref={i === mensajes.length - 1 ? final : null} className="flex justify-end">
            <p className="max-w-[80%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-2.5 text-sm">{m.texto}</p>
          </div>
        ) : (
          <div key={i} ref={i === mensajes.length - 1 ? final : null}>
            <Respuesta mensaje={m} autos={autos} desde={m.datos?.piezas?.[0]?.numero ?? 1} />
          </div>
        ),
      )}

      {pensando && (
        <div className="p-card p-4 md:p-5" aria-live="polite">
          <p className="text-sm text-white/60">Armando las propuestas…</p>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`p-esqueleto aspect-[4/5] ${i === 2 ? 'hidden lg:block' : ''}`} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-[#FF7A83]">
          No salió: {error}. Probá de nuevo.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar(pedido)
        }}
        className="sticky bottom-24 z-10 flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-[#0B0B0C]/95 p-2 backdrop-blur md:bottom-6"
      >
        <label className="sr-only" htmlFor="asistente-pedido">
          Qué post querés
        </label>
        <textarea
          id="asistente-pedido"
          ref={campo}
          rows={1}
          value={pedido}
          maxLength={2000}
          onChange={(e) => setPedido(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar(pedido)
            }
          }}
          placeholder={mensajes.length ? 'Pedile un cambio: «la 2 en rojo», «sacale el precio», «hacela historia»' : 'Haceme un post del…'}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!pedido.trim() || pensando}
          className="shrink-0 rounded-full bg-[#E0323F] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#EA4350] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pedir
        </button>
      </form>
    </div>
  )
}

/* El número de la primera pieza de la próxima respuesta: siguen corriendo
   en toda la charla (1, 2, 3, 4…) para que "la 4" no sea ambiguo. */
function numeroInicial(mensajes) {
  return mensajes.reduce((n, m) => n + (m.datos?.piezas?.length ?? 0), 0) + 1
}
