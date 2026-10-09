import { useId, useState } from 'react'
import { useAncho } from './hooks'
import { techo, trazoSuave } from './trazo'

const ALTO = 250
const M = { t: 14, r: 14, b: 30, l: 34 }

/* Consultas por semana. Se dibuja en píxeles reales (mide su contenedor) para
   que los textos no se deformen, y el tooltip sigue al puntero. */
export default function LineChart({ puntos }) {
  const [caja, ancho] = useAncho()
  const [activo, setActivo] = useState(null)
  const idDegrade = useId()

  const n = puntos.length
  const max = techo(Math.max(...puntos.map((p) => p.valor)))
  const util = ancho - M.l - M.r
  const x = (i) => M.l + (i * util) / (n - 1)
  const y = (v) => M.t + (1 - v / max) * (ALTO - M.t - M.b)
  const pts = puntos.map((p, i) => [x(i), y(p.valor)])
  const linea = trazoSuave(pts)
  const base = ALTO - M.b
  const area = `${linea} L${x(n - 1)},${base} L${x(0)},${base} Z`
  const ticks = [0, max / 2, max]
  const cadaCuantas = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(util / 64))))

  const mover = (e) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    const i = Math.round(((px - M.l) / util) * (n - 1))
    setActivo(Math.min(n - 1, Math.max(0, i)))
  }

  const sel = activo === null ? null : puntos[activo]
  const izq = activo === null ? 0 : Math.min(Math.max(x(activo), 90), ancho - 90)

  return (
    <div ref={caja} className="relative" style={{ height: ALTO }}>
      {ancho > 0 && (
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          aria-label={`Consultas: ${puntos.map((p) => `${p.etiqueta} ${p.valor}`).join(', ')}`}
          onPointerMove={mover}
          onPointerLeave={() => setActivo(null)}
          className="touch-pan-y"
        >
          <defs>
            <linearGradient id={idDegrade} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E0323F" stopOpacity="0.16" />
              <stop offset="1" stopColor="#E0323F" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.l}
                x2={ancho - M.r}
                y1={y(t)}
                y2={y(t)}
                stroke="white"
                strokeOpacity={t === 0 ? 0.1 : 0.05}
              />
              <text
                x={M.l - 10}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-white/60 font-saira text-[11px]"
              >
                {Math.round(t)}
              </text>
            </g>
          ))}

          <path d={area} fill={`url(#${idDegrade})`} className="p-aparece" />
          <path
            d={linea}
            pathLength="1"
            className="p-trazar"
            fill="none"
            stroke="#E0323F"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {puntos.map((p, i) =>
            i % cadaCuantas === 0 || i === n - 1 ? (
              <text
                key={p.etiqueta + i}
                x={x(i)}
                y={ALTO - 8}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className="fill-white/60 text-[11px]"
              >
                {p.etiqueta}
              </text>
            ) : null,
          )}

          {activo !== null && (
            <g>
              <line x1={x(activo)} x2={x(activo)} y1={M.t} y2={base} stroke="white" strokeOpacity="0.14" />
              <circle cx={x(activo)} cy={y(sel.valor)} r="4.5" fill="#0B0B0C" stroke="#E0323F" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}

      {sel && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#151516] px-3 py-2 text-center"
          style={{ left: izq }}
        >
          <p className="whitespace-nowrap text-[11px] text-white/60">{sel.titulo}</p>
          <p className="font-saira text-lg font-semibold leading-tight">{sel.valor}</p>
        </div>
      )}
    </div>
  )
}
