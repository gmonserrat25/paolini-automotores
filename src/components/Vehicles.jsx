import { BRANDS, VEHICLES, WHATSAPP_URL } from '../data/vehicles'
import BrandLogo from './BrandLogos'
import { WhatsAppIcon } from './Icons'
import { SectionTitle } from './Ui'

function VehicleCard({ vehicle }) {
  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hola Paolini, quiero consultar por el ${vehicle.brand} ${vehicle.model}.`,
  )}`

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#121212]">
      <img
        src={vehicle.image}
        alt={`${vehicle.brand} ${vehicle.model} en Automotores Paolini`}
        className="aspect-[9/4] w-full object-cover"
        style={{ objectPosition: vehicle.pos }}
        loading="lazy"
      />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans text-[20px] font-semibold leading-tight text-white">
          {vehicle.model}
        </h3>
        <p className="mt-1 font-sans text-[15px] text-white/70">
          {vehicle.brand} · {vehicle.type}
        </p>

        <p className="mt-4 font-sans text-[15px] font-semibold text-white">{vehicle.tag}</p>
        <p className="mt-1 font-sans text-[15px] text-white/75">{vehicle.specs.join(' · ')}</p>

        <a
          href={consulta}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 self-start font-sans text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-[6px] transition-colors hover:decoration-[#D52B38]"
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          Consultar por este auto
        </a>
      </div>
    </article>
  )
}

/* Las marcas son el filtro: sólo las que tienen algo publicado, con la
   cantidad de cada una. La activa va en blanco lleno; tocarla de nuevo (o
   "Todas") saca el filtro. Con seis autos no hace falta más que esto. */
function Chip({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-sans text-[15px] font-semibold transition-colors ${
        activo
          ? 'border-white bg-white text-[#0A0A0A]'
          : 'border-white/25 text-white hover:border-white/60'
      }`}
    >
      {children}
    </button>
  )
}

export default function Vehicles({ marca, onMarca }) {
  const listado = marca ? VEHICLES.filter((v) => v.brand === marca) : VEHICLES

  return (
    <section id="vehiculos" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <SectionTitle>Stock</SectionTitle>

        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          <Chip activo={!marca} onClick={() => onMarca(null)}>
            Todas ({VEHICLES.length})
          </Chip>
          {BRANDS.map((brand) => (
            <Chip
              key={brand}
              activo={brand === marca}
              onClick={() => onMarca(brand === marca ? null : brand)}
            >
              <BrandLogo marca={brand} className="h-5 w-5 shrink-0" />
              {brand} ({VEHICLES.filter((v) => v.brand === brand).length})
            </Chip>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {listado.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  )
}
