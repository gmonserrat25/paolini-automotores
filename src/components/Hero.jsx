import BlobRevealHero from "./BlobRevealHero";
import { asset } from "../lib/asset";
import { ArrowRightIcon, WhatsAppIcon } from "./Icons";

const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Vehículos", href: "#vehiculos" },
  { label: "0km", href: "#vehiculos" },
  { label: "Usados", href: "#vehiculos" },
  { label: "Contacto", href: "#contacto" },
];

export default function Hero() {
  return (
    <div id="inicio">
      {/* Same frame on both layers: the blob turns the colour and the light
          back on over an otherwise dark plate, instead of cutting to a second
          crop. Passing a different revealImage brings back the two-shot effect. */}
      <BlobRevealHero revealImage={asset("/ig/hero-208gt-wide.jpg")}>
        {/* Gradient overlays keep the white type readable over the plate. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-black/75 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-black via-black/70 to-transparent sm:h-[300px] sm:from-black/85 sm:via-transparent" />

        {/* Large decorative wordmark — the real logo lettering as a mask.
            Difference blending flips it against whatever the blob reveals
            underneath, so it stays legible without tracking the cursor. */}
        <div className="pointer-events-none absolute left-1/2 top-[15%] w-[75%] max-w-[1073px] -translate-x-1/2 select-none mix-blend-difference">
          <div data-depth="0.5">
            <div
              className="h-[13vw] max-h-[190px] min-h-[52px] w-full"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.62) 100%)",
                WebkitMaskImage: `url('${asset("/ig/wordmark-paolini.png")}')`,
                maskImage: `url('${asset("/ig/wordmark-paolini.png")}')`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
              role="img"
              aria-label="Paolini"
            />
          </div>
        </div>

        {/* Navbar */}
        <header className="absolute inset-x-0 top-0 w-full px-5 py-6 sm:px-8 lg:px-[80px]">
          <nav className="flex items-center justify-between gap-3 sm:gap-6">
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
                    data-pa-ink
                    className="pa-ink font-sans text-[15px] transition-opacity hover:opacity-70"
                    style={{ letterSpacing: "-0.32px" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <a
                href="#contacto"
                data-pa-ink
                className="pa-ink hidden font-sans text-[15px] transition-opacity hover:opacity-70 sm:inline"
                style={{ letterSpacing: "-0.32px" }}
              >
                Financiación
              </a>
              <a
                href="https://wa.me/5493548468411"
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-2 rounded-lg bg-white px-4 shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 sm:h-12 sm:px-5"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-[#272835]" />
                <span className="font-sans text-[14px] font-medium text-[#272835] sm:text-[15px]">
                  Contacto
                </span>
              </a>
            </div>
          </nav>
        </header>

        {/* Bottom CTA area */}
        <div className="absolute inset-x-0 bottom-0 w-full px-5 pb-10 sm:px-8 lg:px-[80px] lg:pb-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
              <p
                data-pa-ink
                className="pa-ink max-w-[414px] font-sans text-[20px] leading-[30px]"
              >
                Elegí entre decenas de vehículos 0km y usados certificados, con
                precio transparente y financiación a medida. Porque comprar tu
                auto tiene que ser una alegría.
              </p>
              <a
                href="#vehiculos"
                className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-[#EEEFF2] bg-white px-5 shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
              >
                <ArrowRightIcon className="h-[18px] w-[18px] text-[#272835]" />
                <span className="font-sans text-[15px] font-medium text-[#272835]">
                  Ver vehículos
                </span>
              </a>
            </div>

            <h1
              data-pa-ink
              className="pa-ink max-w-[520px] font-display text-[30px] font-medium uppercase leading-[1.08] tracking-[0.04em] sm:text-[38px] md:text-[44px] lg:text-[48px]"
            >
              Encontrá el auto que va con tu camino
            </h1>
          </div>
        </div>
      </BlobRevealHero>
    </div>
  );
}
