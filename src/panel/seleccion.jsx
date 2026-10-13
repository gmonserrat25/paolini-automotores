import { useCallback, useState } from 'react'
import { IconoBasura, IconoEditar } from './icons'

/* Piezas compartidas por las listas de autos (Stock y Carga): casilla para
   elegir varios, barra con lo elegido y los botones de cada fila. */

export function useSeleccion() {
  const [ids, setIds] = useState(() => new Set())
  const alternar = useCallback(
    (id) =>
      setIds((a) => {
        const n = new Set(a)
        if (n.has(id)) n.delete(id)
        else n.add(id)
        return n
      }),
    [],
  )
  const poner = useCallback((lista) => setIds(new Set(lista)), [])
  const limpiar = useCallback(() => setIds(new Set()), [])
  return { ids, alternar, poner, limpiar }
}

export function Casilla({ marcada, onChange, etiqueta, className = '' }) {
  return (
    <input
      type="checkbox"
      checked={marcada}
      onChange={onChange}
      aria-label={etiqueta}
      className={`h-4 w-4 cursor-pointer rounded accent-[#E0323F] ${className}`}
    />
  )
}

const chico =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-white/70 transition-colors hover:border-white/30 hover:bg-white/[0.05] hover:text-white'

/* Editar y eliminar de una fila. */
export function AccionesFila({ unidad, onEditar, onEliminar }) {
  const nombre = `${unidad.brand} ${unidad.model}`
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onEditar(unidad.id)} aria-label={`Editar ${nombre}`} title="Editar" className={chico}>
        <IconoEditar className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => onEliminar(unidad)}
        aria-label={`Eliminar ${nombre}`}
        title="Eliminar"
        className={`${chico} hover:border-[#E0323F]/60 hover:text-[#FF6B76]`}
      >
        <IconoBasura className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}

/* Aparece cuando hay autos elegidos. */
export function BarraSeleccion({ cantidad, onEliminar, onQuitar }) {
  if (!cantidad) return null
  return (
    <div
      role="region"
      aria-label="Autos elegidos"
      className="sticky top-2 z-20 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.12] bg-[#151516] px-4 py-3"
    >
      <p className="text-sm" aria-live="polite">
        {cantidad} {cantidad === 1 ? 'auto elegido' : 'autos elegidos'}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onQuitar}
          className="rounded-full border border-white/[0.12] px-4 py-2 text-sm transition-colors hover:border-white/30 hover:bg-white/[0.05]"
        >
          Quitar selección
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="inline-flex items-center gap-2 rounded-full bg-[#E0323F] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#EA4350]"
        >
          <IconoBasura className="h-[16px] w-[16px]" />
          Eliminar {cantidad === 1 ? 'el auto' : `los ${cantidad}`}
        </button>
      </div>
    </div>
  )
}
