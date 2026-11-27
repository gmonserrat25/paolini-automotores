import { useEffect, useMemo, useState } from 'react'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import { VehicleCard } from './components/Vehicles'
import { Cta } from './components/Ui'
import { ChevronRightIcon, WhatsAppIcon } from './components/Icons'
import { CatalogoProvider, useCatalogo } from './lib/catalogo'
import { WHATSAPP_URL } from './data/vehicles'

/* /autos: todo el stock, separado en secciones por marca (en orden
   alfabético). Se puede filtrar una marca y el filtro vive en la dirección
   (?marca=Toyota), así se puede mandar el enlace por WhatsApp. Los
   reservados van al final, en su propia sección.

   En el celular la lista de tarjetas grandes obligaba a bajar y bajar: ahí
   va una cuadrícula de tres con tarjetas compactas (foto, modelo, año·km y
   precio). Tocarla abre la página del auto, que tiene el botón de WhatsApp.
   Desde sm, las tarjetas de siempre. */

function TarjetaChica({ vehicle }) {
  return (
    <a
      href={`/autos/${vehicle.id}`}
      className="flex flex-col overflow-hidden rounded-[8px] bg-gradient-to-b from-[#1D1D1D] to-[#131313] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111]">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          loading="lazy"
          className={`h-full w-full object-cover ${vehicle.reservado ? 'opacity-70' : ''}`}
        />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2.5 pt-2">
        <p className="line-clamp-2 font-sans text-[12.5px] font-semibold leading-[1.2] text-white">{vehicle.model}</p>
        {vehicle.ficha ? <p className="mt-0.5 truncate font-sans text-[11px] text-white/50">{vehicle.ficha}</p> : null}
        <p className="mt-auto pt-1.5 font-sans text-[12px] font-semibold tabular-nums text-white">{vehicle.tag}</p>
      </div>
    </a>
  )
}

/* Una sección: título, cuántos hay y la cuadrícula. Con `verMas`, el nombre
   de la marca lleva a su página y se ven
   sólo las primeras POR_SECCION y abajo va "Ver más", que lleva a la página
   de esa marca (/autos?marca=…) con todos: una marca con seis o diez autos
   llenaría la página. */
const POR_SECCION = 3

function Seccion({ titulo, nota, autos, primera, verMas }) {
  const visibles = verMas ? autos.slice(0, POR_SECCION) : autos
  const hayMas = visibles.length < autos.length
  return (
    <section className={primera ? 'mt-6 sm:mt-8' : 'mt-7 sm:mt-10 lg:mt-14'}>
      <div className="flex items-baseline gap-2.5 border-b border-white/10 pb-2 sm:gap-3 sm:pb-3">
        <h2 className="font-display text-[17px] font-semibold uppercase leading-[1.1] tracking-[-0.01em] text-white sm:text-[24px]">
          {verMas ? (
            /* El nombre de la marca también lleva a su página. */
            <a
              href={verMas.href}
              onClick={(e) => {
                e.preventDefault()
                verMas.ir()
              }}
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#E0323F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {titulo}
              <ChevronRightIcon className="h-4 w-4 text-white/45 transition-colors group-hover:text-[#E0323F] sm:h-5 sm:w-5" />
            </a>
          ) : (
            titulo
          )}
        </h2>
        <span className="font-sans text-[13px] tabular-nums text-white/45">{autos.length}</span>
      </div>
      {nota ? <p className="mt-2 font-sans text-[13px] text-white/55 sm:mt-3 sm:text-[14px]">{nota}</p> : null}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
        {visibles.map((v) => (
          <TarjetaChica key={v.id} vehicle={v} />
        ))}
      </div>
      <div className="mt-6 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visibles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </div>
      {hayMas ? (
        <div className="mt-4 flex justify-center sm:mt-6">
          <Cta
            href={verMas.href}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              verMas.ir()
            }}
          >
            Ver más
          </Cta>
        </div>
      ) : null}
    </section>
  )
}

const marcaDeLaDireccion = () => new URLSearchParams(window.location.search).get('marca')

