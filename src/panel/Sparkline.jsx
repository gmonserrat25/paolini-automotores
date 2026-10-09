import { trazoSuave } from './trazo'

/* Minigráfico de una tarjeta: sólo la forma, sin ejes ni números. */
export default function Sparkline({ valores, className = '' }) {
  const ancho = 96
  const alto = 36
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const rango = max - min || 1
  const pts = valores.map((v, i) => [
    2 + (i * (ancho - 4)) / (valores.length - 1),
    alto - 4 - ((v - min) / rango) * (alto - 10),
  ])
  const ultimo = pts[pts.length - 1]

  return (
    <svg
      className={className}
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho}
      height={alto}
      aria-hidden="true"
    >
      <path
        d={trazoSuave(pts)}
        pathLength="1"
        className="p-trazar"
        fill="none"
        stroke="#E0323F"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx={ultimo[0]} cy={ultimo[1]} r="2.4" fill="#E0323F" className="p-aparece" />
    </svg>
  )
}
