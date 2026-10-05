import { asset } from '../lib/asset'
import { CONTACT, WHATSAPP_URL } from '../data/vehicles'
import { WhatsAppIcon } from './Icons'
import { Cta } from './Ui'

/* Texto a la izquierda sobre negro y la foto a la derecha, entera: es un
   0 km claro y bien iluminado, y al ir en su propia columna el titular no
   se superpone con el auto ni hace falta oscurecer la foto con un velo.

   La foto va a sangre contra el borde derecho y se funde con el fondo por la
   izquierda. En el celular la foto va primero, en 4:3 y encuadrada sobre el
   frente del auto, y el texto baja al negro. */
export default function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-[#0A0A0A]">
      <div className="mx-auto grid max-w-[1440px] items-center lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative order-1 lg:order-2">
          <img
            src={asset('/ig/hero-208.webp')}
            alt="Peugeot 208 0 km blanco en el salón de Automotores Paolini, La Falda"
            width="1800"
            height="866"
            className="block aspect-[4/3] w-full object-cover object-[38%_center] sm:aspect-[1800/866]"
            fetchPriority="high"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0A0A0A] lg:via-transparent lg:to-transparent" />
        </div>

        <div className="order-2 px-5 pb-12 pt-8 sm:px-8 lg:order-1 lg:py-16 lg:pl-[60px] lg:pr-6">
          <h1 className="font-display text-[34px] font-semibold uppercase leading-[1.06] tracking-[-0.01em] text-white sm:text-[44px] xl:text-[52px]">
            0 km y usados en el centro de La Falda
          </h1>

          <p className="mt-5 max-w-[440px] font-sans text-[17px] leading-[27px] text-white/75">
            Multimarca, sobre Av. España, hace más de treinta años.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Cta
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              icon={<WhatsAppIcon className="h-5 w-5" />}
            >
              {CONTACT.phone}
            </Cta>
            <Cta href="#vehiculos" variant="secondary">
              Ver vehículos
            </Cta>
          </div>
        </div>
      </div>

    </section>
  )
}
