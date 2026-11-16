import { useEffect, useMemo, useState } from 'react'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import { VehicleCard } from './components/Vehicles'
import { Cta } from './components/Ui'
import { WhatsAppIcon } from './components/Icons'
import { CatalogoProvider, useCatalogo } from './lib/catalogo'
import { WHATSAPP_URL } from './data/vehicles'

/* /autos: todo el stock junto. Se filtra por marca (las que hay hoy en el
   salón) y el filtro vive en la dirección (?marca=Toyota), así se puede
   mandar el enlace de una marca por WhatsApp. Los reservados van aparte,
   después de los que se pueden comprar. */

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

  const elegir = (m) => {
    setMarca(m)
    window.history.replaceState(null, '', m ? `/autos?marca=${encodeURIComponent(m)}` : '/autos')
  }

  const chip = (seleccionada) =>
    `rounded-full border px-4 py-1.5 font-sans text-[14px] transition-colors ${
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
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por marca">
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
            {disponibles.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {disponibles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            ) : null}
            {reservados.length > 0 ? (
              <div className="mt-12 lg:mt-16">
                <h2 className="font-display text-[20px] font-semibold uppercase leading-[1.1] tracking-[-0.01em] text-white sm:text-[24px]">
                  Reservados
                </h2>
                <p className="mt-2 font-sans text-[14px] text-white/55">
                  Ya tienen dueño en camino. Si te interesa uno parecido, consultanos.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                  {reservados.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </div>
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
