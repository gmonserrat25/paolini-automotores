import HeroNav from "./HeroNav";
import VehicleArc from "./VehicleArc";
import { ArrowRightIcon, WhatsAppIcon } from "./Icons";

/* Opción B — "Vertex".

   Tomada del prompt Vertex de MotionSites: fondo negro, titular centrado
   adelante y, detrás, un arco 3D de fichas que gira solo. Acá las fichas son
   las fotos de los autos que están a la venta, así que el hero muestra stock
   real en vez de una sola foto.

   El movimiento no depende del cursor: es el mismo en el celular y en la
   compu, y el texto nunca queda encima de una foto — vive sobre el negro. */

const STATS = [
  ["+30", "Unidades en stock"],
  ["0km y usados", "Multimarca, con garantía"],
  ["Cuotas", "Financiación a medida"],
];

export default function HeroVertex() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#050507]"
    >
      {/* Luz roja detrás del arco, para despegarlo del negro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[560px] w-[1100px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[110px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(224,50,63,0.42), rgba(224,50,63,0.10) 60%, transparent)",
        }}
      />
      {/* Piso: una línea de horizonte tenue que apoya el arco. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent"
      />

      <HeroNav className="relative z-30" />

      <div className="relative z-20 flex flex-1 flex-col justify-center px-5 pb-10 pt-6 sm:px-8 lg:px-[80px]">
        <div className="mx-auto w-full max-w-[1100px] text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-sans text-[11px] uppercase tracking-[0.18em] text-white/70 sm:text-[12px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#E0323F]" />
            La Falda, Córdoba · Stock disponible
          </p>

          <h1 className="mx-auto mt-5 max-w-[820px] font-display text-[32px] font-medium uppercase leading-[1.05] tracking-[0.03em] text-white sm:text-[44px] lg:text-[56px]">
            Encontrá el auto que va con tu camino
          </h1>

          <p className="mx-auto mt-4 max-w-[520px] font-sans text-[16px] leading-[26px] text-[#A8AAB6] sm:text-[17px] sm:leading-[28px]">
            0km y usados certificados, con precio transparente, financiación a
            medida y tu usado como parte de pago.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href="#vehiculos"
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5"
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
              className="flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 transition-colors hover:border-white/60 hover:bg-white/5"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-white" />
              <span className="font-sans text-[15px] font-medium text-white">
                Consultar por WhatsApp
              </span>
            </a>
          </div>
        </div>

        {/* El arco sangra hasta los bordes de la pantalla: si respetara el
            padding de la sección, las fichas se cortarían a 20px del borde y
            parecería un error de maquetación en vez de un desvanecido. */}
        <VehicleArc className="-mx-5 mt-9 w-auto sm:-mx-8 sm:mt-10 lg:-mx-[80px] lg:mt-12" />

        <dl className="mx-auto mt-7 grid w-full max-w-[880px] grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:mt-9">
          {STATS.map(([title, detail]) => (
            <div key={title} className="bg-[#08080B] px-3 py-3 text-center sm:px-5 sm:py-4 sm:text-left">
              <dt className="font-display text-[13px] font-medium uppercase leading-tight tracking-[0.03em] text-white sm:text-[19px]">
                {title}
              </dt>
              <dd className="mt-1 font-sans text-[11px] leading-[15px] text-[#9A9CA8] sm:text-[13px] sm:leading-[19px]">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
