import { asset } from '../lib/asset'
import { SectionTitle } from './Ui'

/* Sólo lo que dice el cliente de sí mismo. Los treinta años quedan en el hero
   y la dirección y los horarios no van acá: ya están en la franja de abajo
   del hero y en el pie. La foto es un utilitario en el salón. */
export default function Nosotros() {
  return (
    <section id="nosotros" className="bg-[#0F0F0F] py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-[60px]">
        <div>
          <SectionTitle>La misma cara de este lado del mostrador</SectionTitle>
          <p className="mt-5 max-w-[520px] font-sans text-[17px] leading-[28px] text-white/75">
            Somos multimarca y estamos en el centro del pueblo. El precio final lo sabés claro antes de firmar.
          </p>
        </div>

        <img
          src={asset('/ig/salon-utilitario.webp')}
          alt="Renault utilitario blanco en el salón de Automotores Paolini"
          width="720"
          height="450"
          className="aspect-[8/5] w-full rounded-lg object-cover"
          loading="lazy"
        />
      </div>
    </section>
  )
}
