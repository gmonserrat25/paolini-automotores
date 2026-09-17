import { useState } from 'react'
import { VEHICLES, WHATSAPP_URL } from '../data/vehicles'
import { FuelIcon, GearboxIcon, HeartIcon, SeatsIcon } from './Icons'
import { Corner, Cta, SectionTitle } from './Ui'

const SPEC_ICONS = [FuelIcon, GearboxIcon, SeatsIcon]

function VehicleCard({ vehicle }) {
  const [liked, setLiked] = useState(false)

  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hola Paolini, quiero consultar por el ${vehicle.brand} ${vehicle.model}.`,
  )}`

  return (
    <article className="relative flex flex-col overflow-hidden rounded-[10px] bg-gradient-to-b from-[#1D1D1D] to-[#131313]">
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="font-sans text-[18px] font-semibold leading-tight text-white">
            {vehicle.model}
          </h3>
          <p className="mt-1 font-sans text-[13px] text-white/55">
            {vehicle.brand} · {vehicle.type}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          className={`shrink-0 transition-colors ${liked ? 'text-[#E0323F]' : 'text-white/45 hover:text-white'}`}
        >
          <HeartIcon className="h-[22px] w-[22px]" filled={liked} />
          <span className="sr-only">
            {liked ? 'Quitar de favoritos' : 'Guardar'} {vehicle.model}
          </span>
        </button>
      </header>

      {/* En la maqueta el auto flota sobre un piso que se aclara hacia abajo,
          no es una foto que llene el rectángulo. */}
      <div className="relative mt-4 h-[168px] w-full overflow-hidden bg-gradient-to-b from-[#1A1A1A] via-[#242220] to-[#3B342F]">
        <img
          src={vehicle.cut}
          alt={`${vehicle.brand} ${vehicle.model} en Automotores Paolini`}
          className="absolute bottom-[14%] left-1/2 max-h-[78%] w-[82%] -translate-x-1/2 object-contain transition-transform duration-500 hover:scale-[1.05]"
          loading="lazy"
        />
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
          {vehicle.price}
          <span className="font-normal text-white/50"> / precio</span>
        </p>
        <Cta href={consulta} size="sm" target="_blank" rel="noreferrer">
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
  const listado = marca ? VEHICLES.filter((v) => v.brand === marca) : VEHICLES

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
            <Cta href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Ver todos
            </Cta>
          )}
        </div>

        {listado.length === 0 ? (
          <div className="mt-8 rounded-[10px] border border-white/10 bg-gradient-to-b from-[#1D1D1D] to-[#131313] px-6 py-12 text-center lg:mt-10">
            <p className="mx-auto max-w-[460px] font-sans text-[15px] leading-[26px] text-white/65">
              No tenemos ningún {marca} publicado en este momento, pero
              conseguimos unidades de cualquier marca. Decinos qué buscás y lo
              rastreamos.
            </p>
            <div className="mt-6 flex justify-center">
              <Cta href={consultaMarca} target="_blank" rel="noreferrer">
                Consultar por {marca}
              </Cta>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6">
            {listado.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
