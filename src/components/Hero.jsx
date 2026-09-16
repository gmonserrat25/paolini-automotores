import { asset } from "../lib/asset";
import HeroNav from "./HeroNav";
import { ArrowRightIcon, WhatsAppIcon } from "./Icons";

/* Hero "Salón".

   Foto a pantalla completa, sin filtros ni efectos de cursor: la referencia
   son los heroes de concesionaria tipo Car Dealership 128 (Awwwards), donde
   el auto se ve entero y el texto se apoya abajo.

   Reemplaza al hero anterior, que revelaba la foto con un blob pegado al
   cursor: en el celular el blob se paseaba solo sobre un primer plano oscuro
   de la parrilla y no se entendía que hubiera un auto.

   La clave para que funcione en el celular es no recortar la foto a formato
   vertical: en pantallas angostas la imagen ocupa una banda arriba y el texto
   baja al negro. Recién en lg la foto pasa a fondo completo y el texto se
   superpone. Así el auto siempre se ve completo, en vez de una tira oscura. */

const STATS = [
  ["Multimarca", "0km y usados certificados"],
  ["Financiación", "En cuotas, a medida"],
  ["Tu usado", "Lo tomamos como parte de pago"],
];

export default function Hero() {
  return (
    <section
      id="inicio"
      className="pa-hero relative isolate flex min-h-[100svh] flex-col bg-[#010101] lg:min-h-[94svh]"
    >
      {/* Media. En móvil es una banda del flujo normal; en lg pasa a ser el
          fondo absoluto de toda la sección. */}
      <div className="relative h-[46svh] min-h-[260px] w-full shrink-0 lg:absolute lg:inset-0 lg:h-full lg:min-h-0">
        <img
          src={asset("/ig/hero-208-salon.jpg")}
          alt="Peugeot 208 0km en el salón de Automotores Paolini, La Falda"
          className="h-full w-full object-cover object-[56%_center] lg:object-[66%_46%]"
          fetchPriority="high"
        />
        {/* Degradados: arriba para que se lea la barra, abajo para que el
            texto no pelee con la foto. Nada de oscurecer la imagen entera. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent lg:h-[80%] lg:via-[#010101]/60" />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[66%] bg-gradient-to-r from-[#010101] via-[#010101]/72 to-transparent lg:block" />
      </div>

      <HeroNav className="absolute inset-x-0 top-0 z-20" />

      <div className="pa-hero__body relative z-10 flex flex-1 flex-col justify-end px-5 pb-8 pt-8 sm:px-8 lg:px-[80px] lg:pb-12">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="pa-hero__eyebrow flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.16em] text-[#E0323F] sm:text-[13px] sm:tracking-[0.2em]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#E0323F]" />
            La Falda, Córdoba · Multimarca
          </p>

          <h1 className="pa-hero__title mt-4 max-w-[760px] font-display text-[34px] font-medium uppercase leading-[1.05] tracking-[0.03em] text-white sm:text-[46px] lg:text-[64px]">
            Encontrá el auto que va con tu camino
          </h1>

          <p className="pa-hero__lead mt-5 max-w-[520px] font-sans text-[16px] leading-[26px] text-[#B9BBC5] sm:text-[18px] sm:leading-[29px]">
            Decenas de vehículos 0km y usados certificados, con precio
            transparente y financiación a medida. Porque comprar tu auto tiene
            que ser una alegría.
          </p>

          <div className="pa-hero__cta mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#vehiculos"
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
            >
              <ArrowRightIcon className="h-[18px] w-[18px] text-[#272835]" />
              <span className="font-sans text-[15px] font-medium text-[#272835]">
                Ver vehículos
              </span>
            </a>
            <a
              href="https://wa.me/5493548468411"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/5"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-white" />
              <span className="font-sans text-[15px] font-medium text-white">
                Consultar por WhatsApp
              </span>
            </a>
          </div>

          <dl className="pa-hero__stats mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {STATS.map(([title, detail]) => (
              <div key={title} className="bg-[#050507]/80 px-5 py-4 backdrop-blur-sm">
                <dt className="font-sans text-[12px] uppercase tracking-[0.16em] text-[#E0323F]">
                  {title}
                </dt>
                <dd className="mt-1 font-sans text-[14px] leading-[20px] text-white/85">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
