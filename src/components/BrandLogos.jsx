import { trazoDe } from '../data/brand-logos'

/* El emblema de una marca. Los trazos viven en data/ y no acá para que este
   archivo exporte sólo el componente.

   Las marcas que no tienen trazo (hoy, BYD) igual necesitan ocupar el mismo
   lugar que las demás en la tira: si no, la fila se desalinea y esa marca
   queda con un tamaño distinto al resto. Para esas va un óvalo con las
   iniciales, que es más o menos la forma de ese logo. */
export default function BrandLogo({ marca, className = '' }) {
  const d = trazoDe(marca)

  if (!d) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <ellipse
          cx="12"
          cy="12"
          rx="11"
          ry="7.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize="7.4"
          fontWeight="700"
          fontFamily="Poppins, sans-serif"
        >
          {marca.slice(0, 3).toUpperCase()}
        </text>
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
