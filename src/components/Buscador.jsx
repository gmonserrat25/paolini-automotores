import { useMemo, useState } from 'react'
import { VEHICLES, WHATSAPP_URL } from '../data/vehicles'
import { SearchIcon } from './Icons'

/* "Find your dream car": la barra de filtros y, debajo, el auto grande con la
   palabra fantasma detrás.

   Acá los filtros hacen algo: van achicando el stock y el auto de abajo es el
   primero que queda. El botón redondo abre WhatsApp con la búsqueda escrita,
   que es lo más cerca de "buscar" que puede hacer un sitio sin backend. */
const TODOS = 'Todos'

function Select({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-1 px-4 py-3 sm:px-5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent font-sans text-[13px] text-white/80 outline-none sm:text-[14px]"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#161616] text-white">
            {option === TODOS ? label : option}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        aria-hidden="true"
        className="h-[6px] w-[10px] shrink-0 fill-none stroke-white/45"
        strokeWidth="1.4"
        strokeLinecap="round"
      >
        <path d="M1 1l4 4 4-4" />
      </svg>
    </label>
  )
}

export default function Buscador() {
  const [tipo, setTipo] = useState(TODOS)
  const [marca, setMarca] = useState(TODOS)
  const [modelo, setModelo] = useState(TODOS)

  const tipos = useMemo(
    () => [TODOS, ...new Set(VEHICLES.map((v) => v.type))],
    [],
  )
  const marcas = useMemo(
    () => [TODOS, ...new Set(VEHICLES.map((v) => v.brand))],
    [],
  )

  const porTipoYMarca = VEHICLES.filter(
    (v) =>
      (tipo === TODOS || v.type === tipo) && (marca === TODOS || v.brand === marca),
  )
  const modelos = [TODOS, ...new Set(porTipoYMarca.map((v) => v.model))]
  const encontrados = porTipoYMarca.filter(
    (v) => modelo === TODOS || v.model === modelo,
  )
  const destacado = encontrados[0]

  /* Si al cambiar marca o tipo el modelo elegido ya no existe, el `select` se
     quedaría mostrando un valor que no está en la lista. */
  const modeloVigente = modelos.includes(modelo) ? modelo : TODOS

  const busqueda = [
    tipo === TODOS ? null : tipo,
    marca === TODOS ? null : marca,
    modeloVigente === TODOS ? null : modeloVigente,
  ].filter(Boolean)

  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(
    busqueda.length
      ? `Hola Paolini, estoy buscando: ${busqueda.join(' · ')}. ¿Qué tienen disponible?`
      : 'Hola Paolini, quiero ver qué vehículos tienen disponibles.',
  )}`

  return (
    <section id="buscador" className="relative overflow-hidden bg-[#050505] pb-8 pt-16 lg:pb-14 lg:pt-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <h2 className="text-center font-display text-[26px] font-semibold uppercase leading-[1.1] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
          Encontrá tu próximo auto
        </h2>

        <div className="mx-auto mt-8 flex w-full max-w-[720px] items-center gap-1 rounded-full bg-[#141414] p-1.5 sm:gap-0">
          <div className="flex min-w-0 flex-1 divide-x divide-white/10">
            <Select label="Tipo" value={tipo} options={tipos} onChange={setTipo} />
            <Select label="Marca" value={marca} options={marcas} onChange={setMarca} />
            <Select
              label="Modelo"
              value={modeloVigente}
              options={modelos}
              onChange={setModelo}
            />
          </div>
          <a
            href={consulta}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4552] to-[#C4212D] text-white transition-transform hover:scale-105"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">Consultar esta búsqueda por WhatsApp</span>
          </a>
        </div>

        {/* Auto grande con la palabra fantasma detrás. */}
        <div className="relative mt-10 lg:mt-14">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-2 select-none font-display text-[84px] font-semibold uppercase leading-none tracking-[-0.02em] text-white/[0.05] sm:text-[130px] lg:-left-14 lg:text-[170px]"
          >
            Paolini
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 bottom-0 hidden select-none font-display text-[130px] font-semibold uppercase leading-none tracking-[-0.02em] text-white/[0.05] lg:block lg:-right-14 lg:text-[170px]"
          >
            La Falda
          </span>

          {destacado ? (
            <figure className="relative mx-auto max-w-[840px]">
              <img
                src={destacado.image}
                alt={`${destacado.brand} ${destacado.model} disponible en Automotores Paolini`}
                className="h-[200px] w-full rounded-[14px] object-cover sm:h-[300px] lg:h-[360px]"
                loading="lazy"
              />
              <figcaption className="mt-4 text-center font-sans text-[14px] text-white/60">
                <span className="font-semibold text-white">
                  {destacado.brand} {destacado.model}
                </span>{' '}
                · {destacado.detail} · {destacado.tag}
                {encontrados.length > 1
                  ? ` · y ${encontrados.length - 1} más en el salón`
                  : ''}
              </figcaption>
            </figure>
          ) : (
            <p className="relative py-16 text-center font-sans text-[15px] text-white/60">
              No tenemos esa combinación publicada. Escribinos y la buscamos
              para vos.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
