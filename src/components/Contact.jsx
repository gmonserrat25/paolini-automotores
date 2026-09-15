import { CONTACT } from '../data/vehicles'
import { WhatsAppIcon, PhoneIcon, ArrowRightIcon } from './Icons'

export default function Contact() {
  return (
    <section id="contacto" className="bg-[#08080A] px-5 py-24 sm:px-8 lg:px-[80px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="font-inter text-[13px] uppercase tracking-[0.18em] text-[#E0323F]">
              Contacto
            </p>
            <h2 className="mt-3 max-w-[466px] font-bebas text-[44px] leading-none text-white sm:text-[56px] lg:text-[64px]">
              Escribinos y te respondemos hoy
            </h2>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-lg bg-white px-5 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-[#272835]" />
                <span className="font-inter text-[15px] font-medium text-[#272835]">
                  WhatsApp {CONTACT.phone}
                </span>
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-lg border border-white/20 px-5 text-white transition-colors hover:bg-white/10"
              >
                <span className="font-inter text-[15px] font-medium">
                  @paoliniautomotores
                </span>
                <ArrowRightIcon className="h-[18px] w-[18px]" />
              </a>
            </div>

            <dl className="mt-12 grid gap-8 sm:grid-cols-2">
              <div>
                <dt className="font-inter text-[13px] uppercase tracking-[0.14em] text-[#7A7C88]">
                  Dirección
                </dt>
                <dd className="mt-2 font-inter text-[16px] leading-[26px] text-white">
                  {CONTACT.address}
                </dd>
              </div>
              <div>
                <dt className="font-inter text-[13px] uppercase tracking-[0.14em] text-[#7A7C88]">
                  Teléfono
                </dt>
                <dd className="mt-2 font-inter text-[16px] leading-[26px] text-white">
                  <a
                    href={`tel:+54${CONTACT.whatsapp.slice(2)}`}
                    className="inline-flex items-center gap-2 hover:opacity-70"
                  >
                    <PhoneIcon className="h-[16px] w-[16px]" />
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-inter text-[13px] uppercase tracking-[0.14em] text-[#7A7C88]">
                  Horarios
                </dt>
                <dd className="mt-2 space-y-1">
                  {CONTACT.hours.map(([day, time]) => (
                    <div
                      key={day}
                      className="flex max-w-[380px] justify-between gap-6 font-inter text-[15px] text-[#9A9CA8]"
                    >
                      <span>{day}</span>
                      <span className="text-white">{time}</span>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Mapa de Automotores Paolini en La Falda"
              src="https://www.google.com/maps?q=Av.+Espa%C3%B1a+601,+La+Falda,+C%C3%B3rdoba&output=embed"
              className="h-full min-h-[420px] w-full [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.7)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
