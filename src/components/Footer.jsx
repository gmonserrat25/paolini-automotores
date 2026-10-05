import { asset } from '../lib/asset'
import { CONTACT, WHATSAPP_URL } from '../data/vehicles'
import { PinIcon, WhatsAppIcon } from './Icons'
import { Cta } from './Ui'

const MAPS = `https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}`
const MAPA_EMBEBIDO = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT.address)}&z=16&output=embed&hl=es`

const ENLACE =
  'flex items-center gap-2.5 font-sans text-[15px] text-white/80 transition-colors hover:text-white'

/* Enlaces de texto: subrayado suave y, al pasar el mouse, la línea roja. */
const TEXTO =
  'break-all font-sans text-[15px] text-white/80 underline decoration-white/30 underline-offset-[6px] transition-colors hover:text-white hover:decoration-[#D52B38]'

/* Pie con lo que hace falta para llegar o llamar: contacto, horarios y el
   mapa. El menú y las marcas ya están arriba y no se repiten acá. */
export default function Footer() {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <div className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
          <div>
            <img
              src={asset('/ig/logo-paolini.svg')}
              alt="Automotores Paolini"
              className="h-7 w-auto max-w-[240px] object-contain object-left"
            />
            <p className="mt-5 max-w-[420px] font-sans text-[15px] leading-[24px] text-white/75">
              Concesionaria multimarca en el centro de La Falda. Precio claro y
              la misma cara atendiendo de este lado del mostrador.
            </p>

            <ul className="mt-6 space-y-3">
              <li>
                <a href={MAPS} target="_blank" rel="noreferrer" className={ENLACE}>
                  <PinIcon className="h-[18px] w-[18px] shrink-0 text-[#D52B38]" />
                  {CONTACT.address}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className={TEXTO}>
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className={TEXTO}>
                  Instagram: @paoliniautomotores
                </a>
              </li>
            </ul>

            <h3 className="mt-8 font-display text-[14px] font-semibold text-white">Horarios</h3>
            <ul className="mt-3 space-y-1.5">
              {CONTACT.hours.map(([dia, horario]) => (
                <li key={dia} className="font-sans text-[15px] text-white/80">
                  <span className="text-white/65">{dia}:</span> {horario}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Cta
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                icon={<WhatsAppIcon className="h-5 w-5" />}
              >
                {CONTACT.phone}
              </Cta>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <iframe
              title="Mapa de Automotores Paolini en Av. España 601, La Falda"
              src={MAPA_EMBEBIDO}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[320px] w-full rounded-lg border border-white/10 lg:h-full lg:min-h-[400px]"
            />
            <a href={MAPS} target="_blank" rel="noreferrer" className={TEXTO}>
              Abrir en Google Maps
            </a>
          </div>
        </div>

        <p className="border-t border-white/10 py-6 font-sans text-[14px] text-white/70">
          © {new Date().getFullYear()} Automotores Paolini · La Falda, Córdoba
        </p>
      </div>
    </footer>
  )
}
