import { asset } from '../lib/asset'
import { WHATSAPP_URL } from '../data/vehicles'
import { ShieldIcon } from './Icons'
import { Corner, Cta } from './Ui'

/* El bloque a sangre con la foto de fondo, la ficha de tres datos y el botón,
   equivalente al "Turning dreams into drives" de la referencia. */
const DATOS = [
  ['Financiación', 'Hasta 60 cuotas'],
  ['Tu usado', 'Como parte de pago'],
  ['Entrega', 'Inmediata'],
]

export default function Banner() {
  return (
    <section id="nosotros" className="bg-[#050505]">
      <div className="relative isolate w-full overflow-hidden">
        <img
          src={asset('/ig/car-showroom.jpg')}
          alt="Salón de Automotores Paolini en Av. España, La Falda"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[62%_center]"
          loading="lazy"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-[#050505]/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050505]/70 to-transparent sm:hidden" />

        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-[60px] lg:py-28">
          <h2 className="max-w-[860px] font-display text-[26px] font-semibold uppercase leading-[1.12] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
            Convertimos sueños en caminos
          </h2>

          <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#E0323F]">
              <ShieldIcon className="h-6 w-6" />
            </span>
            {DATOS.map(([label, value]) => (
              <div key={label}>
                <p className="font-sans text-[13px] text-white/55">{label}</p>
                <p className="mt-1 font-sans text-[19px] font-semibold text-white sm:text-[22px]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-9">
            <Cta href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Pedí tu turno
            </Cta>
          </div>
        </div>

        <Corner position="tr" className="h-9 w-9" />
        <Corner position="br" className="h-9 w-9" />
      </div>
    </section>
  )
}
