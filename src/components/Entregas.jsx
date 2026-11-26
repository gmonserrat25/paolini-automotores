import { useCallback, useEffect, useRef, useState } from 'react'
import { frase } from '../lib/entregas'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

/* Las entregas: cada vez que se vende un auto, la foto con quien se lo llevó.
   Las carga el dueño desde el panel (#entregas) y se leen de GET /api/entregas.
   Sin entregas cargadas la sección no se dibuja: una vidriera vacía es peor que
   ninguna. Con cinco o más, la última va grande y las demás la rodean.
   Al tocar una foto se abre grande; con más de una se pasa con las flechas
   (en pantalla o del teclado) o deslizando el dedo. */

function Tarjeta({ entrega, grande, onAbrir }) {
  return (
    <figure className={`flex flex-col ${grande ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ver grande la foto de ${entrega.cliente}`}
        className={`relative block w-full cursor-zoom-in overflow-hidden rounded-[6px] bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          grande ? 'aspect-[4/5] lg:aspect-auto lg:flex-1' : 'aspect-[4/5]'
        }`}
      >
        <img
          src={entrega.foto}
          alt={`${entrega.cliente} con su ${entrega.vehiculo}, recién entregado`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </button>
      <figcaption className="mt-3">
        <p
          className={`font-sans leading-[1.45] text-white/85 ${
            grande ? 'text-[18px] lg:text-[22px]' : 'text-[16px] lg:text-[17px]'
          }`}
        >
          {frase(entrega)}
        </p>
      </figcaption>
    </figure>
  )
}

const flecha =
  'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white'

function Visor({ entregas, inicial, onCerrar }) {
  const [i, setI] = useState(inicial)
  const toque = useRef(null)
  const cerrar = useRef(null)
  const total = entregas.length
  const varias = total > 1
  const ir = (paso) => setI((n) => (n + paso + total) % total)
  const e = entregas[i]

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

  /* Deslizar: si el dedo se movió más de 50 px de costado (y más de costado
     que para arriba), pasa a la siguiente o a la anterior. */
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
      aria-label="Entregas"
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

      <figure onClick={(ev) => ev.stopPropagation()} className="relative flex max-h-full w-full max-w-[880px] flex-col items-center">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <img
            key={e.id}
            src={e.foto}
            alt={`${e.cliente} con su ${e.vehiculo}, recién entregado`}
            className="max-h-[calc(100svh-190px)] w-auto max-w-full rounded-[6px] object-contain"
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
        <figcaption className="mt-5 text-center">
          <p className="font-sans text-[18px] leading-[1.45] text-white sm:text-[22px]">{frase(e)}</p>
          {varias && (
            <p className="mt-2 font-sans text-[13px] tabular-nums text-white/50">
              {i + 1} de {total}
            </p>
          )}
        </figcaption>
      </figure>
    </div>
  )
}

export default function Entregas() {
  const [entregas, setEntregas] = useState([])
  const [abierta, setAbierta] = useState(null)
  const cerrarVisor = useCallback(() => setAbierta(null), [])

  useEffect(() => {
    const control = new AbortController()
    fetch('/api/entregas', { signal: control.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEntregas)
      .catch(() => {})
    return () => control.abort()
  }, [])

  if (!entregas.length) return null
  const destacada = entregas.length >= 5

  return (
    <section id="entregas" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <h2 className="max-w-[760px] font-display text-[26px] font-semibold uppercase leading-[1.14] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
          Ya se fueron con su auto
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-y-10">
          {entregas.map((e, i) => (
            <Tarjeta key={e.id} entrega={e} grande={destacada && i === 0} onAbrir={() => setAbierta(i)} />
          ))}
        </div>
      </div>
      {abierta !== null && <Visor entregas={entregas} inicial={abierta} onCerrar={cerrarVisor} />}
    </section>
  )
}
