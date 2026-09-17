import { asset } from '../lib/asset'
import { NAV_LINKS, WHATSAPP_URL } from '../data/vehicles'
import MobileMenu from './MobileMenu'
import { Cta } from './Ui'

/* La barra negra de arriba de la referencia: logo a la izquierda, los enlaces
   centrados y el botón de acción a la derecha. Va fija porque la página es
   larga y el botón de WhatsApp es el que tiene que estar siempre a mano. */
export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]">
      <nav className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-[76px] lg:px-[60px]">
        <a href="#inicio" className="flex shrink-0 items-center">
          <img
            src={asset('/ig/logo-paolini.png')}
            alt="Automotores Paolini"
            className="h-5 w-auto max-w-[180px] object-contain object-left sm:h-6 sm:max-w-[220px]"
          />
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-sans text-[14px] text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <Cta href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
            Pedí tu turno
          </Cta>
          <MobileMenu />
        </div>
      </nav>
    </header>
  )
}
