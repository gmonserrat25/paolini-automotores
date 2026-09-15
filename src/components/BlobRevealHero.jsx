import { useEffect, useId, useRef } from 'react'
import { asset } from '../lib/asset'
import './BlobRevealHero.css'

/* Hero de revelado con cursor-blob.

   Dos fotos del mismo Peugeot 208 GT, recortadas del post de Instagram
   (assets-src/instagram/post00.jpg):
     - BASE   : plano 3/4 del frente en el salón. Va oscurecido y casi sin
                color, para que el hero siga leyendo negro como el resto del
                sitio.
     - REVEAL : detalle de óptica y parrilla, a todo color. Solo se ve por
                dentro del blob, así que moverse con el mouse "enciende" el
                auto sobre el fondo apagado.

   La UI del hero (navbar, wordmark, llamados a la acción) entra por children:
   este componente sólo pone el fondo y el revelado. Cualquier elemento con
   data-pa-ink se invierte cuando el blob le pasa por debajo, y cualquiera con
   data-depth acompaña el parallax.

   El blob es una máscara SVG: un grupo de círculos pasado por un filtro
   gooey (blur + umbral en el canal alfa), de modo que el núcleo y la estela
   se funden entre sí como una gota de mercurio. */

const BASE_IMAGE = asset('/ig/hero-208gt-wide.jpg')
const REVEAL_IMAGE = asset('/ig/hero-208gt-detalle.jpg')
// A 2.7:1 crop in a phone-shaped hero leaves the car as a thin band, so narrow
// screens get a portrait framing of the same car instead.
const NARROW_IMAGE = asset('/ig/hero-208gt-tall.jpg')

// Radio del núcleo del blob, en px. El resto de las medidas se derivan de él.
const CORE_R = 96
// Satélites que orbitan el núcleo: son los que le dan el borde orgánico.
const SATELLITES = 5
// Círculos reservados para la estela.
const TRAIL_MAX = 14
// Vida de cada gota de la estela, en ms.
const TRAIL_LIFE = 480
// Cantidad de líneas de onda del fondo.
const WAVES = 6


