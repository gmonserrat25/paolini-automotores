import { useEffect, useState } from 'react'
import { frase } from '../lib/entregas'

/* Las entregas: cada vez que se vende un auto, la foto con quien se lo llevó.
   Las carga el dueño desde el panel (#entregas) y se leen de GET /api/entregas.
   Sin entregas cargadas la sección no se dibuja: una vidriera vacía es peor que
   ninguna. Con cinco o más, la última va grande y las demás la rodean. */

function Tarjeta({ entrega, grande }) {
  return (
    <figure className={`flex flex-col ${grande ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
      <div
        className={`relative overflow-hidden rounded-[6px] bg-[#111] ${
          grande ? 'aspect-[4/5] lg:aspect-auto lg:flex-1' : 'aspect-[4/5]'
        }`}
      >
        <img
          src={entrega.foto}
          alt={`${entrega.cliente} con su ${entrega.vehiculo}, recién entregado`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <figcaption className="mt-3">
        <p
          className={`font-sans leading-[1.5] text-white/80 ${
            grande ? 'text-[16px] lg:text-[19px]' : 'text-[14px]'
          }`}
        >
          {frase(entrega)}
        </p>
      </figcaption>
    </figure>
  )
}

export default function Entregas() {
  const [entregas, setEntregas] = useState([])

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
            <Tarjeta key={e.id} entrega={e} grande={destacada && i === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
