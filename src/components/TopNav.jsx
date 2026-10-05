import { asset } from '../lib/asset'
import { NAV_LINKS, WHATSAPP_URL } from '../data/vehicles'
import MobileMenu from './MobileMenu'
import { WhatsAppIcon } from './Icons'
import { Cta } from './Ui'

/* La barra fija de arriba: logo a la izquierda, enlaces al centro y el
   WhatsApp a la derecha. Como el canal real de venta es WhatsApp, el botón
   está siempre: con texto en escritorio y sólo con el ícono en el celular. */
export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0A0A]">
      <nav className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[76px] lg:px-[60px]">
        <a href="#inicio" className="flex shrink-0 items-center">
          <img
            src={asset('/ig/logo-paolini.svg')}
            alt="Automotores Paolini"
            className="h-7 w-auto max-w-[210px] object-contain object-left sm:h-10 sm:max-w-[340px]"
          />
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-sans text-[15px] text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <Cta
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            size="sm"
            icon={<WhatsAppIcon className="h-[18px] w-[18px]" />}
            className="hidden sm:inline-flex"
          >
            WhatsApp
          </Cta>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#D52B38] text-white transition-colors hover:bg-[#B9222E] sm:hidden"
          >
            <WhatsAppIcon className="h-[22px] w-[22px]" />
            <span className="sr-only">Escribir por WhatsApp</span>
          </a>
          <MobileMenu />
        </div>
      </nav>
    </header>
  )
}
