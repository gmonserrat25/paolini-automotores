/* Íconos del sitio. Todos toman `currentColor` y un viewBox cuadrado, así el
   tamaño lo decide la clase que les pasa quien los usa. */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function ArrowRightIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <path d="M3.5 9h11" />
      <path d="M9.5 4l5 5-5 5" />
    </svg>
  )
}

/* La flechita diagonal que la referencia mete adentro de un cuadrado negro en
   cada botón. */
export function ArrowUpRightIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <path d="M5.5 12.5 12.5 5.5" />
      <path d="M6.5 5.5h6v6" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <path d="M14.5 9h-11" />
      <path d="M8 3.5 3.5 9 8 14.5" />
    </svg>
  )
}

export function ChevronRightIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <path d="M3.5 9h11" />
      <path d="M10 3.5 14.5 9 10 14.5" />
    </svg>
  )
}

export function HeartIcon({ className = '', filled = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      aria-hidden="true"
    >
      <path d="M10 17s-6.5-4.1-6.5-8.4A3.9 3.9 0 0 1 10 6.1a3.9 3.9 0 0 1 6.5 2.5C16.5 12.9 10 17 10 17Z" />
    </svg>
  )
}

export function FuelIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <path d="M3.5 17V4.5A1.5 1.5 0 0 1 5 3h5a1.5 1.5 0 0 1 1.5 1.5V17" />
      <path d="M2.5 17h10" />
      <path d="M4.5 6.5h6.5" />
      <path d="M11.5 8.5h2.6a1.4 1.4 0 0 1 1.4 1.4v3.6a1.3 1.3 0 0 0 2.5.4V7l-2-2" />
    </svg>
  )
}

export function GearboxIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <circle cx="10" cy="10" r="6.7" />
      <circle cx="10" cy="10" r="2.6" />
    </svg>
  )
}

export function SeatsIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <circle cx="7.6" cy="6.6" r="2.6" />
      <path d="M2.8 15.4a4.8 4.8 0 0 1 9.6 0" />
      <path d="M13.4 4.4a2.6 2.6 0 0 1 0 4.9" />
      <path d="M14.6 11.2a4.8 4.8 0 0 1 2.6 4.2" />
    </svg>
  )
}

export function SearchIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} strokeWidth={2} aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  )
}

export function PinIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <path d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 0 0-11 0c0 4.4 5.5 9 5.5 9Z" />
      <circle cx="10" cy="8.4" r="2.1" />
    </svg>
  )
}

export function ClockIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5.8V10l2.8 1.8" />
    </svg>
  )
}

export function ShieldIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...stroke} aria-hidden="true">
      <path d="M10 2.6 16 5v4.6c0 3.6-2.5 6.6-6 7.8-3.5-1.2-6-4.2-6-7.8V5Z" />
      <path d="m7.4 9.8 1.9 1.9 3.4-3.6" />
    </svg>
  )
}

export function WhatsAppIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M9 0a8.9 8.9 0 0 0-7.6 13.6L0 18l4.5-1.3A9 9 0 1 0 9 0Zm0 16.4a7.4 7.4 0 0 1-3.8-1l-.3-.2-2.7.8.8-2.6-.2-.3A7.4 7.4 0 1 1 9 16.4Zm4.1-5.5c-.2-.1-1.3-.7-1.5-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5 0a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2A5.2 5.2 0 0 0 5.4 10a11.8 11.8 0 0 0 4.5 4 8.6 8.6 0 0 0 1.5.5 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  )
}

export function InstagramIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M9 1.6c2.4 0 2.7 0 3.6.1.9 0 1.4.2 1.7.3.4.2.7.4 1 .7s.5.6.7 1c.1.3.3.8.3 1.7 0 .9.1 1.2.1 3.6s0 2.7-.1 3.6c0 .9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1s-.6.5-1 .7c-.3.1-.8.3-1.7.3-.9 0-1.2.1-3.6.1s-2.7 0-3.6-.1c-.9 0-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7s-.5-.6-.7-1c-.1-.3-.3-.8-.3-1.7 0-.9-.1-1.2-.1-3.6s0-2.7.1-3.6c0-.9.2-1.4.3-1.7.2-.4.4-.7.7-1s.6-.5 1-.7c.3-.1.8-.3 1.7-.3.9 0 1.2-.1 3.6-.1Zm0 4.2A3.2 3.2 0 1 0 12.2 9 3.2 3.2 0 0 0 9 5.8Zm0 5.3A2.1 2.1 0 1 1 11.1 9 2.1 2.1 0 0 1 9 11.1Zm4.1-5.4a.8.8 0 1 1-.8-.8.8.8 0 0 1 .8.8Z" />
    </svg>
  )
}

export function PhoneIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <path d="M16.5 12.7v2.1a1.4 1.4 0 0 1-1.5 1.4 13.9 13.9 0 0 1-6-2.2 13.7 13.7 0 0 1-4.2-4.2 13.9 13.9 0 0 1-2.2-6.1A1.4 1.4 0 0 1 4 1.8h2.1a1.4 1.4 0 0 1 1.4 1.2 9 9 0 0 0 .5 2 1.4 1.4 0 0 1-.3 1.5l-.9.9a11.2 11.2 0 0 0 4.2 4.2l.9-.9a1.4 1.4 0 0 1 1.5-.3 9 9 0 0 0 2 .5 1.4 1.4 0 0 1 1.2 1.4Z" />
    </svg>
  )
}

export function MailIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 18 18" {...stroke} aria-hidden="true">
      <rect x="2" y="3.8" width="14" height="10.4" rx="1.6" />
      <path d="m2.6 5 5.7 4.1a1.2 1.2 0 0 0 1.4 0L15.4 5" />
    </svg>
  )
}
