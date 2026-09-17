import { ArrowUpRightIcon } from './Icons'

/* Los tres elementos que se repiten en todas las secciones de la referencia.

   En el diseño original el botón es verde y las cuñas son amarillas; acá los
   dos son el rojo de Paolini, que es el único color que el logo tiene fuera
   del blanco y el negro. */

const SIZES = {
  sm: 'gap-2 px-3 py-[6px] text-[13px]',
  md: 'gap-2.5 px-4 py-2.5 text-[15px]',
}

const ICON_SIZES = {
  sm: 'h-[18px] w-[18px] rounded-[3px]',
  md: 'h-[22px] w-[22px] rounded-[4px]',
}

/* Botón principal: pastilla roja con la flechita diagonal metida en un
   cuadradito negro a la izquierda. */
export function Cta({ href, children, size = 'md', className = '', ...rest }) {
  return (
    <a
      href={href}
      className={`group inline-flex shrink-0 items-center rounded-[6px] bg-gradient-to-br from-[#FF4552] to-[#C4212D] font-sans font-medium text-white shadow-[0_6px_20px_rgba(224,50,63,0.28)] transition-transform hover:-translate-y-0.5 ${SIZES[size]} ${className}`.trim()}
      {...rest}
    >
      <span
        className={`flex items-center justify-center bg-[#0A0A0A] ${ICON_SIZES[size]}`}
      >
        <ArrowUpRightIcon className="h-[11px] w-[11px] text-white transition-transform group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
      </span>
      {children}
    </a>
  )
}

/* La cuña diagonal que la referencia apoya en las esquinas de las tarjetas y
   de los bloques a sangre. */
export function Corner({ position = 'br', className = '' }) {
  const geometry = {
    br: 'bottom-0 right-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]',
    tr: 'top-0 right-0 [clip-path:polygon(0_0,100%_0,100%_100%)]',
    tl: 'top-0 left-0 [clip-path:polygon(0_0,100%_0,0_100%)]',
    bl: 'bottom-0 left-0 [clip-path:polygon(0_0,0_100%,100%_100%)]',
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bg-[#E0323F] ${geometry[position]} ${className}`.trim()}
    />
  )
}

/* Título de sección: mayúsculas apretadas, igual que "POPULAR CAR". */
export function SectionTitle({ children, className = '' }) {
  return (
    <h2
      className={`font-display text-[26px] font-semibold uppercase leading-[1.1] tracking-[-0.01em] text-white sm:text-[32px] lg:text-[38px] ${className}`.trim()}
    >
      {children}
    </h2>
  )
}
