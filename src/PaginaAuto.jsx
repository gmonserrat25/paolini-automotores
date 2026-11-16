import { useEffect, useState } from 'react'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import { ArrowRightIcon, WhatsAppIcon } from './components/Icons'
import { Corner, Cta } from './components/Ui'
import { aVehiculoPublico } from './lib/catalogo'
import { WHATSAPP_URL } from './data/vehicles'

/* La página de un auto (/autos/<id>): la foto grande y todos sus datos. Se
   llega desde la tarjeta del stock. Si el auto se vendió o el enlace es viejo,
   avisa y manda de vuelta al stock. */

function Dato({ etiqueta, valor }) {
  if (!valor) return null
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] py-3.5">
      <dt className="font-sans text-[14px] text-white/55">{etiqueta}</dt>
      <dd className="text-right font-sans text-[15px] font-medium text-white">{valor}</dd>
    </div>
  )
}

function Volver() {
  return (
    <a
      href="/autos"
      className="inline-flex items-center gap-2 font-sans text-[14px] text-white/70 transition-colors hover:text-white"
    >
      <ArrowRightIcon className="h-4 w-4 rotate-180" />
      Todos los vehículos
    </a>
  )
}

export default function PaginaAuto({ id }) {
  const [auto, setAuto] = useState(null)
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    const control = new AbortController()
    fetch(`/api/autos?id=${encodeURIComponent(id)}`, { signal: control.signal })
      .then((r) => {
        if (r.status === 404) return setEstado('no-esta')
        if (!r.ok) throw new Error(String(r.status))
        return r.json().then((a) => {
          setAuto(aVehiculoPublico(a))
          setEstado('listo')
        })
      })
      .catch((e) => e.name !== 'AbortError' && setEstado('error'))
    return () => control.abort()
  }, [id])

  useEffect(() => {
    document.title = auto
      ? `${auto.brand} ${auto.model}${auto.anio ? ` ${auto.anio}` : ''} | Automotores Paolini`
      : 'Automotores Paolini'
  }, [auto])

  const consulta = auto
    ? `${WHATSAPP_URL}?text=${encodeURIComponent(
        `Hola Paolini, quiero consultar por el ${auto.brand} ${auto.model}${auto.anio ? ` ${auto.anio}` : ''}.`,
      )}`
    : WHATSAPP_URL

  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-[60px] lg:py-12">
        <Volver />

        {estado === 'listo' ? (
          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
            <div className="relative overflow-hidden rounded-[10px] bg-[#131313]">
              <img
                src={auto.image}
                alt={`${auto.brand} ${auto.model} en Automotores Paolini`}
                className={`aspect-[4/3] w-full object-cover ${auto.reservado ? 'opacity-70' : ''}`}
              />
              {auto.reservado ? (
                <span className="absolute left-4 top-4 rounded-full bg-[#D52B38] px-3.5 py-1.5 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                  Reservado
                </span>
              ) : null}
              <Corner className="h-8 w-8" />
            </div>

            <div className="flex flex-col">
              <p className="font-sans text-[14px] text-white/55">{auto.brand}</p>
              <h1 className="mt-1 font-sans text-[30px] font-semibold leading-tight text-white sm:text-[36px]">
                {auto.model}
              </h1>
              <p className="mt-4 font-sans text-[28px] font-semibold text-white">{auto.tag}</p>

              <dl className="mt-6 border-t border-white/[0.08]">
                <Dato etiqueta="Año" valor={auto.anio} />
                <Dato
                  etiqueta="Kilometraje"
                  valor={auto.km != null ? `${auto.km.toLocaleString('es-AR')} km` : null}
                />
                <Dato etiqueta="Combustible" valor={auto.combustible} />
                <Dato etiqueta="Tipo" valor={auto.type} />
                <Dato etiqueta="Color" valor={auto.color} />
              </dl>

              {auto.descripcion ? (
                <div className="mt-6">
                  <h2 className="font-sans text-[15px] font-semibold text-white">Descripción</h2>
                  <p className="mt-2 whitespace-pre-line font-sans text-[15px] leading-[26px] text-white/70">
                    {auto.descripcion}
                  </p>
                </div>
              ) : null}

              <Cta
                href={consulta}
                target="_blank"
                rel="noreferrer"
                icon={<WhatsAppIcon className="h-[22px] w-[22px]" />}
                className="mt-8 justify-center self-start"
              >
                {auto.reservado ? 'Consultar por otros similares' : 'Consultar por este auto'}
              </Cta>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[10px] border border-white/10 bg-gradient-to-b from-[#1D1D1D] to-[#131313] px-6 py-14 text-center">
            <p className="mx-auto max-w-[460px] font-sans text-[15px] leading-[26px] text-white/65">
              {estado === 'cargando'
                ? 'Cargando el vehículo…'
                : estado === 'no-esta'
                  ? 'Este vehículo ya no está disponible. Mirá el resto del stock o escribinos y te contamos qué tenemos.'
                  : 'No pudimos cargar el vehículo. Probá de nuevo en unos minutos.'}
            </p>
            {estado !== 'cargando' ? (
              <Cta href="/autos" className="mt-6">
                Ver todos los vehículos
              </Cta>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
