import { useEffect, useRef, useState } from "react";
import { CONTACT, NAV_LINKS } from "../data/vehicles";
import { asset } from "../lib/asset";
import { ArrowRightIcon, WhatsAppIcon } from "./Icons";

const ITEMS = NAV_LINKS;

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    // El hero es alto y el panel tapa la pantalla: sin esto se scrollea el
    // fondo por debajo mientras el menú está abierto.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("a")?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      buttonRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="menu-paolini"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10 lg:hidden"
      >
        <span className="sr-only">Abrir menú</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* Render condicional en vez de [hidden]: la utilidad `flex` de Tailwind
          gana sobre `[hidden] { display: none }` y el panel quedaba siempre
          abierto. */}
      {open ? (
        <div
          id="menu-paolini"
          className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0C] lg:hidden"
        >
          <div className="flex items-center justify-between px-5 py-6 sm:px-8">
            <img
              src={asset("/ig/logo-paolini.png")}
              alt="Automotores Paolini"
              className="h-5 w-auto max-w-[188px] object-contain object-left"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10"
            >
              <span className="sr-only">Cerrar menú</span>
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav
            ref={panelRef}
            className="flex flex-1 flex-col justify-center gap-1 px-5 sm:px-8"
          >
            {ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-white/10 py-5 font-display text-[26px] font-medium uppercase tracking-[0.04em] text-white sm:text-[32px]"
              >
                {item.label}
                <ArrowRightIcon className="h-[18px] w-[18px] text-[#E0323F] transition-transform group-hover:translate-x-1" />
              </a>
            ))}

            <div className="py-6">
              <p className="font-sans text-[13px] uppercase tracking-[0.16em] text-[#7A7C88]">
                Nuestras redes
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={CONTACT.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/20 px-4 py-2.5 font-sans text-[15px] text-white transition-colors hover:bg-white/10"
                >
                  @paoliniautomotores
                </a>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-sans text-[15px] font-medium text-[#272835]"
                >
                  <WhatsAppIcon className="h-[17px] w-[17px]" />
                  {CONTACT.phone}
                </a>
              </div>
            </div>
          </nav>

          <div className="px-5 pb-10 font-sans text-[14px] leading-[22px] text-[#7A7C88] sm:px-8">
            <p className="m-0">{CONTACT.address}</p>
            <p className="m-0">Lun a vie 9–13 y 17–21 · Sáb 9–13</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
