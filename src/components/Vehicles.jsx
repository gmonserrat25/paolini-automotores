import { WHATSAPP_URL } from '../data/vehicles'
import { useCatalogo } from '../lib/catalogo'
import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, FuelIcon, GearboxIcon, WhatsAppIcon } from './Icons'
import { Corner, Cta, SectionTitle } from './Ui'

const SPEC_ICONS = [FuelIcon, GearboxIcon]

const FLECHA =
  'absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 ring-1 ring-white/15 hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100 disabled:pointer-events-none disabled:!opacity-0 md:flex'

/* Las fotos del auto: la principal y las que suben desde la ficha del panel.
   Con el dedo se pasan deslizando (scroll-snap, sin librerías); en la compu
   aparecen flechas al pasar el mouse. Con una sola foto queda la foto sola. */
function FotosTarjeta({ vehicle }) {
  const fotos = vehicle.images.length ? vehicle.images : [vehicle.image]
  const tira = useRef(null)
  const [actual, setActual] = useState(0)
  const nombre = `${vehicle.brand} ${vehicle.model}`
  const atenuada = vehicle.reservado ? 'opacity-70' : ''

  if (fotos.length === 1) {
    return (
      <img
        src={fotos[0]}
        alt={`${nombre} en Automotores Paolini`}
        className={`h-full w-full object-cover ${atenuada}`}
        loading="lazy"
      />
    )
  }

  const ir = (i) => {
    const el = tira.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }
  const alDeslizar = () => {
    const el = tira.current
    if (el) setActual(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="group h-full" role="group" aria-roledescription="galería" aria-label={`Fotos del ${nombre}`}>
      <div
        ref={tira}
        onScroll={alDeslizar}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={i === 0 ? `${nombre} en Automotores Paolini` : `${nombre}, foto ${i + 1} de ${fotos.length}`}
            className={`h-full w-full shrink-0 snap-center object-cover ${atenuada}`}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>

      <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Foto anterior" className={`${FLECHA} left-3`}>
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => ir(actual + 1)}
        disabled={actual === fotos.length - 1}
        aria-label="Foto siguiente"
        className={`${FLECHA} right-3`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      {/* Sombra al pie para que los puntos se lean también sobre fotos claras. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 to-transparent" />
      {fotos.length > 6 ? (
        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] font-medium text-white" aria-hidden="true">
          {actual + 1} / {fotos.length}
        </span>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5" aria-hidden="true">
          {fotos.map((src, i) => (
            <span
              key={`${src}-${i}`}
              className={`h-1.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)] transition-all duration-200 ${i === actual ? 'w-4 bg-white' : 'w-1.5 bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function VehicleCard({ vehicle }) {
  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hola Paolini, quiero consultar por el ${vehicle.brand} ${vehicle.model}.`,
  )}`

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[10px] bg-gradient-to-b from-[#1D1D1D] to-[#131313]">
      <header className="px-5 pt-5">
        <div>
          <h3 className="font-sans text-[18px] font-semibold leading-tight text-white">
            {vehicle.model}
          </h3>
          <p className="mt-1 font-sans text-[13px] text-white/55">
            {vehicle.brand} · {vehicle.type}
            {vehicle.ficha ? ` · ${vehicle.ficha}` : ''}
          </p>
        </div>
      </header>

      <div className="relative mt-4 h-[168px] w-full overflow-hidden">
        <FotosTarjeta vehicle={vehicle} />
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
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6">
                {disponibles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
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
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                  {reservados.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
