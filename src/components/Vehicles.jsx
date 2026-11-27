import { useRef, useState } from 'react'
import { WHATSAPP_URL } from '../data/vehicles'
import { useCatalogo } from '../lib/catalogo'
import { ChevronLeftIcon, ChevronRightIcon, FuelIcon, GearboxIcon, WhatsAppIcon } from './Icons'
import { Corner, Cta, SectionTitle } from './Ui'

const SPEC_ICONS = [FuelIcon, GearboxIcon]

/* En el celular los autos no van uno abajo del otro: se pasan deslizando de
   costado, uno por pantalla, con flechas y "3 de 29". Desde sm en adelante
   es la grilla de siempre (las mismas clases hacen las dos cosas). */
const flechita =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white'

/* En la home del celular el carrusel trae seis; el resto, en /autos. */
const EN_CELULAR = 6

function Deslizable({ autos, enCelular = autos.length, className = '' }) {
  const pista = useRef(null)
  const [actual, setActual] = useState(0)
  /* En el celular se ven las primeras `enCelular`; las demás quedan para la
     compu (o para /autos). */
  const total = Math.min(enCelular, autos.length)
  const ir = (n) => {
    const el = pista.current
    if (!el) return
    const i = Math.max(0, Math.min(total - 1, n))
    el.scrollTo({ left: el.children[i].offsetLeft - el.firstElementChild.offsetLeft, behavior: 'smooth' })
  }
  function alMover() {
    const el = pista.current
    if (!el || el.children.length < 2) return
    const paso = el.children[1].offsetLeft - el.children[0].offsetLeft
    setActual(Math.round(el.scrollLeft / paso))
  }
  return (
    <div className={className}>
      <div
        ref={pista}
        onScroll={alMover}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 lg:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {autos.map((vehicle, i) => (
          <div key={vehicle.id} className={`grid w-full shrink-0 snap-center sm:w-auto ${i >= total ? 'max-sm:hidden' : ''}`}>
            <VehicleCard vehicle={vehicle} />
          </div>
        ))}
      </div>
      {total > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-5 sm:hidden">
          <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Auto anterior" className={flechita}>
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="min-w-[64px] text-center font-sans text-[14px] tabular-nums text-white/60">
            {Math.min(actual, total - 1) + 1} de {total}
          </p>
          <button type="button" onClick={() => ir(actual + 1)} disabled={actual >= total - 1} aria-label="Auto siguiente" className={flechita}>
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function VehicleCard({ vehicle }) {
  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hola Paolini, quiero consultar por el ${vehicle.brand} ${vehicle.model}.`,
  )}`

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[10px] bg-gradient-to-b from-[#1D1D1D] to-[#131313]">
      <header className="px-5 pt-5">
        <div>
          <h3 className="font-sans text-[18px] font-semibold leading-tight text-white">
            {/* Toda la tarjeta lleva a la página del auto (la cubre este enlace);
                "Consultar" queda por encima para seguir yendo a WhatsApp. */}
            <a href={`/autos/${vehicle.id}`} className="after:absolute after:inset-0 after:z-[1] after:content-['']">
              {vehicle.model}
            </a>
          </h3>
          <p className="mt-1 font-sans text-[13px] text-white/55">
            {vehicle.brand} · {vehicle.type}
            {vehicle.ficha ? ` · ${vehicle.ficha}` : ''}
          </p>
        </div>
      </header>

      <div className="relative mt-4 h-[168px] w-full overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model} en Automotores Paolini`}
          className={`h-full w-full object-cover ${vehicle.reservado ? 'opacity-70' : ''}`}
          loading="lazy"
        />
        {vehicle.reservado ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#D52B38] px-3 py-1 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
            Reservado
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4 border-t border-white/[0.06] px-5 py-4 sm:gap-5">
        {vehicle.specs.map((spec, i) => {
          const Icon = SPEC_ICONS[i]
          return (
            <span
              key={spec}
              className="flex items-center gap-1.5 font-sans text-[13px] text-white/75"
            >
              <Icon className="h-[17px] w-[17px] text-white/45" />
              {spec}
            </span>
          )
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 px-5 pb-5">
        <p className="font-sans text-[19px] font-semibold text-white">
          {vehicle.tag}
        </p>
        <Cta
          href={consulta}
          size="sm"
          target="_blank"
          rel="noreferrer"
          className="relative z-10"
          icon={<WhatsAppIcon className="h-[18px] w-[18px]" />}
        >
          Consultar
        </Cta>
      </div>

      <Corner className="h-6 w-6" />
    </article>
  )
}

/* "POPULAR CAR" de la referencia: título a la izquierda, botón a la derecha y
   la grilla de tarjetas debajo.

   Cuando se toca una marca en la tira de arriba, esta sección pasa a ser el
   listado de esa marca: cambia el título, aparece el conteo y el botón de la
   derecha vuelve a mostrar todo el stock. */
export default function Vehicles({ marca = null, onLimpiar }) {
  const { vehicles, estado } = useCatalogo()
  const listado = marca ? vehicles.filter((v) => v.brand === marca) : vehicles
  /* Los reservados se ven, pero aparte y después de los que se pueden comprar. */
  const disponibles = listado.filter((v) => !v.reservado)
  const reservados = listado.filter((v) => v.reservado)

  const consultaMarca = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hola Paolini, ¿qué tienen disponible de ${marca}?`,
  )}`

  return (
    <section id="vehiculos" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <SectionTitle>
              {marca ? `Vehículos ${marca}` : 'Vehículos destacados'}
            </SectionTitle>
            {marca ? (
              <p className="mt-2 font-sans text-[14px] text-white/55">
                {listado.length === 0
                  ? `Ahora mismo no tenemos ningún ${marca} publicado`
                  : `${listado.length} ${listado.length === 1 ? 'vehículo' : 'vehículos'} de ${marca} en el salón`}
              </p>
            ) : null}
          </div>

          {marca ? (
            <Cta onClick={onLimpiar}>Ver todos</Cta>
          ) : (
            <Cta
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              icon={<WhatsAppIcon className="h-[22px] w-[22px]" />}
            >
              Consultar stock
            </Cta>
          )}
        </div>

        {listado.length === 0 && !marca ? (
          <div className="mt-8 rounded-[10px] border border-white/10 bg-gradient-to-b from-[#1D1D1D] to-[#131313] px-6 py-12 text-center lg:mt-10">
            <p className="mx-auto max-w-[460px] font-sans text-[15px] leading-[26px] text-white/65">
              {estado === 'cargando'
                ? 'Cargando los vehículos…'
                : 'Estamos actualizando el stock. Escribinos y te contamos qué tenemos disponible hoy.'}
            </p>
          </div>
        ) : listado.length === 0 ? (
          <div className="mt-8 rounded-[10px] border border-white/10 bg-gradient-to-b from-[#1D1D1D] to-[#131313] px-6 py-12 text-center lg:mt-10">
            <p className="mx-auto max-w-[460px] font-sans text-[15px] leading-[26px] text-white/65">
              No tenemos ningún {marca} publicado en este momento, pero
              conseguimos unidades de cualquier marca. Decinos qué buscás y lo
              rastreamos.
            </p>
            <div className="mt-6 flex justify-center">
              <Cta
                href={consultaMarca}
                target="_blank"
                rel="noreferrer"
                icon={<WhatsAppIcon className="h-[22px] w-[22px]" />}
              >
                Consultar por {marca}
              </Cta>
            </div>
          </div>
        ) : (
          <>
            {disponibles.length > 0 ? (
              <Deslizable
                key={marca ?? 'todos'}
                autos={disponibles}
                enCelular={marca ? disponibles.length : EN_CELULAR}
                className="mt-8 lg:mt-10"
              />
            ) : null}

            {!marca ? (
              <div className="mt-8 flex justify-center lg:mt-10">
                <Cta href="/autos">
                  <span className="sm:hidden">Ver más</span>
                  <span className="max-sm:hidden">Ver todos los vehículos</span>
                </Cta>
              </div>
            ) : null}

            {reservados.length > 0 ? (
              <div className={disponibles.length > 0 ? 'mt-12 lg:mt-16' : 'mt-8 lg:mt-10'}>
                <h3 className="font-display text-[20px] font-semibold uppercase leading-[1.1] tracking-[-0.01em] text-white sm:text-[24px]">
                  Reservados
                </h3>
                <p className="mt-2 font-sans text-[14px] text-white/55">
                  Ya tienen dueño en camino. Si te interesa uno parecido, consultanos.
                </p>
                <Deslizable key={`r-${marca ?? 'todos'}`} autos={reservados} className="mt-6" />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
