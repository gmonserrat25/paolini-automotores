import { asset } from "../lib/asset";
import MobileMenu from "./MobileMenu";
import { WhatsAppIcon } from "./Icons";

const NAV_LINKS = [
  { label: "0km", href: "#vehiculos" },
  { label: "Usados seleccionados", href: "#vehiculos" },
  { label: "Financiación", href: "#servicios" },
  { label: "Contacto", href: "#contacto" },
];

/* Barra superior compartida por las dos propuestas de hero. A diferencia del
   hero anterior, el texto es blanco fijo: no se invierte según dónde esté el
   cursor, así que se lee igual en el celular y en la compu. */
export default function HeroNav({ className = "" }) {
  return (
    <header className={`w-full px-5 py-6 sm:px-8 lg:px-[80px] ${className}`.trim()}>
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 sm:gap-6">
        <a href="#inicio" className="flex shrink-0 items-center">
          <img
            src={asset("/ig/logo-paolini.png")}
            alt="Automotores Paolini"
            className="h-5 w-auto max-w-[188px] object-contain object-left sm:h-7 sm:max-w-none"
          />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-sans text-[15px] text-white/85 transition-colors hover:text-white"
                style={{ letterSpacing: "-0.32px" }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <a
            href="https://wa.me/5493548468411"
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-11 items-center justify-center gap-2 rounded-lg bg-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 sm:h-12 sm:w-auto sm:px-5"
          >
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#272835]" />
            <span className="hidden font-sans text-[15px] font-medium text-[#272835] sm:inline">
              Contacto
            </span>
            <span className="sr-only sm:hidden">Contacto por WhatsApp</span>
          </a>
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
