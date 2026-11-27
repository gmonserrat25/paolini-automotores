import { useCallback, useEffect, useRef, useState } from 'react'
import { frase, gracias, mensajeDe, seFue } from '../lib/entregas'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

/* Las entregas: cada vez que se vende un auto, la foto con quien se lo llevó.
   Las carga el dueño desde el panel (#entregas) y se leen de GET /api/entregas.
   Sin entregas cargadas la sección no se dibuja: una vidriera vacía es peor que
   ninguna. Van en una fila que rota sola (una foto entera por vez en el celular,
   cuatro en la compu). Al tocar una foto se abre grande; con más de una se pasa con las flechas
   (en pantalla o del teclado) o deslizando el dedo. */

function Tarjeta({ entrega, onAbrir }) {
  return (
    <figure className="flex flex-col">
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ver grande: ${frase(entrega)}`}
        className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[6px] bg-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <img
          src={entrega.foto}
          alt={frase(entrega)}
          loading="lazy"
          draggable="false"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </button>
      <figcaption className="mt-4">
        <p className="font-display text-[21px] font-semibold leading-[1.1] tracking-[-0.01em] text-white lg:text-[26px]">
          {gracias(entrega)}
        </p>
        <p className="mt-1.5 font-sans text-[15px] leading-[1.4] text-white/70 lg:text-[16px]">{seFue(entrega)}</p>
        {mensajeDe(entrega) && (
          <p className="mt-1 font-sans text-[15px] leading-[1.4] text-white lg:text-[16px]">{mensajeDe(entrega)}</p>
        )}
      </figcaption>
    </figure>
  )
}

/* Pasa sola a la siguiente cada PAUSA ms y al llegar al final vuelve al
   principio. Se frena mientras la tocan, le pasan el mouse o tiene el foco,
   cuando no está a la vista y con "reducir movimiento" del sistema. Deslizar
   con el dedo funciona siempre (es un scroll horizontal con imán). */
const PAUSA = 3500

function Carrusel({ entregas, onAbrir }) {
  const pista = useRef(null)
  const [actual, setActual] = useState(0)
  const [quieta, setQuieta] = useState(false)
  const [visible, setVisible] = useState(false)
  const [ultima, setUltima] = useState(entregas.length - 1)
  const soltada = useRef(null)

  const posiciones = useCallback(() => {
    const el = pista.current
    if (!el) return []
    const max = el.scrollWidth - el.clientWidth
    return [...el.children].map((c) => Math.min(c.offsetLeft - el.firstElementChild.offsetLeft, max))
  }, [])

  const ir = useCallback(
    (n) => {
      const el = pista.current
      const pos = posiciones()
      if (!el || !pos.length) return
      el.scrollTo({ left: pos[n] ?? 0, behavior: 'smooth' })
    },
    [posiciones],
  )

  /* Qué foto está adelante (la más cercana al borde izquierdo). Cuando ya no
     se puede correr más, cuenta como la última. */
  function alMover() {
    const el = pista.current
    const pos = posiciones()
    if (!el || !pos.length) return
    const x = el.scrollLeft
    let n = 0
    pos.forEach((p, i) => {
      if (Math.abs(p - x) < Math.abs(pos[n] - x)) n = i
    })
    const fin = pos.findIndex((p) => p === pos[pos.length - 1])
    if (x >= el.scrollWidth - el.clientWidth - 2) n = fin
    setActual(n)
    setUltima(fin)
  }

  /* En la compu entran cuatro: la última posición es antes del final. */
  useEffect(() => {
    alMover()
    window.addEventListener('resize', alMover)
    return () => window.removeEventListener('resize', alMover)
  })

  useEffect(() => {
    const el = pista.current
    if (!el || !('IntersectionObserver' in window)) return setVisible(true)
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (quieta || !visible || entregas.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => ir(actual >= ultima ? 0 : actual + 1), PAUSA)
    return () => clearTimeout(t)
  }, [actual, ultima, quieta, visible, entregas.length, ir])

  /* Después de tocarla espera un poco antes de volver a andar sola. */
  function frenar() {
    clearTimeout(soltada.current)
    setQuieta(true)
  }
  function seguir() {
    clearTimeout(soltada.current)
    soltada.current = setTimeout(() => setQuieta(false), PAUSA)
  }
  useEffect(() => () => clearTimeout(soltada.current), [])

  const puntos = Math.max(1, ultima + 1)

  return (
    <div
      onPointerEnter={(e) => e.pointerType === 'mouse' && frenar()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && seguir()}
      onTouchStart={frenar}
      onTouchEnd={seguir}
      onFocus={frenar}
      onBlur={seguir}
    >
      <div
        ref={pista}
        onScroll={alMover}
        aria-roledescription="carrusel"
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto [scrollbar-width:none] sm:-mx-8 sm:gap-4 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {entregas.map((e, i) => (
          <div
            key={e.id}
            className="w-full shrink-0 snap-start sm:w-[calc((100%-1rem)/2.3)] lg:w-[calc((100%-3rem)/4)]"
          >
            <Tarjeta entrega={e} onAbrir={() => onAbrir(i)} />
          </div>
        ))}
      </div>

      {puntos > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          {Array.from({ length: puntos }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ir a la entrega ${i + 1}`}
              aria-current={i === Math.min(actual, puntos - 1) ? 'true' : undefined}
              className="flex h-8 w-6 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <span
                className={`block h-[3px] rounded-full transition-all duration-300 ${
                  i === Math.min(actual, puntos - 1) ? 'w-5 bg-[#D52B38]' : 'w-2 bg-white/30'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
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
            alt={frase(e)}
            className="max-h-[calc(100svh-230px)] w-auto max-w-full rounded-[6px] object-contain"
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
          <p className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] text-white sm:text-[36px]">{gracias(e)}</p>
          <p className="mt-1.5 font-sans text-[16px] leading-[1.4] text-white/70 sm:text-[19px]">{seFue(e)}</p>
          {mensajeDe(e) && <p className="mx-auto mt-1 max-w-[640px] font-sans text-[16px] leading-[1.4] text-white sm:text-[19px]">{mensajeDe(e)}</p>}
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

  return (
    <section id="entregas" className="bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[60px]">
        <h2 className="max-w-[760px] font-display text-[26px] font-semibold uppercase leading-[1.14] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
          Ya se fueron con su auto
        </h2>

        <div className="mt-10">
          <Carrusel entregas={entregas} onAbrir={setAbierta} />
        </div>
      </div>
      {abierta !== null && <Visor entregas={entregas} inicial={abierta} onCerrar={cerrarVisor} />}
    </section>
  )
}
