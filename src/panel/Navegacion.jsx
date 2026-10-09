import { useState } from 'react'
import { IconoAuto, IconoBuscar, IconoConsultas, IconoResumen, IconoSitio } from './icons'

const SECCIONES = [
  { id: 'resumen', etiqueta: 'Resumen', Icono: IconoResumen },
  { id: 'stock', etiqueta: 'Stock', Icono: IconoAuto },
  { id: 'consultas', etiqueta: 'Consultas', Icono: IconoConsultas },
]

const ITEM =
  'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors'

/* Tooltip a la derecha del ícono en escritorio; en el celular no hace falta
   (la barra de abajo ya muestra el nombre). */
function Tip({ children }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[#151516] px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
    >
      {children}
    </span>
  )
}

/* Barra lateral de íconos; en el celular pasa a barra inferior. */
export default function Navegacion() {
  const [activa, setActiva] = useState('resumen')

  return (
    <nav
      aria-label="Secciones del panel"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/[0.08] bg-[#0B0B0C]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-[72px] md:flex-col md:justify-start md:gap-2 md:border-r md:border-t-0 md:px-0 md:py-5"
    >
      <span
        aria-hidden="true"
        className="mb-4 hidden h-10 w-10 items-center justify-center rounded-xl border border-[#E0323F]/60 font-jost text-lg font-semibold text-[#E0323F] md:flex"
      >
        P
      </span>

      {SECCIONES.map(({ id, etiqueta, Icono }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={() => setActiva(id)}
          aria-current={activa === id ? 'true' : undefined}
          aria-label={etiqueta}
          className={`${ITEM} flex-col gap-0.5 md:flex-row ${
            activa === id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          <Icono />
          <span className="text-[10px] md:hidden">{etiqueta}</span>
          <Tip>{etiqueta}</Tip>
        </a>
      ))}

      <a
        href="/"
        aria-label="Ver el sitio"
        className={`${ITEM} flex-col gap-0.5 text-white/60 hover:bg-white/[0.05] hover:text-white md:mt-auto md:flex-row`}
      >
        <IconoSitio />
        <span className="text-[10px] md:hidden">Sitio</span>
        <Tip>Ver el sitio</Tip>
      </a>
    </nav>
  )
}

export function Topbar({ busqueda, onBusqueda }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-[#010101]/85 px-4 py-4 backdrop-blur md:px-6">
      <label className="relative flex-1 md:max-w-md">
        <span className="sr-only">Buscar una unidad</span>
        <IconoBuscar className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/60" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar marca, modelo o tipo"
          className="w-full rounded-full border border-white/[0.08] bg-[#0B0B0C] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/60 transition-colors hover:border-white/20 focus:border-white/30 focus:outline-none"
        />
      </label>
      <span
        aria-label="Cuenta de Paolini"
        role="img"
        className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-[#0B0B0C] font-jost text-sm font-semibold"
      >
        P
      </span>
    </header>
  )
}
