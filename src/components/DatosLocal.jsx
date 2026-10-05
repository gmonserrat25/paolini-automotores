import { CONTACT, estadoDelLocal } from '../data/vehicles'
import { ClockIcon, PinIcon } from './Icons'

const MAPS = `https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}`

/* Franja bajo el hero con lo primero que quiere saber quien viene a un
   local: dónde queda y si está abierto ahora. El teléfono no va acá porque
   ya está en el botón del hero. Los íconos acompañan un dato cada uno. */
export default function DatosLocal() {
  const estado = estadoDelLocal()

  return (
    <section aria-label="Datos del local" className="border-y border-white/10 bg-[#0F0F0F]">
      <ul className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-4 font-sans text-[15px] text-white/85 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-[60px]">
        <li className="flex items-center gap-2.5">
          <PinIcon className="h-[18px] w-[18px] shrink-0 text-[#D52B38]" />
          {CONTACT.address}
        </li>
        <li className="flex items-center gap-2.5">
          <ClockIcon className="h-[18px] w-[18px] shrink-0 text-[#D52B38]" />
          <span>
            <span className={estado.abierto ? 'font-semibold text-white' : ''}>
              {estado.abierto ? 'Abierto ahora' : 'Cerrado ahora'}
            </span>
            {' · '}
            {estado.texto}
          </span>
        </li>
        <li>
          <a
            href={MAPS}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-white underline decoration-white/30 underline-offset-[6px] transition-colors hover:decoration-[#D52B38]"
          >
            Cómo llegar
          </a>
        </li>
      </ul>
    </section>
  )
}
