import { WHATSAPP_URL } from '../data/vehicles'
import { WhatsAppIcon } from './Icons'
import { Cta } from './Ui'

/* El único bloque rojo de la página: marca un cambio de ritmo después de
   tres secciones negras y es donde está la oferta que más pesa en la
   decisión. Dice sólo lo que Paolini hace de verdad. */
const PUNTOS = [
  {
    titulo: 'Financiación con el banco o la marca',
    texto: 'La gestionamos nosotros, hasta en 60 cuotas.',
  },
  {
    titulo: 'Tu usado como parte de pago',
    texto: 'Lo tomamos y te decimos el número final antes de que firmes nada.',
  },
]

export default function Financiacion() {
  return (
    <section id="financiacion" className="bg-[#D52B38] py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-[60px]">
        <div>
          <h2 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-white sm:text-[32px] lg:text-[36px]">
            Financiación y tu usado como parte de pago
          </h2>
          <div className="mt-8">
            <Cta
              href={`${WHATSAPP_URL}?text=${encodeURIComponent('Hola Paolini, quiero consultar por la financiación.')}`}
              target="_blank"
              rel="noreferrer"
              variant="inverse"
              icon={<WhatsAppIcon className="h-5 w-5" />}
            >
              Consultar la financiación
            </Cta>
          </div>
        </div>

        <ul className="space-y-6">
          {PUNTOS.map((punto) => (
            <li key={punto.titulo} className="border-t border-white/40 pt-5">
              <h3 className="font-sans text-[20px] font-semibold text-white">{punto.titulo}</h3>
              <p className="mt-2 max-w-[420px] font-sans text-[17px] leading-[26px] text-white">
                {punto.texto}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
