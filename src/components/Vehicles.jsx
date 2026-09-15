import { VEHICLES, CONTACT } from '../data/vehicles'
import { ArrowRightIcon } from './Icons'

export default function Vehicles() {
  return (
    <section id="vehiculos" className="bg-[#010101] px-5 py-24 sm:px-8 lg:px-[80px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className="font-inter text-[13px] uppercase tracking-[0.18em] text-[#E0323F]"
            >
              Stock disponible
            </p>
            <h2 className="mt-3 max-w-[560px] font-bebas text-[44px] leading-none text-white sm:text-[56px] lg:text-[64px]">
              0km y usados certificados
            </h2>
          </div>
          <p className="max-w-[414px] font-inter text-[17px] leading-[27px] text-[#9A9CA8]">
            Multimarca, con garantía y papeles al día. Tomamos tu usado como
            parte de pago y trabajamos financiación en cuotas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLES.map((v) => (
            <article
              key={v.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0E] transition-colors hover:border-white/25"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={v.image}
                  alt={`${v.brand} ${v.model}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-[#E0323F] px-3 py-1 font-inter text-[12px] font-medium text-white">
                  {v.tag}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4 p-6">
                <div>
                  <p className="font-inter text-[13px] uppercase tracking-[0.14em] text-[#7A7C88]">
                    {v.brand}
                  </p>
                  <h3 className="mt-1 font-bebas text-[30px] leading-none text-white">
                    {v.model}
                  </h3>
                  <p className="mt-2 font-inter text-[14px] text-[#9A9CA8]">
                    {v.detail}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
                    `Hola Paolini, quiero consultar por el ${v.brand} ${v.model}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Consultar por ${v.brand} ${v.model}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white transition-colors hover:bg-white hover:text-[#272835]"
                >
                  <ArrowRightIcon className="h-[18px] w-[18px]" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
