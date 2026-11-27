import { useState } from 'react'
import { WHATSAPP_URL } from '../data/vehicles'
import { useCatalogo } from '../lib/catalogo'
import { ChevronRightIcon, FuelIcon, GearboxIcon, WhatsAppIcon } from './Icons'
import { Corner, Cta, SectionTitle } from './Ui'

const SPEC_ICONS = [FuelIcon, GearboxIcon]

/* En el celular la lista entera es un scroll interminable (hay casi 30 autos):
   se muestran de a cuatro y "Ver más" suma otros cuatro. En la compu la grilla
   va completa como siempre; por eso se esconden con clases de Tailwind
   (max-sm:hidden) y no sacándolas del HTML. */
const DE_A = 4

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

  /* Cuántas se ven en el celular; vuelve a cuatro al cambiar de marca. */
  const [vista, setVista] = useState({ marca, n: DE_A })
  const enCelular = vista.marca === marca ? vista.n : DE_A
  const quedan = disponibles.length - enCelular
  const soloCompu = quedan > 0 ? 'max-sm:hidden' : ''

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
                {disponibles.map((vehicle, i) => (
                  <div key={vehicle.id} className={`grid ${i >= enCelular ? 'max-sm:hidden' : ''}`}>
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))}
              </div>
            ) : null}

            {quedan > 0 ? (
              <div className="mt-8 flex flex-col items-center gap-2 sm:hidden">
                <Cta
                  onClick={() => setVista({ marca, n: enCelular + DE_A })}
                  icon={
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-[#0A0A0A]">
                      <ChevronRightIcon className="h-3.5 w-3.5 rotate-90 text-white" />
                    </span>
                  }
                >
                  Ver más
                </Cta>
                <p className="font-sans text-[13px] tabular-nums text-white/50">
                  {enCelular} de {disponibles.length}
                </p>
              </div>
            ) : null}

            {!marca ? (
              <div className={`mt-8 flex justify-center lg:mt-10 ${soloCompu}`}>
                <Cta href="/autos">Ver todos los vehículos</Cta>
              </div>
            ) : null}

            {reservados.length > 0 ? (
              <div className={`${disponibles.length > 0 ? 'mt-12 lg:mt-16' : 'mt-8 lg:mt-10'} ${soloCompu}`}>
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
