import { asset } from '../lib/asset'
import { CONTACT, WHATSAPP_URL } from '../data/vehicles'
import { InstagramIcon, ShieldIcon, WhatsAppIcon } from './Icons'
import { Corner, Cta } from './Ui'

/* El bloque a sangre con la foto de fondo, la ficha de datos y los botones,
   equivalente al "Turning dreams into drives" de la referencia. Es la única
   sección de financiación del sitio (antes había otra más abajo, con un
   celular dibujado, que repetía lo mismo): con quién financian y el usado
   como parte de pago. Los nombres de las plataformas los dio el cliente
   (26/11/2026): DE UNA! de Bancor (bancor.com.ar/empresas/portal-empresas/de-una), y +Autos y BNA Conecta del Banco Nación.
   Sin tasas ni cuotas: cambian seguido y no las confirmaron. */
const DATOS = [
  ['Bancor', 'DE UNA!'],
  ['Banco Nación', '+Autos y BNA Conecta'],
  ['Crédito', 'Prendario'],
  ['Tu usado', 'Como parte de pago'],
  ['Entrega', 'Inmediata'],
]

export default function Banner() {
  return (
    <section id="financiacion" className="bg-[#050505]">
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
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#D52B38]">
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

          <div className="mt-9 flex flex-wrap gap-3">
            <Cta href={WHATSAPP_URL} target="_blank" rel="noreferrer" icon={<WhatsAppIcon className="h-[22px] w-[22px]" />}>
              Consultá por WhatsApp
            </Cta>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2.5 rounded-[6px] border border-white/25 px-4 py-2.5 font-sans text-[15px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/[0.06]"
            >
              <InstagramIcon className="h-[20px] w-[20px]" />
              Mirá el stock en Instagram
            </a>
          </div>
        </div>

        <Corner position="tr" className="h-9 w-9" />
        <Corner position="br" className="h-9 w-9" />
      </div>
    </section>
  )
}