function Listado() {
  const { vehicles, estado } = useCatalogo()
  const [marca, setMarca] = useState(marcaDeLaDireccion)

  useEffect(() => {
    document.title = 'Todos los vehículos | Automotores Paolini'
  }, [])

  const marcas = useMemo(() => [...new Set(vehicles.map((v) => v.brand))].sort(), [vehicles])
  /* Si la marca del enlace ya no tiene autos, se muestra todo en vez de una página vacía. */
  const activa = marca && marcas.includes(marca) ? marca : null
  const listado = activa ? vehicles.filter((v) => v.brand === activa) : vehicles
  const disponibles = listado.filter((v) => !v.reservado)
  const reservados = listado.filter((v) => v.reservado)
  const porMarca = useMemo(() => {
    const grupos = new Map()
    for (const v of disponibles) grupos.set(v.brand, [...(grupos.get(v.brand) ?? []), v])
    return [...grupos].sort(([a], [b]) => a.localeCompare(b, 'es'))
  }, [disponibles])

  const elegir = (m) => {
    setMarca(m)
    window.history.replaceState(null, '', m ? `/autos?marca=${encodeURIComponent(m)}` : '/autos')
  }

  /* "Ver más" de una sección: filtra esa marca y vuelve arriba. */
  const verMarca = (m) => {
    setMarca(m)
    /* pushState (no replace): la flecha de atrás del celular vuelve a todas. */
    window.history.pushState(null, '', `/autos?marca=${encodeURIComponent(m)}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const volver = () => setMarca(marcaDeLaDireccion())
    window.addEventListener('popstate', volver)
    return () => window.removeEventListener('popstate', volver)
  }, [])

  const chip = (seleccionada) =>
    `shrink-0 rounded-full border px-4 py-1.5 font-sans text-[14px] transition-colors ${
      seleccionada
        ? 'border-[#D52B38] bg-[#D52B38] text-white'
        : 'border-white/15 text-white/75 hover:border-white/35 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-[60px] lg:py-14">
        <h1 className="font-display text-[32px] font-semibold uppercase leading-[1.05] tracking-[-0.01em] text-white sm:text-[44px]">
          {activa ? `Vehículos ${activa}` : 'Todos los vehículos'}
        </h1>
        {vehicles.length > 0 ? (
          <p className="mt-2 font-sans text-[14px] text-white/55">
            {listado.length} {listado.length === 1 ? 'vehículo' : 'vehículos'} en el salón
          </p>
        ) : null}

        {marcas.length > 1 ? (
          <div
            className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:mt-6 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filtrar por marca"
          >
            <button type="button" onClick={() => elegir(null)} aria-pressed={!activa} className={chip(!activa)}>
              Todas
            </button>
            {marcas.map((m) => (
              <button key={m} type="button" onClick={() => elegir(m)} aria-pressed={activa === m} className={chip(activa === m)}>
                {m}
              </button>
            ))}
          </div>
        ) : null}

        {vehicles.length === 0 ? (
          <div className="mt-8 rounded-[10px] border border-white/10 bg-gradient-to-b from-[#1D1D1D] to-[#131313] px-6 py-12 text-center">
            <p className="mx-auto max-w-[460px] font-sans text-[15px] leading-[26px] text-white/65">
              {estado === 'cargando'
                ? 'Cargando los vehículos…'
                : 'Estamos actualizando el stock. Escribinos y te contamos qué tenemos disponible hoy.'}
            </p>
            {estado !== 'cargando' ? (
              <div className="mt-6 flex justify-center">
                <Cta
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  icon={<WhatsAppIcon className="h-[22px] w-[22px]" />}
                >
                  Consultar stock
                </Cta>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {porMarca.map(([m, autos], i) => (
              <Seccion
                key={m}
                titulo={m}
                autos={autos}
                primera={i === 0}
                verMas={activa ? null : { href: `/autos?marca=${encodeURIComponent(m)}`, ir: () => verMarca(m) }}
              />
            ))}
            {reservados.length > 0 ? (
              <Seccion
                titulo="Reservados"
                nota="Ya tienen dueño en camino. Si te interesa uno parecido, consultanos."
                autos={reservados}
                primera={porMarca.length === 0}
              />
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function ListadoAutos() {
  return (
    <CatalogoProvider>
      <Listado />
    </CatalogoProvider>
  )
}
