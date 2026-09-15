import { asset } from '../lib/asset'
export default function Showroom() {
  return (
    <section className="bg-[#010101] px-5 pb-24 sm:px-8 lg:px-[80px]">
      <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-3">
        <figure className="relative overflow-hidden rounded-2xl lg:col-span-2">
          <img
            src={asset("/ig/car-showroom.jpg")}
            alt="Salón de Automotores Paolini en La Falda"
            loading="lazy"
            className="h-[320px] w-full object-cover sm:h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <figcaption className="absolute bottom-0 left-0 p-8">
            <h3 className="font-display text-[24px] font-medium uppercase leading-tight tracking-[0.04em] text-white sm:text-[30px]">
              Pasá por el salón
            </h3>
            <p className="mt-2 max-w-[380px] font-sans text-[15px] leading-[24px] text-white/80">
              Av. España 601, La Falda. Todos los vehículos que ves acá están
              en el salón, listos para probar.
            </p>
          </figcaption>
        </figure>

        <figure className="relative overflow-hidden rounded-2xl">
          <img
            src={asset("/ig/car-entrega.jpg")}
            alt="Entrega de un vehículo en Automotores Paolini"
            loading="lazy"
            className="h-[320px] w-full object-cover sm:h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <figcaption className="absolute bottom-0 left-0 p-8">
            <h3 className="font-display text-[24px] font-medium uppercase leading-tight tracking-[0.04em] text-white sm:text-[30px]">
              Y llevate las llaves
            </h3>
            <p className="mt-2 font-sans text-[15px] leading-[24px] text-white/80">
              Entregas en el día, con los papeles hechos.
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
