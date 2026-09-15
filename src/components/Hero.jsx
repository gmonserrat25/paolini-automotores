import { ArrowRightIcon, WhatsAppIcon } from './Icons'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Vehículos', href: '#vehiculos' },
  { label: '0km', href: '#vehiculos' },
  { label: 'Usados', href: '#vehiculos' },
  { label: 'Contacto', href: '#contacto' },
]

// Local copy of the hero clip (originally served from CloudFront).
const VIDEO_URL = '/hero.mp4'

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative w-full overflow-hidden bg-[#010101]"
      style={{ height: '100vh', minHeight: '600px', maxHeight: '965px' }}
    >
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Gradient overlays. The clip is bright, so a flat scrim backs up the
          top/bottom gradients to keep the white type readable. */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-black via-black/70 to-transparent sm:h-[260px] sm:from-black/60 sm:via-transparent" />

      {/* Large decorative wordmark — the real logo lettering used as a mask so
          the gradient fill keeps Paolini's own typeface. */}
      <div className="pointer-events-none absolute left-1/2 top-[15%] w-[75%] max-w-[1073px] -translate-x-1/2 select-none">
        <div
          className="h-[13vw] max-h-[190px] min-h-[52px] w-full"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)',
            WebkitMaskImage: "url('/ig/wordmark-paolini.png')",
            maskImage: "url('/ig/wordmark-paolini.png')",
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
          role="img"
          aria-label="Paolini"
        />
      </div>

      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-20 w-full px-5 py-6 sm:px-8 lg:px-[80px]">
        <nav className="flex items-center justify-between gap-3 sm:gap-6">
          <a href="#inicio" className="flex shrink-0 items-center">
            <img
              src="/ig/logo-paolini.png"
              alt="Automotores Paolini"
              className="h-6 w-auto sm:h-7"
            />
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-sans text-[15px] text-[#EEEFF2] transition-opacity hover:opacity-70"
                  style={{ letterSpacing: '-0.32px' }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <a
              href="#contacto"
              className="hidden font-sans text-[15px] text-[#FBFBFD] transition-opacity hover:opacity-70 sm:inline"
              style={{ letterSpacing: '-0.32px' }}
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
      <div className="absolute inset-x-0 bottom-0 z-20 w-full px-5 pb-10 sm:px-8 lg:px-[80px] lg:pb-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <p className="max-w-[414px] font-sans text-[20px] leading-[30px] text-white">
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

          <h1 className="max-w-[520px] font-display text-[30px] font-medium uppercase leading-[1.08] tracking-[0.04em] text-white sm:text-[38px] md:text-[44px] lg:text-[48px]">
            Encontrá el auto que va con tu camino
          </h1>
        </div>
      </div>
    </section>
  )
}
