import { useCountUp } from './hooks'

/* Un número que cuenta hasta su valor. */
export default function Numero({ valor, className = '' }) {
  const n = useCountUp(valor)
  return <span className={`tabular-nums ${className}`}>{n}</span>
}
