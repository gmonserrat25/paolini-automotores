import { asset } from '../lib/asset'
import { SectionTitle } from './Ui'

/* Sólo lo que está verificado: más de treinta años en La Falda y cómo se
   atiende. Dirección y horarios no van acá: ya están en la franja de abajo
   del hero y en el pie. La foto es el salón con el cartel de Paolini. */
export default function Nosotros() {
  return (
    <section id="nosotros" className="bg-[#0F0F0F] py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-[60px]">
        <div>
          <SectionTitle>Más de treinta años vendiendo autos en La Falda</SectionTitle>
          <p className="mt-5 max-w-[520px] font-sans text-[17px] leading-[28px] text-white/75">
            Somos multimarca y estamos en el centro del pueblo. Te atiende
            siempre la misma gente y el precio final lo sabés antes de firmar.
          </p>
        </div>

        <img
          src={asset('/ig/showroom-cartel.webp')}
          alt="Salón de Automotores Paolini: cartel de la concesionaria y autos en exhibición"
          width="1000"
          height="624"
          className="aspect-[8/5] w-full rounded-lg object-cover"
          loading="lazy"
        />
      </div>
    </section>
  )
}
