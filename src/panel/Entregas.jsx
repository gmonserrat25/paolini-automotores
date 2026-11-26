import { useEffect, useRef, useState } from 'react'
import { gracias, mensajeDe, seFue } from '../lib/entregas'
import { agregarEntrega, cambiarMensajeEntrega, eliminarEntrega, listarEntregas } from './datos'
import { IconoBasura } from './icons'

/* La pantalla "Entregas": al vender un auto se sube la foto con quien se lo
   llevó. En el sitio sale "¡Gracias {nombre}!" en grande y "Se fue con su
   {vehículo}." abajo, armado solo (ver src/lib/entregas.js), y si quieren,
   un mensaje propio debajo, escrito como quieran. El mensaje se puede
   cambiar o sacar después desde la lista. */

const MAX_MENSAJE = 160

const campo =
  'mt-1.5 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0C] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors hover:border-white/20 focus:border-white/40 focus:outline-none'

const VACIO = { cliente: '', vehiculo: '', plural: false, mensaje: '' }

function Formulario({ onCreada }) {
  const [form, setForm] = useState(VACIO)
  const [archivo, setArchivo] = useState(null)
  const [vista, setVista] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const entrada = useRef(null)

  /* La miniatura vive mientras el archivo elegido; se libera al cambiarlo y
     al salir de la pantalla. */
  const miniatura = useRef(null)
  useEffect(() => () => miniatura.current && URL.revokeObjectURL(miniatura.current), [])
  function elegir(nuevo) {
    if (miniatura.current) URL.revokeObjectURL(miniatura.current)
    miniatura.current = nuevo ? URL.createObjectURL(nuevo) : null
    setArchivo(nuevo)
    setVista(miniatura.current)
  }

  const cambiar = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const cliente = form.cliente.trim()
  const vehiculo = form.vehiculo.trim()
  const listo = cliente && vehiculo && archivo

  async function enviar(e) {
    e.preventDefault()
    if (!listo || guardando) return
    setGuardando(true)
    setError(null)
    try {
      onCreada(await agregarEntrega({ cliente, plural: form.plural, vehiculo, mensaje: form.mensaje.trim(), archivo }))
      setForm(VACIO)
      elegir(null)
      if (entrada.current) entrada.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="p-card grid gap-5 p-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:p-6">
      <div>
        <p className="text-sm">Foto</p>
        <label
          htmlFor="entrega-foto"
          className="mt-1.5 flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/[0.18] bg-[#0B0B0C] text-center text-sm text-white/60 transition-colors hover:border-white/40"
        >
          {vista ? (
            <img src={vista} alt="Foto elegida" className="h-full w-full object-cover" />
          ) : (
            <span className="px-4">Elegí la foto de la entrega</span>
          )}
        </label>
        <input
          ref={entrada}
          id="entrega-foto"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => elegir(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm" htmlFor="entrega-cliente">
          Nombre del cliente
          <input
            id="entrega-cliente"
            value={form.cliente}
            onChange={cambiar('cliente')}
            maxLength={60}
            placeholder="Graciela"
            className={campo}
          />
        </label>
        <label className="flex items-center gap-2.5 text-sm text-white/80" htmlFor="entrega-plural">
          <input
            id="entrega-plural"
            type="checkbox"
            checked={form.plural}
            onChange={cambiar('plural')}
            className="h-4 w-4 accent-[#E0323F]"
          />
          Son varios (familia, pareja)
        </label>
        <label className="block text-sm" htmlFor="entrega-vehiculo">
          Vehículo entregado
          <input
            id="entrega-vehiculo"
            value={form.vehiculo}
            onChange={cambiar('vehiculo')}
            maxLength={80}
            placeholder="Polo Robust 0km"
            className={campo}
          />
        </label>

        <label className="block text-sm" htmlFor="entrega-mensaje">
          Mensaje <span className="text-white/50">(opcional, escribí lo que quieras)</span>
          <textarea
            id="entrega-mensaje"
            value={form.mensaje}
            onChange={cambiar('mensaje')}
            maxLength={MAX_MENSAJE}
            rows={2}
            placeholder="Segunda vez que confía en nosotros"
            className={`${campo} resize-none`}
          />
        </label>

        <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          <p className="text-xs text-white/50">Así sale en el sitio</p>
          {cliente && vehiculo ? (
            <>
              <p className="mt-1.5 font-jost text-xl font-semibold leading-tight text-white">{gracias({ cliente })}</p>
              <p className="mt-0.5">{seFue({ plural: form.plural, vehiculo })}</p>
              {form.mensaje.trim() && <p className="mt-0.5 whitespace-pre-line text-white">{form.mensaje.trim()}</p>}
            </>
          ) : (
            <p className="mt-1">Completá el nombre y el vehículo y acá ves cómo queda.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#FF7A83]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!listo || guardando}
          className="rounded-full bg-[#E0323F] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#EA4350] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {guardando ? 'Subiendo…' : 'Publicar entrega'}
        </button>
      </div>
    </form>
  )
}

function EditarMensaje({ entrega, onGuardado, onCerrar }) {
  const [texto, setTexto] = useState(entrega.mensaje ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      onGuardado(await cambiarMensajeEntrega(entrega.id, texto.trim()))
      onCerrar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }
  return (
    <form onSubmit={guardar} className="mt-2 space-y-2">
      <label className="sr-only" htmlFor={`mensaje-${entrega.id}`}>
        Mensaje de la entrega de {entrega.cliente}
      </label>
      <textarea
        id={`mensaje-${entrega.id}`}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={MAX_MENSAJE}
        rows={2}
        placeholder="Escribí lo que quieras (vacío = sin mensaje)"
        className={`${campo} mt-0 resize-none`}
      />
      {error && <p role="alert" className="text-sm text-[#FF7A83]">{error}</p>}
      <div className="flex gap-2 text-sm">
        <button type="submit" disabled={guardando} className="rounded-full bg-[#E0323F] px-3.5 py-1.5 transition-colors hover:bg-[#EA4350] disabled:opacity-40">
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-full border border-white/[0.12] px-3.5 py-1.5 transition-colors hover:bg-white/[0.05]">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Fila({ entrega, onBorrar, onCambiada }) {
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [editando, setEditando] = useState(false)
  const boton = 'rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-40'
  const mensaje = mensajeDe(entrega)

  return (
    <li className="flex items-start gap-4 p-3">
      <img src={entrega.foto} alt="" className="h-16 w-14 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-white">{gracias(entrega)}</p>
        <p className="text-white/60">{seFue(entrega)}</p>
        {editando ? (
          <EditarMensaje entrega={entrega} onGuardado={onCambiada} onCerrar={() => setEditando(false)} />
        ) : (
          <>
            {mensaje && <p className="mt-0.5 whitespace-pre-line text-white/90">{mensaje}</p>}
            <button type="button" onClick={() => setEditando(true)} className="mt-1 text-[13px] text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline">
              {mensaje ? 'Cambiar mensaje' : 'Agregar mensaje'}
            </button>
          </>
        )}
      </div>
      {confirmando ? (
        <span className="flex shrink-0 items-center gap-2 text-sm">
          <button
            type="button"
            disabled={borrando}
            onClick={async () => {
              setBorrando(true)
              await onBorrar(entrega.id)
              setBorrando(false)
            }}
            className={`${boton} bg-[#E0323F] hover:bg-[#EA4350]`}
          >
            {borrando ? 'Borrando…' : 'Borrar'}
          </button>
          <button
            type="button"
            disabled={borrando}
            onClick={() => setConfirmando(false)}
            className={`${boton} border border-white/[0.12] hover:bg-white/[0.05]`}
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          aria-label={`Borrar la entrega de ${entrega.cliente}`}
          className="shrink-0 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <IconoBasura />
        </button>
      )}
    </li>
  )
}

export default function Entregas() {
  const [entregas, setEntregas] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarEntregas()
      .then(setEntregas)
      .catch((e) => setError(e.message))
  }, [])

  const borrar = async (id) => {
    try {
      await eliminarEntrega(id)
      setEntregas((l) => l.filter((e) => e.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section aria-labelledby="entregas-titulo" className="space-y-4">
      <div>
        <h1 id="entregas-titulo" className="font-jost text-[28px] font-medium leading-tight md:text-[34px]">
          Entregas
        </h1>
        <p className="mt-1 text-sm text-white/60">
          La foto con quien se llevó el auto. Aparece en el sitio, la última primero.
        </p>
      </div>

      <Formulario onCreada={(nueva) => setEntregas((l) => [nueva, ...(l ?? [])])} />

      {error && (
        <p role="alert" className="text-sm text-[#FF7A83]">
          {error}
        </p>
      )}

      {entregas?.length > 0 && (
        <ul className="p-card divide-y divide-white/[0.06]">
          {entregas.map((e) => (
            <Fila key={e.id} entrega={e} onBorrar={borrar} onCambiada={(nueva) => setEntregas((l) => l.map((x) => (x.id === nueva.id ? nueva : x)))} />
          ))}
        </ul>
      )}
      {entregas?.length === 0 && (
        <p className="text-sm text-white/60">
          Todavía no hay entregas cargadas. Mientras no haya, la sección no aparece en el sitio.
        </p>
      )}
    </section>
  )
}
