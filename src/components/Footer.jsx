import { asset } from '../lib/asset'
import { BRANDS, CONTACT, NAV_LINKS, VEHICLES, WHATSAPP_URL } from '../data/vehicles'
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from './Icons'

const MAPS = `https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}`

const TIPOS = [...new Set(VEHICLES.map((v) => v.type))]

function Column({ title, children }) {
  return (
    <div>
      <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  )
}

function Item({ href, children }) {
  return (
    <li>
      {href ? (
        <a
          href={href}
          className="font-sans text-[13px] text-white/55 transition-colors hover:text-white"
        >
          {children}
        </a>
      ) : (
        <span className="font-sans text-[13px] text-white/55">{children}</span>
      )}
    </li>
  )
}

/* Pie de página de la referencia: la marca con su bajada a la izquierda y
   cuatro columnas de enlaces, con las redes debajo de la última. */
export default function Footer() {
  return (
    <footer id="contacto" className="bg-[#050505]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <div className="border-t border-white/10 pt-12 lg:pt-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-8">
            <div className="max-w-[320px]">
              <img
                src={asset('/ig/logo-paolini.png')}
                alt="Automotores Paolini"
                className="h-6 w-auto max-w-[220px] object-contain object-left"
              />
              <p className="mt-5 font-sans text-[13px] leading-[22px] text-white/50">
                Concesionaria multimarca en el centro de La Falda. 0km y usados
                certificados, financiación a medida y tu usado como parte de
                pago. Precio claro y la misma cara atendiendo de este lado del
                mostrador.
              </p>
            </div>

            <Column title="Tipos de vehículo">
              {TIPOS.map((tipo) => (
                <Item key={tipo} href="#buscador">
                  {tipo}
                </Item>
              ))}
              <Item href="#vehiculos">Usados certificados</Item>
            </Column>

            <Column title="Marcas">
              {BRANDS.slice(0, 6).map((brand) => (
                <Item key={brand} href="#buscador">
                  {brand}
                </Item>
              ))}
            </Column>

            <Column title="La empresa">
              {NAV_LINKS.map((link) => (
                <Item key={link.label} href={link.href}>
                  {link.label}
                </Item>
              ))}
              <Item href={MAPS}>Cómo llegar</Item>
            </Column>

            <div>
              <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-white">
                Horarios
              </h3>
              <ul className="mt-4 space-y-2">
                {CONTACT.hours.map(([dia, horario]) => (
                  <li key={dia} className="font-sans text-[13px] text-white/55">
                    {dia}: {horario}
                  </li>
                ))}
              </ul>

              <ul className="mt-6 space-y-2.5">
                <li>
                  <a
                    href={MAPS}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 font-sans text-[13px] text-white/55 transition-colors hover:text-white"
                  >
                    <PinIcon className="mt-[2px] h-[15px] w-[15px] shrink-0 text-[#E0323F]" />
                    {CONTACT.address}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:+${CONTACT.whatsapp}`}
                    className="flex items-center gap-2 font-sans text-[13px] text-white/55 transition-colors hover:text-white"
                  >
                    <PhoneIcon className="h-[15px] w-[15px] shrink-0 text-[#E0323F]" />
                    {CONTACT.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex items-center gap-2 break-all font-sans text-[13px] text-white/55 transition-colors hover:text-white"
                  >
                    <MailIcon className="h-[15px] w-[15px] shrink-0 text-[#E0323F]" />
                    {CONTACT.email}
                  </a>
                </li>
              </ul>

              <h3 className="mt-7 font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-white">
                Seguinos
              </h3>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={CONTACT.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-white/8 text-white/70 transition-colors hover:bg-[#E0323F] hover:text-white"
                >
                  <InstagramIcon className="h-[17px] w-[17px]" />
                  <span className="sr-only">Instagram</span>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-white/8 text-white/70 transition-colors hover:bg-[#E0323F] hover:text-white"
                >
                  <WhatsAppIcon className="h-[17px] w-[17px]" />
                  <span className="sr-only">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[12px] text-white/35">
            © {new Date().getFullYear()} Automotores Paolini · La Falda, Córdoba
          </p>
          <ul className="flex flex-wrap gap-5">
            <Item href="#vehiculos">Stock</Item>
            <Item href="#financiacion">Financiación</Item>
            <Item href={MAPS}>Ubicación</Item>
          </ul>
        </div>
      </div>
    </footer>
  )
}
