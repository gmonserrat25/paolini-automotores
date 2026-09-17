import { asset } from '../lib/asset'
import { CONTACT, WHATSAPP_URL } from '../data/vehicles'
import { FuelIcon, GearboxIcon, InstagramIcon, SeatsIcon, ShieldIcon, WhatsAppIcon } from './Icons'
import { Corner } from './Ui'

/* En la referencia acá va la sección de la app: texto a la izquierda con las
   dos chapitas de descarga y el teléfono a la derecha. Paolini no tiene app,
   así que las chapitas llevan a WhatsApp y a Instagram, y la pantalla del
   teléfono muestra lo que se ve ahí: una unidad del salón con su ficha. */

function Badge({ href, icon, small, big }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-[6px] bg-gradient-to-br from-[#FF4552] to-[#C4212D] px-3.5 py-2 text-white transition-transform hover:-translate-y-0.5"
    >
      {icon}
      <span className="flex flex-col leading-none">
        <span className="font-sans text-[9px] uppercase tracking-[0.08em] text-white/80">
          {small}
        </span>
        <span className="mt-[3px] font-sans text-[14px] font-semibold">{big}</span>
      </span>
    </a>
  )
}

export default function Financiacion() {
  return (
    <section
      id="financiacion"
      className="relative isolate overflow-hidden bg-[#0A0A0A] py-16 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_18%_0%,#1B1B1B_0%,#0A0A0A_62%)]"
      />

      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-12 px-5 sm:px-8 lg:flex-row lg:justify-between lg:px-[60px]">
        <div className="max-w-[520px]">
          <h2 className="font-display text-[26px] font-semibold uppercase leading-[1.14] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
            Un auto para cada camino, una cuota para cada bolsillo
          </h2>

          <p className="mt-5 font-sans text-[15px] leading-[26px] text-white/65">
            Te armamos la financiación con el banco o la marca, tomamos tu usado
            como parte de pago y te decimos el número final antes de que firmes
            nada.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Badge
              href={WHATSAPP_URL}
              icon={<WhatsAppIcon className="h-6 w-6" />}
              small="Escribinos por"
              big="WhatsApp"
            />
            <Badge
              href={CONTACT.instagram}
              icon={<InstagramIcon className="h-6 w-6" />}
              small="Mirá el stock en"
              big="Instagram"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="relative w-[248px] shrink-0 sm:w-[278px]">
          <div className="overflow-hidden rounded-[32px] border-[6px] border-[#242424] bg-white shadow-[0_28px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between px-4 pb-1 pt-3 font-sans text-[10px] font-semibold text-[#111]">
              <span>9:41</span>
              <span className="text-[#888]">Paolini</span>
              <span>▮▮▮</span>
            </div>

            <div className="relative m-2.5 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#FF5560] to-[#C4212D] px-4 pb-0 pt-4">
              <span className="inline-block rounded-full bg-black/25 px-2 py-[3px] font-sans text-[9px] uppercase tracking-[0.1em] text-white">
                Disponible
              </span>
              <p className="mt-2 font-display text-[34px] font-semibold uppercase leading-[0.92] text-white">
                0 km
                <br />
                listo
              </p>
              <img
                src={asset('/ig/car-peugeot208gt.jpg')}
                alt=""
                className="mt-2 h-[86px] w-full rounded-t-[10px] object-cover"
                loading="lazy"
              />
            </div>

            <div className="px-4 pb-1">
              <p className="font-sans text-[9px] text-[#8A8A8A]">
                Actualizado hoy · Av. España 601, La Falda
              </p>
              <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#E6E6E6]">
                <span className="block h-full w-[72%] rounded-full bg-[#E0323F]" />
              </div>
              <div className="mt-2 flex items-baseline justify-between font-sans text-[10px] text-[#111]">
                <span className="text-[#8A8A8A]">Financiación</span>
                <span className="font-semibold">
                  hasta <span className="text-[14px]">60</span> cuotas
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-[#EDEDED] px-4 py-3 text-[#4A4A4A]">
              <ShieldIcon className="h-[17px] w-[17px]" />
              <FuelIcon className="h-[17px] w-[17px]" />
              <GearboxIcon className="h-[17px] w-[17px]" />
              <SeatsIcon className="h-[17px] w-[17px]" />
              <WhatsAppIcon className="h-[17px] w-[17px] text-[#E0323F]" />
            </div>
          </div>
        </div>
      </div>

      <Corner position="tl" className="h-9 w-9" />
    </section>
  )
}
