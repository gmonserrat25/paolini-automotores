import { useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { MARGEN, esVieja, pesos, pesosCorto } from './calculos'
import { IconoBuscar } from './icons'
import MenuEstado from './MenuEstado'
import { DIAS_ALERTA, ESTADOS, ESTADO_LABEL } from './mock'

/* Cada estado se distingue por el punto, no por un color más: disponible es
   blanco, reservado lleva el rojo (pide atención) y vendido queda apagado. */
const PUNTO = {
  disponible: 'bg-white',
  reservado: 'bg-[#E0323F]',
  vendido: 'bg-white/30',
}

const OPCIONES = ESTADOS.map((e) => ({ id: e, label: ESTADO_LABEL[e], punto: PUNTO[e] }))

function EstadoMenu({ unidad, onCambiar }) {
  return (
    <MenuEstado
      valor={unidad.estado}
      opciones={OPCIONES}
      onCambiar={(e) => onCambiar(unidad.id, e)}
      etiquetaAria={`Estado de ${unidad.brand} ${unidad.model}`}
      className="w-full md:w-[142px]"
      apagado={unidad.estado === 'vendido'}
    />
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

const COLUMNAS = 'md:grid-cols-[64px_1.4fr_1fr_1fr_1.2fr_142px]'

/* Cuánto lleva la unidad en el salón. Pasados los 60 días el número se pinta
   en rojo y lo dice con texto, no sólo con el color. */
function Dias({ unidad }) {
  if (unidad.estado === 'vendido') {
    return <p className="text-sm text-white/60">Vendida en {unidad.diasEnStock} días</p>
  }
  const vieja = esVieja(unidad)
  return (
    <p className={`text-sm tabular-nums ${vieja ? 'text-[#FF6B76]' : ''}`}>
      {unidad.diasEnStock} días
      {vieja && <span className="block text-xs">Pasó los {DIAS_ALERTA}</span>}
    </p>
  )
}

const sinTildes = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function TablaStock({ stock, busqueda, marca, onMarca, soloViejas, onSoloViejas, onCambiar, onLimpiarBusqueda }) {
  const [estado, setEstado] = useState(null)
  const marcas = [...new Set(stock.map((v) => v.brand))]

  const q = sinTildes(busqueda.trim())
  const visibles = stock.filter(
    (v) =>
      (!marca || v.brand === marca) &&
      (!estado || v.estado === estado) &&
      (!soloViejas || esVieja(v)) &&
      (!q || sinTildes(`${v.brand} ${v.model} ${v.type} ${v.tag}`).includes(q)),
  )
  const hayFiltros = Boolean(marca || estado || soloViejas || q)

  const limpiar = () => {
    onMarca(null)
    setEstado(null)
    onSoloViejas(false)
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
        <div className="flex items-center gap-2" role="group" aria-label="Filtrar por antigüedad">
          <span className="w-14 shrink-0 text-xs text-white/60">Días</span>
          <Chip activo={!soloViejas} onClick={() => onSoloViejas(false)}>Todas</Chip>
          <Chip activo={soloViejas} onClick={() => onSoloViejas(!soloViejas)}>Más de {DIAS_ALERTA} días</Chip>
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
          <div className={`${COLUMNAS} hidden gap-4 border-b border-white/[0.08] px-3 pb-2.5 text-xs text-white/60 md:grid`}>
            <span>Foto</span>
            <span>Modelo</span>
            <span>Etiqueta</span>
            <span>Días en stock</span>
            <span>Precio y margen</span>
            <span>Estado</span>
          </div>
          <ul>
            {visibles.map((v) => (
              <li
                key={v.id}
                className={`${COLUMNAS} grid grid-cols-[56px_1fr] items-center gap-x-4 gap-y-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/[0.03]`}
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
                  <p className="text-xs text-white/60">
                    {v.type}
                    <span className="md:hidden"> · {v.tag}</span>
                  </p>
                </div>
                <p className="hidden md:block">
                  <span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-xs text-white/80">
                    {v.tag}
                  </span>
                </p>
                <div className="col-span-2 flex items-baseline justify-between gap-4 md:contents">
                  <Dias unidad={v} />
                  <div className="text-right md:text-left">
                    <p className="text-sm tabular-nums">{pesos(v.precioVenta)}</p>
                    <p className="text-xs tabular-nums text-white/60">Margen {pesosCorto(MARGEN(v))}</p>
                  </div>
                </div>
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
