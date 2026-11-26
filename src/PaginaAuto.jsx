import { useCallback, useEffect, useRef, useState } from 'react'
import TopNav from './components/TopNav'
import Footer from './components/Footer'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, WhatsAppIcon } from './components/Icons'
import { Corner, Cta } from './components/Ui'
import { aVehiculoPublico } from './lib/catalogo'
import { WHATSAPP_URL } from './data/vehicles'

/* La página de un auto (/autos/<id>): la foto grande, las demás fotos
   (interior, detalles, trasera) y todos sus datos. Se llega desde la tarjeta
   del stock. Si el auto se vendió o el enlace es viejo, avisa y manda de
   vuelta al stock. Al tocar una foto se abre grande y se pasa con flechas,
   con el teclado o deslizando el dedo (como el visor de las entregas). */

const TIPOS = { exterior: 'Exterior', interior: 'Interior', detalle: 'Detalle', trasera: 'Trasera' }

const flecha =
  'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white'

function Visor({ fotos, inicial, titulo, onCerrar }) {
  const [i, setI] = useState(inicial)
  const toque = useRef(null)
  const cerrar = useRef(null)
  const total = fotos.length
  const varias = total > 1
  const ir = (paso) => setI((n) => (n + paso + total) % total)

  useEffect(() => {
    const previo = document.activeElement
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrar.current?.focus()
    function tecla(ev) {
      if (ev.key === 'Escape') onCerrar()
      else if (ev.key === 'ArrowRight' && total > 1) setI((n) => (n + 1) % total)
      else if (ev.key === 'ArrowLeft' && total > 1) setI((n) => (n - 1 + total) % total)
    }
    window.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('keydown', tecla)
      document.body.style.overflow = scroll
      previo?.focus?.()
    }
  }, [onCerrar, total])

  function soltar(ev) {
    if (!toque.current || !varias) return
    const dx = ev.changedTouches[0].clientX - toque.current.x
    const dy = ev.changedTouches[0].clientY - toque.current.y
    toque.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) ir(dx < 0 ? 1 : -1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos del ${titulo}`}
      onClick={onCerrar}
      onTouchStart={(ev) => (toque.current = { x: ev.touches[0].clientX, y: ev.touches[0].clientY })}
      onTouchEnd={soltar}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 px-4 py-14"
    >
      <button
        ref={cerrar}
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
      <figure onClick={(ev) => ev.stopPropagation()} className="relative flex max-h-full w-full max-w-[1100px] flex-col items-center">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <img
            key={fotos[i].url}
            src={fotos[i].url}
            alt={`${titulo}${fotos[i].tipo && TIPOS[fotos[i].tipo] ? ` · ${TIPOS[fotos[i].tipo]}` : ''}`}
            className="max-h-[calc(100svh-150px)] w-auto max-w-full rounded-[6px] object-contain"
          />
          {varias && (
            <>
              <button type="button" onClick={() => ir(-1)} aria-label="Foto anterior" className={`${flecha} left-1 sm:-left-16`}>
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => ir(1)} aria-label="Foto siguiente" className={`${flecha} right-1 sm:-right-16`}>
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
        {varias && (
          <figcaption className="mt-4 font-sans text-[13px] tabular-nums text-white/50">
            {i + 1} de {total}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

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
  const [abierta, setAbierta] = useState(null)
  const cerrarVisor = useCallback(() => setAbierta(null), [])

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

  /* La principal primero; después las extra en el orden en que se subieron. */
  const fotos = auto ? [{ url: auto.image, tipo: 'exterior' }, ...auto.fotos.filter((f) => f.url !== auto.image)] : []

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
            <div>
            <div className="relative overflow-hidden rounded-[10px] bg-[#131313]">
              <button
                type="button"
                onClick={() => setAbierta(0)}
                aria-label="Ver la foto grande"
                className="block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <img
                  src={auto.image}
                  alt={`${auto.brand} ${auto.model} en Automotores Paolini`}
                  className={`aspect-[4/3] w-full object-cover ${auto.reservado ? 'opacity-70' : ''}`}
                />
              </button>
              {auto.reservado ? (
                <span className="absolute left-4 top-4 rounded-full bg-[#D52B38] px-3.5 py-1.5 font-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                  Reservado
                </span>
              ) : null}
              <Corner className="h-8 w-8" />
            </div>
            {fotos.length > 1 ? (
              <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                {fotos.map((f, i) => (
                  <li key={f.url}>
                    <button
                      type="button"
                      onClick={() => setAbierta(i)}
                      aria-label={`Ver foto ${i + 1}${f.tipo && TIPOS[f.tipo] ? ` (${TIPOS[f.tipo].toLowerCase()})` : ''}`}
                      className="block w-full cursor-zoom-in overflow-hidden rounded-[6px] bg-[#131313] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <img src={f.url} alt="" loading="lazy" className="aspect-square w-full object-cover transition-opacity hover:opacity-80" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
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
                  ? 'Este vehículo ya no está disponible. Mirá el resto del stock.'
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
      {abierta !== null && auto ? (
        <Visor fotos={fotos} inicial={abierta} titulo={`${auto.brand} ${auto.model}`} onCerrar={cerrarVisor} />
      ) : null}
      <Footer />
    </div>
  )
}
