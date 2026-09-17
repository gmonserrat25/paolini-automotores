import { useRef, useState } from 'react'
import { VEHICLES, WHATSAPP_URL } from '../data/vehicles'
import { ChevronLeftIcon, ChevronRightIcon, SeatsIcon } from './Icons'
import { Cta } from './Ui'

/* El carrusel en abanico de la referencia: la foto del medio grande y las de
   los costados atrás, más chicas y apagadas. La posición de cada una se
   calcula con la distancia al índice activo, dando la vuelta por el camino
   más corto para que el salto entre la última y la primera no cruce todo el
   abanico. */
function offsetFor(index, active, total) {
  const raw = index - active
  const half = Math.floor(total / 2)
  if (raw > half) return raw - total
  if (raw < -half) return raw + total
  return raw
}

export default function Companion() {
  const [active, setActive] = useState(0)
  const total = VEHICLES.length
  const arrastre = useRef(null)

  const move = (dir) => setActive((i) => (i + dir + total) % total)

  /* En el celular lo natural es deslizar el dedo sobre las fotos. Sin esto,
     ese gesto se lo comía la página: la pantalla se corría de costado y
     asomaba una franja negra. Ahora el deslizamiento cambia de auto, y el
     `touch-action: pan-y` del contenedor deja pasar sólo el scroll vertical. */
  const onPointerDown = (e) => {
    arrastre.current = { x: e.clientX, y: e.clientY, deslizo: false }
  }

  const onPointerUp = (e) => {
    const inicio = arrastre.current
    if (!inicio) return

    const dx = e.clientX - inicio.x
    const dy = e.clientY - inicio.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      inicio.deslizo = true
      move(dx < 0 ? 1 : -1)
    }
  }

  /* Cada foto es un botón que trae su auto al frente. Si el dedo terminó el
     deslizamiento encima de una, el click llegaría igual y la elegiría a ella,
     pisando el movimiento del carrusel. */
  const onCardClick = (i) => {
    if (arrastre.current?.deslizo) {
      arrastre.current = null
      return
    }
    setActive(i)
  }

  return (
    <section className="overflow-hidden bg-[#050505] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 text-center sm:px-8 lg:px-[60px]">
        <h2 className="mx-auto max-w-[940px] font-display text-[26px] font-semibold uppercase leading-[1.14] tracking-[-0.01em] text-white sm:text-[34px] lg:text-[40px]">
          Tu próximo auto ya está en el salón
          <br className="hidden sm:block" /> acá empieza tu camino
        </h2>

        <div className="mt-7 flex justify-center">
          <Cta href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Pedí tu turno
          </Cta>
        </div>

        {/* Abanico */}
        <div
          className="relative mt-12 h-[230px] touch-pan-y select-none sm:h-[280px] lg:h-[320px]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {VEHICLES.map((vehicle, i) => {
            const offset = offsetFor(i, active, total)
            const distance = Math.abs(offset)
            if (distance > 2) return null

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onCardClick(i)}
                aria-current={offset === 0}
                className="pa-fan absolute left-1/2 top-1/2 h-[190px] w-[300px] overflow-hidden rounded-[14px] sm:h-[235px] sm:w-[380px] lg:h-[270px] lg:w-[440px]"
                style={{
                  transform: `translate(-50%, -50%) translateX(${offset * 62}%) scale(${1 - distance * 0.16})`,
                  opacity: distance === 0 ? 1 : 0.5 - distance * 0.16,
                  zIndex: 10 - distance,
                  filter: distance === 0 ? 'none' : 'brightness(0.55)',
                }}
              >
                <img
                  src={vehicle.image}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {offset === 0 ? (
                  <>
                    <span className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1 font-sans text-[12px] text-white backdrop-blur-sm">
                      {vehicle.brand} {vehicle.model}
                    </span>
                    <span className="absolute bottom-4 right-4 flex items-center gap-1.5 font-sans text-[12px] text-white drop-shadow">
                      5
                      <SeatsIcon className="h-4 w-4" />
                    </span>
                  </>
                ) : null}
                <span className="sr-only">
                  Ver {vehicle.brand} {vehicle.model}
                </span>
              </button>
            )
          })}
        </div>

        {/* Controles */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => move(-1)}
            className="text-white/50 transition-colors hover:text-white"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">Vehículo anterior</span>
          </button>

          <div className="flex items-center gap-2">
            {VEHICLES.map((vehicle, i) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => setActive(i)}
                className={`h-[7px] rounded-full transition-all ${
                  i === active ? 'w-[7px] bg-[#E0323F]' : 'w-[7px] bg-white/25 hover:bg-white/50'
                }`}
              >
                <span className="sr-only">
                  Ir a {vehicle.brand} {vehicle.model}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => move(1)}
            className="text-white/50 transition-colors hover:text-white"
          >
            <ChevronRightIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">Vehículo siguiente</span>
          </button>
        </div>
      </div>
    </section>
  )
}
