import { useRef, useState } from 'react'
import { BRANDS } from '../data/vehicles'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

/* La tira de marcas que va debajo del hero. La referencia usa los logos de
   cada fábrica en gris y pinta de color el que está activo; acá van como
   palabra, que es lo que se puede mostrar sin usar logos ajenos. */
export default function BrandStrip() {
  const [active, setActive] = useState(1)
  const railRef = useRef(null)

  const scrollBy = (dir) => {
    railRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

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
          {BRANDS.map((brand, i) => (
            <li key={brand}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`whitespace-nowrap font-wordmark text-[16px] uppercase tracking-[0.18em] transition-colors sm:text-[18px] ${
                  i === active
                    ? 'text-[#E0323F]'
                    : 'text-white/25 hover:text-white/55'
                }`}
              >
                {brand}
              </button>
            </li>
          ))}
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
