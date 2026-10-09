import { useEffect, useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { IconoBuscar, IconoCheck, IconoFlecha } from './icons'
import { ESTADOS, ESTADO_LABEL } from './mock'

/* Cada estado se distingue por el punto, no por un color más: disponible es
   blanco, reservado lleva el rojo (pide atención) y vendido queda apagado. */
const PUNTO = {
  disponible: 'bg-white',
  reservado: 'bg-[#E0323F]',
  vendido: 'bg-white/30',
}

function EstadoMenu({ unidad, onCambiar }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

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
        aria-label={`Estado de ${unidad.brand} ${unidad.model}: ${ESTADO_LABEL[unidad.estado]}. Cambiar`}
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5 text-[13px] transition-colors hover:border-white/20 hover:bg-white/[0.03] md:w-[142px]"
      >
        <span className={`h-2 w-2 rounded-full ${PUNTO[unidad.estado]}`} />
        <span className={`flex-1 text-left ${unidad.estado === 'vendido' ? 'text-white/60' : ''}`}>
          {ESTADO_LABEL[unidad.estado]}
        </span>
        <IconoFlecha className="h-4 w-4 text-white/60" />
      </button>

      {abierto && (
        <ul
          role="listbox"
          className="p-menu absolute right-0 z-20 mt-1.5 w-[168px] rounded-2xl border border-white/[0.08] bg-[#151516] p-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.4)]"
        >
          {ESTADOS.map((e) => (
            <li key={e} role="option" aria-selected={unidad.estado === e}>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false)
                  if (e !== unidad.estado) onCambiar(unidad.id, e)
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/[0.06]"
              >
                <span className={`h-2 w-2 rounded-full ${PUNTO[e]}`} />
                <span className="flex-1">{ESTADO_LABEL[e]}</span>
                {unidad.estado === e && <IconoCheck className="h-4 w-4 text-white/60" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
        activo
          ? 'border-white/25 bg-white/10 text-white'
          : 'border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function TablaStock({ stock, busqueda, marca, onMarca, onCambiar, onLimpiarBusqueda }) {
  const [estado, setEstado] = useState(null)
  const marcas = [...new Set(stock.map((v) => v.brand))]

  const q = sinTildes(busqueda.trim())
  const visibles = stock.filter(
    (v) =>
      (!marca || v.brand === marca) &&
      (!estado || v.estado === estado) &&
      (!q || sinTildes(`${v.brand} ${v.model} ${v.type} ${v.tag}`).includes(q)),
  )
  const hayFiltros = Boolean(marca || estado || q)

  const limpiar = () => {
    onMarca(null)
    setEstado(null)
    onLimpiarBusqueda()
  }

  return (
    <section id="stock" className="p-card p-entra scroll-mt-24 p-5" style={{ '--i': 6 }}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="font-jost text-lg font-medium">Stock</h2>
        <p className="text-[13px] text-white/60" aria-live="polite">
          {visibles.length} de {stock.length} unidades
        </p>
      </header>

      <div className="-mx-5 mt-4 space-y-2.5 overflow-x-auto px-5 pb-1">
        <div className="flex items-center gap-2" role="group" aria-label="Filtrar por marca">
          <span className="w-14 shrink-0 text-xs text-white/60">Marca</span>
          <Chip activo={!marca} onClick={() => onMarca(null)}>Todas</Chip>
          {marcas.map((m) => (
            <Chip key={m} activo={marca === m} onClick={() => onMarca(marca === m ? null : m)}>
              {m}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Filtrar por estado">
          <span className="w-14 shrink-0 text-xs text-white/60">Estado</span>
          <Chip activo={!estado} onClick={() => setEstado(null)}>Todos</Chip>
          {ESTADOS.map((e) => (
            <Chip key={e} activo={estado === e} onClick={() => setEstado(estado === e ? null : e)}>
              {ESTADO_LABEL[e]}
            </Chip>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center">
          <IconoBuscar className="h-6 w-6 text-white/60" />
          <p className="mt-3 text-sm">
            {q ? `Ninguna unidad coincide con «${busqueda.trim()}»` : 'Ninguna unidad con esos filtros'}
          </p>
          <p className="mt-1 text-[13px] text-white/60">Probá con otra marca u otro estado.</p>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="mt-4 rounded-full border border-white/[0.1] px-4 py-1.5 text-[13px] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
            >
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="hidden grid-cols-[64px_1.6fr_1fr_1.2fr_142px] gap-4 border-b border-white/[0.08] px-3 pb-2.5 text-xs text-white/60 md:grid">
            <span>Foto</span>
            <span>Modelo</span>
            <span>Tipo</span>
            <span>Etiqueta</span>
            <span>Estado</span>
          </div>
          <ul>
            {visibles.map((v) => (
              <li
                key={v.id}
                className="grid grid-cols-[56px_1fr] items-center gap-x-4 gap-y-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.03] md:grid-cols-[64px_1.6fr_1fr_1.2fr_142px]"
              >
                <img
                  src={v.image}
                  alt=""
                  loading="lazy"
                  className={`h-11 w-14 rounded-lg object-cover md:h-12 md:w-16 ${v.estado === 'vendido' ? 'opacity-50' : ''}`}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs text-white/60">
                    <BrandLogo marca={v.brand} className="h-3.5 w-3.5" />
                    {v.brand}
                  </p>
                  <p className="truncate text-sm font-medium">{v.model}</p>
                  <p className="text-xs text-white/60 md:hidden">
                    {v.type} · {v.tag}
                  </p>
                </div>
                <p className="hidden text-sm text-white/80 md:block">{v.type}</p>
                <p className="hidden md:block">
                  <span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-xs text-white/80">
                    {v.tag}
                  </span>
                </p>
                <div className="col-span-2 md:col-span-1">
                  <EstadoMenu unidad={v} onCambiar={onCambiar} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export function TablaEsqueleto() {
  return (
    <div className="p-card p-5">
      <div className="p-esqueleto h-5 w-20" />
      <div className="mt-5 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="p-esqueleto h-12 w-16" />
            <div className="p-esqueleto h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
