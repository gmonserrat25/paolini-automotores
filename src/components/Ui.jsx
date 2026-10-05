/* Botón y título de sección que se repiten en toda la página.

   Un solo radio (`rounded-lg`), un solo rojo y el hover se resuelve con el
   color: nada de sombra de color ni de saltitos. Hay dos jerarquías: el
   principal va lleno y el secundario de línea. Cuando la acción es escribir
   por WhatsApp, el botón lleva el ícono de WhatsApp (pasado en `icon`). */

const VARIANTS = {
  primary: 'bg-[#D52B38] text-white hover:bg-[#B9222E] active:bg-[#A31E29]',
  inverse: 'bg-white text-[#0A0A0A] hover:bg-white/85 active:bg-white/75',
  secondary:
    'border border-white/30 text-white hover:border-white hover:bg-white/10 active:bg-white/15',
}

const SIZES = {
  sm: 'gap-2 px-4 py-2 text-[14px]',
  md: 'gap-2.5 px-5 py-3 text-[16px]',
}

/* Sin `href` sale como <button>, que es lo que corresponde cuando la acción
   no lleva a ningún lado. */
export function Cta({
  href,
  children,
  icon = null,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const Tag = href ? 'a' : 'button'

  return (
    <Tag
      href={href}
      type={href ? undefined : 'button'}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-sans font-semibold transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()}
      {...rest}
    >
      {icon}
      {children}
    </Tag>
  )
}

/* Título de sección en minúscula: los largos se leen mejor así que en
   mayúsculas, y deja el titular del hero (que sí va en mayúsculas) como el
   único de la página con ese peso. */
export function SectionTitle({ children, className = '' }) {
  return (
    <h2
      className={`font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-white sm:text-[32px] lg:text-[36px] ${className}`.trim()}
    >
      {children}
    </h2>
  )
}
