import { useRef, useState } from 'react'
import { agregarFoto, cambiarTipoFoto, quitarFoto } from './datos'
import { IconoBasura } from './icons'

/* "Fotos para redes", dentro de la ficha de cada auto: las fotos extra
   (interior, detalles, trasera) con las que el asistente arma los collages
   como los flyers de Paolini. Al subir una, la IA dice de qué es; si se
   equivoca, se corrige con el menú. */

const TIPOS = { exterior: 'Exterior', interior: 'Interior', detalle: 'Detalle', trasera: 'Trasera' }
const MAX = 8

export default function FotosRedes({ unidad, onFotos }) {
  const fotos = unidad.fotos ?? []
  const [subiendo, setSubiendo] = useState(0)
  const [error, setError] = useState(null)
  const entrada = useRef(null)

  async function subir(archivos) {
    setError(null)
    const lista = [...archivos].slice(0, MAX - fotos.length)
    let actuales = fotos
    for (const archivo of lista) {
      setSubiendo((n) => n + 1)
      try {
        actuales = await agregarFoto(unidad.id, archivo)
        onFotos(unidad.id, actuales)
      } catch (e) {
        setError(e.message)
      } finally {
        setSubiendo((n) => n - 1)
      }
    }
    if (entrada.current) entrada.current.value = ''
  }

  async function cambiar(url, tipo) {
    setError(null)
    try {
      onFotos(unidad.id, await cambiarTipoFoto(unidad.id, url, tipo))
    } catch (e) {
      setError(e.message)
    }
  }

  async function quitar(url) {
    setError(null)
    try {
      onFotos(unidad.id, await quitarFoto(unidad.id, url))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="mt-6 border-t border-white/[0.08] pt-5" aria-labelledby="fotos-redes">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="fotos-redes" className="text-sm font-medium">
          Fotos para redes
        </h3>
        <span className="text-xs text-white/50">
          {fotos.length} de {MAX}
        </span>
      </div>
      <p className="mt-1 text-xs text-white/60">
        Interior, detalles o la cola del auto. Con dos o más, los posts salen en collage como los de Instagram.
      </p>

      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {fotos.map((f) => (
          <li key={f.url} className="min-w-0">
            <div className="relative overflow-hidden rounded-lg">
              <img src={f.url} alt={TIPOS[f.tipo] ?? 'Foto'} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => quitar(f.url)}
                aria-label="Sacar esta foto"
                className="absolute right-1 top-1 rounded-md bg-black/70 p-1.5 text-white/80 transition-colors hover:text-white"
              >
                <IconoBasura className="h-4 w-4" />
              </button>
            </div>
            <label className="sr-only" htmlFor={`tipo-${f.url}`}>
              De qué es la foto
            </label>
            <select
              id={`tipo-${f.url}`}
              value={f.tipo}
              onChange={(e) => cambiar(f.url, e.target.value)}
              className="mt-1 w-full rounded-md border border-white/[0.1] bg-[#0B0B0C] px-2 py-1 text-xs text-white/80"
            >
              {Object.entries(TIPOS).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </li>
        ))}
        {Array.from({ length: subiendo }, (_, i) => (
          <li key={`s${i}`} className="p-esqueleto aspect-square rounded-lg" />
        ))}
        {fotos.length + subiendo < MAX && (
          <li>
            <label
              htmlFor={`fotos-${unidad.id}`}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/[0.18] px-2 text-center text-xs text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              Agregar fotos
            </label>
            <input
              ref={entrada}
              id={`fotos-${unidad.id}`}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => subir(e.target.files ?? [])}
            />
          </li>
        )}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#FF6B76]">
          {error}
        </p>
      )}
    </section>
  )
}
