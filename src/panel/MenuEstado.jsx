import { useEffect, useRef, useState } from 'react'
import { IconoCheck, IconoFlecha } from './icons'

/* El menú desplegable de estado que usan la tabla de stock y la lista de
   consultas. Cada estado se distingue por el punto, no por un color más:
   `punto` es la clase de fondo de ese estado. */
export default function MenuEstado({ valor, opciones, onCambiar, etiquetaAria, className = '', apagado = false }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)
  const actual = opciones.find((o) => o.id === valor)

  useEffect(() => {
    if (!abierto) return undefined
    const fuera = (e) => !caja.current?.contains(e.target) && setAbierto(false)
    const esc = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', esc)
    }
  }, [abierto])

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={`${etiquetaAria}: ${actual.label}. Cambiar`}
        onClick={() => setAbierto((a) => !a)}
        className={`flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 text-[13px] transition-colors hover:border-white/20 hover:bg-white/[0.03] ${className}`}
      >
        <span className={`h-2 w-2 rounded-full ${actual.punto}`} />
        <span className={`flex-1 text-left ${apagado ? 'text-white/60' : ''}`}>{actual.label}</span>
        <IconoFlecha className="h-4 w-4 text-white/60" />
      </button>

      {abierto && (
        <ul
          role="listbox"
          className="p-menu absolute right-0 z-20 mt-1.5 w-[168px] rounded-2xl border border-white/[0.08] bg-[#151516] p-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.4)]"
        >
          {opciones.map((o) => (
            <li key={o.id} role="option" aria-selected={valor === o.id}>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false)
                  if (o.id !== valor) onCambiar(o.id)
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.06]"
              >
                <span className={`h-2 w-2 rounded-full ${o.punto}`} />
                <span className="flex-1">{o.label}</span>
                {valor === o.id && <IconoCheck className="h-4 w-4 text-white/60" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
