import { useRef } from 'react'
import { BRANDS, VEHICLES } from '../data/vehicles'
import BrandLogo from './BrandLogos'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

/* La tira de marcas que va debajo del hero: el emblema de cada fábrica en
   gris con su nombre debajo, y el activo en rojo, igual que la maqueta.

   Cada marca es un enlace a #vehiculos: al tocarla, el listado de abajo
   queda con los autos de esa marca y la página baja hasta ahí. Va como <a>
   y no como <button> para que el salto lo haga el navegador, que ya respeta
   el scroll suave y el alto de la barra fija. */
export default function BrandStrip({ marca, onSelect }) {
  const railRef = useRef(null)

  const scrollBy = (dir) => {
    railRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  const conStock = new Set(VEHICLES.map((v) => v.brand))

  return (
    <section
      aria-label="Marcas que trabajamos"
      className="border-y border-white/5 bg-[#050505]"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-8 sm:px-8 lg:px-[60px] lg:py-10">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:text-white sm:flex"
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
          <span className="sr-only">Marcas anteriores</span>
        </button>

        <ul
          ref={railRef}
          className="pa-rail flex flex-1 items-center gap-8 overflow-x-auto sm:justify-between sm:gap-4"
        >
          {BRANDS.map((brand, i) => {
            /* La maqueta nunca muestra la tira apagada entera: siempre hay
               una marca pintada. Mientras no se haya elegido ninguna, la
               primera va en rojo nada más que por eso. La que está filtrando
               de verdad se distingue por la línea de abajo. */
            const filtrando = brand === marca
            const pintada = filtrando || (!marca && i === 0)

            return (
              <li key={brand}>
                <a
                  href="#vehiculos"
                  onClick={() => onSelect(brand)}
                  aria-current={filtrando ? 'true' : undefined}
                  className={`flex flex-col items-center gap-2 transition-colors ${
                    pintada ? 'text-[#E0323F]' : 'text-white/25 hover:text-white/55'
                  }`}
                >
                  <BrandLogo marca={brand} className="h-7 w-7 shrink-0" />
                  <span
                    className={`whitespace-nowrap border-b-2 pb-1 font-wordmark text-[11px] uppercase tracking-[0.18em] ${
                      filtrando ? 'border-[#E0323F]' : 'border-transparent'
                    }`}
                  >
                    {brand}
                  </span>
                  <span className="sr-only">
                    {conStock.has(brand)
                      ? ' — ver los vehículos de esta marca'
                      : ' — consultar por esta marca'}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:text-white sm:flex"
        >
          <ChevronRightIcon className="h-[18px] w-[18px]" />
          <span className="sr-only">Marcas siguientes</span>
        </button>
      </div>
    </section>
  )
}
