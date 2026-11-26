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
/* Los logos son los oficiales de cada banco (bancor.com.ar y bna.com.ar),
   cada uno sobre su color, para que la sección no quede en puro texto. Al
   del Nación se le recortó el "135 años" del aniversario. */
const BANCOS = [
  { nombre: 'Bancor', logo: '/bancos/bancor.svg', fondo: 'bg-white', alto: 'h-[30px] sm:h-[34px]', plataforma: 'DE UNA!' },
  { nombre: 'Banco Nación', logo: '/bancos/banco-nacion.svg', fondo: 'bg-[#00A0D0]', alto: 'h-[38px] sm:h-[42px]', plataforma: '+Autos y BNA Conecta' },
]

const DATOS = [
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

          <p className="mt-7 font-sans text-[13px] text-white/55">Financiamos con</p>
          <ul className="mt-3 flex flex-wrap gap-4">
            {BANCOS.map((b) => (
              <li key={b.nombre}>
                <div className={`flex h-[64px] items-center rounded-[8px] px-5 sm:h-[72px] sm:px-6 ${b.fondo}`}>
                  <img src={asset(b.logo)} alt={b.nombre} className={`${b.alto} w-auto`} loading="lazy" />
                </div>
                <p className="mt-2 font-sans text-[15px] font-semibold text-white">{b.plataforma}</p>
              </li>
            ))}
          </ul>

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