export default function BlobRevealHero({
  baseImage = BASE_IMAGE,
  revealImage = REVEAL_IMAGE,
  narrowImage = NARROW_IMAGE,
  baseAlt = 'Peugeot 208 GT en el salón de Automotores Paolini',
  className = '',
  children,
}) {
  const rootRef = useRef(null)
  const baseRef = useRef(null)
  const revealRef = useRef(null)
  const wavesRef = useRef(null)
  const coreRefs = useRef([])
  const trailRefs = useRef([])

  // Los ids del filtro y de la máscara tienen que ser únicos por instancia,
  // pero sin los signos que mete useId: rompen el url(#…) del atributo.
  const uid = `pa-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const gooId = `${uid}-goo`
  const maskId = `${uid}-mask`

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const revealSrc = revealImage
    const narrowSrc = narrowImage

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(hover: none)').matches

    let w = root.clientWidth
    let h = root.clientHeight

    // Posición objetivo (mouse) y posición real del blob, que la persigue con
    // retraso para que el movimiento se sienta fluido.
    let targetX = w * 0.5
    let targetY = h * 0.5
    let blobX = targetX
    let blobY = targetY
    let speed = 0
    let presence = 0 // 0 = blob escondido, 1 = visible
    let pointerIn = coarse // en touch arranca solo

    const trail = []
    let raf = 0
    let last = performance.now()

    // Rects de los elementos que se invierten, relativos al hero. Se cachean
    // para no forzar layout en cada frame.
    let inkTargets = []
    let parallaxEls = []
    const measure = () => {
      w = root.clientWidth
      h = root.clientHeight
      const base = root.getBoundingClientRect()
      inkTargets = Array.from(root.querySelectorAll('[data-pa-ink]')).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          el,
          left: r.left - base.left,
          top: r.top - base.top,
          right: r.right - base.left,
          bottom: r.bottom - base.top,
          on: false,
        }
      })
      parallaxEls = Array.from(root.querySelectorAll('[data-depth]'))
    }

    // Las dos capas tienen que encuadrar igual, y en pantallas angostas ambas
    // cambian a la foto vertical.
    const narrow = window.matchMedia('(max-width: 640px)')
    const syncFit = () => {
      const img = revealRef.current
      if (!img) return
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice')
      img.setAttribute('href', narrow.matches ? narrowSrc : revealSrc)
    }
    syncFit()
    narrow.addEventListener('change', syncFit)

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    window.addEventListener('scroll', measure, { passive: true })
    // Las fuentes llegan por la red: hasta que no cargaron, el texto ocupa otro
    // ancho y los rects cacheados apuntan al lugar equivocado.
    document.fonts?.ready.then(measure)

    const onMove = (e) => {
      const r = root.getBoundingClientRect()
      targetX = e.clientX - r.left
      targetY = e.clientY - r.top
      pointerIn = true
    }
    const onLeave = () => {
      pointerIn = false
    }

    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerenter', onMove, { passive: true })
    root.addEventListener('pointerleave', onLeave, { passive: true })

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      // dt normalizado a 60fps, para que la física no dependa del refresco.
      const dt = Math.min(Math.max((t - last) / 16.667, 0.25), 3)
      last = t

      // En pantallas táctiles el blob se pasea solo, en una lissajous lenta.
      if (coarse) {
        targetX = w * (0.5 + 0.3 * Math.sin(t * 0.00042))
        targetY = h * (0.5 + 0.24 * Math.sin(t * 0.00068 + 1.1))
      }

      presence += ((pointerIn ? 1 : 0) - presence) * (1 - Math.pow(1 - 0.09, dt))

      const prevX = blobX
      const prevY = blobY
      // Retraso del seguimiento: cuanto más chico el factor, más "pesado".
      const ease = reduced ? 1 : 1 - Math.pow(1 - 0.15, dt)
      blobX += (targetX - blobX) * ease
      blobY += (targetY - blobY) * ease

      const step = Math.hypot(blobX - prevX, blobY - prevY) / dt
      speed += (step - speed) * 0.2

      // Cuanto más rápido va el cursor, más se estira y deforma el núcleo.
      const stretch = reduced ? 0 : Math.min(speed / 42, 1)
      const dirX = speed > 0.01 ? (blobX - prevX) / (speed * dt || 1) : 0
      const dirY = speed > 0.01 ? (blobY - prevY) / (speed * dt || 1) : 0

      const coreR = CORE_R * presence
      const core = coreRefs.current
      if (core[0]) {
        core[0].setAttribute('cx', blobX.toFixed(1))
        core[0].setAttribute('cy', blobY.toFixed(1))
        core[0].setAttribute('r', Math.max(0, coreR * (1 + stretch * 0.08)).toFixed(1))
      }
      for (let i = 1; i <= SATELLITES; i++) {
        const el = core[i]
        if (!el) continue
        const k = i - 1
        const spin = reduced ? 0 : t * 0.00055 * (k % 2 ? -1 : 1)
        const angle = (k / SATELLITES) * Math.PI * 2 + spin
        const wobble = reduced ? 0 : Math.sin(t * 0.0013 + k * 1.7) * 0.14
        // Los satélites sobresalen del núcleo (0.62 + 0.50 > 1): sin eso el
        // blob en reposo sería un círculo perfecto en lugar de una gota.
        const dist = coreR * (0.62 + wobble + stretch * 0.34)
        // Los satélites quedan un poco atrás del núcleo: eso alarga el blob
        // en la dirección del movimiento.
        const lag = stretch * coreR * 0.5
        el.setAttribute('cx', (blobX + Math.cos(angle) * dist - dirX * lag).toFixed(1))
        el.setAttribute('cy', (blobY + Math.sin(angle) * dist - dirY * lag).toFixed(1))
        el.setAttribute('r', Math.max(0, coreR * (0.5 + wobble * 0.5)).toFixed(1))
      }

      // Estela: una gota nueva por frame mientras el cursor se mueve. El radio
      // sale de la velocidad, así que correr deja un rastro más marcado.
      if (!reduced && presence > 0.2 && speed > 1.1) {
        trail.push({
          x: prevX,
          y: prevY,
          r: CORE_R * (0.26 + Math.min(speed / 50, 1) * 0.4),
          born: t,
        })
        if (trail.length > TRAIL_MAX) trail.shift()
      }
      while (trail.length && t - trail[0].born > TRAIL_LIFE) trail.shift()

      for (let i = 0; i < TRAIL_MAX; i++) {
        const el = trailRefs.current[i]
        if (!el) continue
        const drop = trail[trail.length - 1 - i]
        if (!drop) {
          el.setAttribute('r', '0')
          continue
        }
        const age = (t - drop.born) / TRAIL_LIFE
        // Se apaga encogiendo, no bajando el alfa: el umbral del filtro gooey
        // haría desaparecer de golpe cualquier círculo semitransparente.
        const r = drop.r * Math.pow(Math.max(0, 1 - age), 0.75) * presence
        el.setAttribute('cx', drop.x.toFixed(1))
        el.setAttribute('cy', drop.y.toFixed(1))
        el.setAttribute('r', Math.max(0, r).toFixed(1))
      }

      // Parallax: el fondo acompaña al cursor y la tipografía va al revés.
      const nx = w ? (blobX / w - 0.5) * 2 : 0
      const ny = h ? (blobY / h - 0.5) * 2 : 0
      if (baseRef.current) {
        baseRef.current.style.transform = `scale(1.06) translate3d(${(nx * 10).toFixed(2)}px, ${(ny * 8).toFixed(2)}px, 0)`
      }
      for (const el of parallaxEls) {
        const depth = Number(el.dataset.depth || 1)
        el.style.transform = `translate3d(${(-nx * 7 * depth).toFixed(2)}px, ${(-ny * 5 * depth).toFixed(2)}px, 0)`
      }

      // Ondas del fondo, con una deriva suave según dónde está el cursor.
      if (wavesRef.current && !reduced) {
        const paths = wavesRef.current.children
        for (let i = 0; i < paths.length; i++) {
          const baseY = h * (0.16 + i * 0.135)
          const amp = 12 + i * 4.5
          const drift = ny * 14 * (1 + i * 0.22)
          let d = ''
          const steps = 26
          for (let s = 0; s <= steps; s++) {
            const x = (w * s) / steps
            const y =
              baseY +
              drift +
              Math.sin(x * 0.0052 + t * 0.00055 + i * 0.8 + nx * 0.9) * amp +
              Math.sin(x * 0.0128 - t * 0.00031 + i) * amp * 0.35
            d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
          }
          paths[i].setAttribute('d', d)
        }
      }

      // Inversión de la tipografía: blanco donde el blob la tapa.
      const reach = coreR * 0.98
      for (const tgt of inkTargets) {
        const dx = Math.max(tgt.left - blobX, 0, blobX - tgt.right)
        const dy = Math.max(tgt.top - blobY, 0, blobY - tgt.bottom)
        const on = Math.hypot(dx, dy) < reach
        if (on !== tgt.on) {
          tgt.on = on
          tgt.el.classList.toggle('is-inverted', on)
        }
      }
    }

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      narrow.removeEventListener('change', syncFit)
      ro.disconnect()
      window.removeEventListener('scroll', measure)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerenter', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [revealImage, narrowImage])

  return (
    <section className={`pa-hero ${className}`.trim()} ref={rootRef}>
      <picture>
        <source media="(max-width: 640px)" srcSet={narrowImage} />
        <img
          ref={baseRef}
          className="pa-layer pa-base"
          src={baseImage}
          alt={baseAlt}
          draggable="false"
        />
      </picture>
      <div className="pa-layer pa-wash" />

      <svg className="pa-layer pa-svg" aria-hidden="true">
        <defs>
          {/* Gooey: desenfoque + umbral duro sobre el alfa. Los círculos que se
              tocan se funden en una sola forma orgánica. */}
          <filter
            id={gooId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blurred" />
            <feColorMatrix
              in="blurred"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
            />
          </filter>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <g filter={`url(#${gooId})`} fill="#fff">
              {Array.from({ length: SATELLITES + 1 }, (_, i) => (
                <circle
                  key={`core-${i}`}
                  ref={(el) => {
                    coreRefs.current[i] = el
                  }}
                  r="0"
                />
              ))}
              {Array.from({ length: TRAIL_MAX }, (_, i) => (
                <circle
                  key={`trail-${i}`}
                  ref={(el) => {
                    trailRefs.current[i] = el
                  }}
                  r="0"
                />
              ))}
            </g>
          </mask>
        </defs>

        <g className="pa-waves" ref={wavesRef}>
          {Array.from({ length: WAVES }, (_, i) => (
            <path key={`wave-${i}`} d="" />
          ))}
        </g>

        <image
          ref={revealRef}
          className="pa-reveal"
          href={revealImage}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          mask={`url(#${maskId})`}
        />
      </svg>

      <div className="pa-ui">{children}</div>
    </section>
  )
}
