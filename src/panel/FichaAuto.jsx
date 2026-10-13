import { useEffect, useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { pesos } from './calculos'
import ConfirmarEliminar from './ConfirmarEliminar'
import { ESTADOS, ESTADO_LABEL } from './mock'

/* La ficha de un auto: sus especificaciones en una tarjeta y, desde ahí mismo,
   la edición. Es un <dialog> nativo (atrapa el foco, se cierra con Esc y no
   deja tocar lo de atrás), como la confirmación de eliminar. */

const TIPOS = ['Auto', 'Hatchback', 'Sedán', 'SUV', 'Pick-up', 'Utilitario', 'Coupé']
const COMBUSTIBLES = ['Nafta', 'Diésel', 'Híbrido', 'Eléctrico', 'GNC']

/* Texto de cómo se reconoció cada auto al cargarlo. */
const RECONOCIDO = {
  patente: 'Por la patente de la foto',
  'patente dudosa': 'Patente con una letra distinta (confirmado a mano)',
  'modelo y color': 'Por modelo y color (la chapa no se leía)',
  'modelo y color dudoso': 'Sugerido por modelo y color (confirmado a mano)',
  manual: 'Asignado a mano',
}

/* Campos de texto y de número; el `k` es la clave en `unidad.ficha`. */
const TEXTOS = [
  { k: 'marca', label: 'Marca', req: true },
  { k: 'modelo', label: 'Modelo', req: true },
  { k: 'patente', label: 'Patente', req: true },
  { k: 'color', label: 'Color' },
]
const NUMEROS = [
  { k: 'anio', label: 'Año' },
  { k: 'km', label: 'Kilómetros' },
  { k: 'precio', label: 'Precio ($)' },
]

const inicial = (f) => ({
  ...Object.fromEntries([...TEXTOS, ...NUMEROS].map(({ k }) => [k, f[k] == null ? '' : String(f[k])])),
  tipo: f.tipo,
  combustible: f.combustible,
})

function Dato({ etiqueta, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-white/60">{etiqueta}</dt>
      <dd className="mt-0.5 truncate text-sm tabular-nums">{children || '—'}</dd>
    </div>
  )
}

const campo =
  'mt-1.5 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0C] px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors hover:border-white/20 focus:border-white/40 focus:outline-none'

function Lista({ id, label, valor, opciones, etiquetas = {}, onChange }) {
  const todas = opciones.includes(valor) ? opciones : [valor, ...opciones]
  return (
    <label className="block text-sm" htmlFor={id}>
      {label}
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} className={campo}>
        {todas.map((o) => (
          <option key={o} value={o}>
            {etiquetas[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FichaAuto({ unidad, empezarEditando = false, onCerrar, onGuardar, onEliminar }) {
  const ref = useRef(null)
  const [editando, setEditando] = useState(empezarEditando)
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [form, setForm] = useState(() => ({ ...inicial(unidad.ficha), estado: unidad.estado }))
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => d?.close()
  }, [])

  const f = unidad.ficha
  const cambiar = (k) => (v) => setForm((a) => ({ ...a, [k]: v }))

  const empezar = () => {
    setForm({ ...inicial(f), estado: unidad.estado })
    setError(null)
    setEditando(true)
  }

  async function guardar(e) {
    e.preventDefault()
    const cambios = {}
    for (const { k, label, req } of TEXTOS) {
      const v = form[k].trim()
      if (req && !v) return setError(`${label} no puede quedar vacío.`)
      if (v !== (f[k] ?? '')) cambios[k] = v || null
    }
    for (const { k, label } of NUMEROS) {
      const v = form[k].trim().replace(/\./g, '')
      const n = v === '' ? null : Number(v)
      if (n !== null && (!Number.isInteger(n) || n < 0)) return setError(`${label} tiene que ser un número entero.`)
      if (n !== (f[k] ?? null)) cambios[k] = n
    }
    if (form.tipo !== f.tipo) cambios.tipo = form.tipo
    if (form.combustible !== f.combustible) cambios.combustible = form.combustible
    if (form.estado !== unidad.estado) cambios.estado = form.estado
    if (!Object.keys(cambios).length) return setEditando(false)

    setGuardando(true)
    setError(null)
    const falla = await onGuardar(unidad.id, cambios)
    setGuardando(false)
    if (falla) return setError(falla)
    setEditando(false)
  }

  const boton =
    'rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  const secundario = `${boton} border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.05]`

  return (
    <>
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        if (!guardando) onCerrar()
      }}
      onClick={(e) => {
        if (e.target === ref.current && !editando && !guardando) onCerrar()
      }}
      aria-labelledby="ficha-titulo"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0B0B0C] text-white backdrop:bg-black/70"
    >
      <img
        src={unidad.image}
        alt={`${unidad.brand} ${unidad.model}`}
        className={`aspect-[16/9] w-full object-cover ${unidad.estado === 'vendido' ? 'opacity-60' : ''}`}
      />

      <div className="p-6">
        <p className="flex items-center gap-1.5 text-xs text-white/60">
          <BrandLogo marca={unidad.brand} className="h-3.5 w-3.5" />
          {unidad.brand}
        </p>
        <h2 id="ficha-titulo" className="mt-1 font-jost text-xl font-medium">
          {unidad.model}
        </h2>

        {!editando ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Dato etiqueta="Patente">{f.patente}</Dato>
              <Dato etiqueta="Año">{f.anio}</Dato>
              <Dato etiqueta="Kilómetros">{f.km != null && `${f.km.toLocaleString('es-AR')} km`}</Dato>
              <Dato etiqueta="Tipo">{f.tipo}</Dato>
              <Dato etiqueta="Combustible">{f.combustible}</Dato>
              <Dato etiqueta="Color">{f.color}</Dato>
              <Dato etiqueta="Precio">{f.precio != null && pesos(f.precio)}</Dato>
              <Dato etiqueta="Estado">{ESTADO_LABEL[unidad.estado]}</Dato>
              <Dato etiqueta="Cómo se reconoció">{RECONOCIDO[unidad.reconocidoPor]}</Dato>
            </dl>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className={`${boton} border border-[#E0323F]/50 text-[#FF6B76] hover:bg-[#E0323F]/10`}
              >
                Eliminar
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onCerrar} className={secundario}>
                  Cerrar
                </button>
                <button type="button" onClick={empezar} className={`${boton} bg-[#E0323F] hover:bg-[#EA4350]`}>
                  Editar
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={guardar} className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXTOS.map(({ k, label, req }) => (
                <label key={k} className="block text-sm" htmlFor={`f-${k}`}>
                  {label}
                  <input
                    id={`f-${k}`}
                    value={form[k]}
                    onChange={(e) => cambiar(k)(e.target.value)}
                    required={req}
                    className={campo}
                  />
                </label>
              ))}
              <Lista id="f-tipo" label="Tipo" valor={form.tipo} opciones={TIPOS} onChange={cambiar('tipo')} />
              <Lista
                id="f-combustible"
                label="Combustible"
                valor={form.combustible}
                opciones={COMBUSTIBLES}
                onChange={cambiar('combustible')}
              />
              {NUMEROS.map(({ k, label }) => (
                <label key={k} className="block text-sm" htmlFor={`f-${k}`}>
                  {label}
                  <input
                    id={`f-${k}`}
                    inputMode="numeric"
                    value={form[k]}
                    onChange={(e) => cambiar(k)(e.target.value)}
                    className={campo}
                  />
                </label>
              ))}
              <Lista
                id="f-estado"
                label="Estado"
                valor={form.estado}
                opciones={ESTADOS}
                etiquetas={ESTADO_LABEL}
                onChange={cambiar('estado')}
              />
            </div>
            <p className="mt-3 text-xs text-white/60">
              Lo que cambies se ve en el sitio en unos segundos. Un auto en «vendido» deja de mostrarse.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-[#FF6B76]">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditando(false)} disabled={guardando} className={secundario}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className={`${boton} bg-[#E0323F] hover:bg-[#EA4350]`}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
    {confirmando && (
      <ConfirmarEliminar
        unidades={[unidad]}
        eliminando={eliminando}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={async () => {
          setEliminando(true)
          const ok = await onEliminar([unidad])
          setEliminando(false)
          if (ok) onCerrar()
          else setConfirmando(false)
        }}
      />
    )}
    </>
  )
}
