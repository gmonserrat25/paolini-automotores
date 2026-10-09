/* Íconos de trazo del panel, todos en la misma grilla de 20 px. */
const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Icono({ className = 'h-5 w-5', children }) {
  return (
    <svg className={className} viewBox="0 0 20 20" {...trazo} aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconoResumen = (p) => (
  <Icono {...p}>
    <rect x="2.75" y="2.75" width="6" height="7.5" rx="1.6" />
    <rect x="11.25" y="2.75" width="6" height="4.5" rx="1.6" />
    <rect x="2.75" y="12.75" width="6" height="4.5" rx="1.6" />
    <rect x="11.25" y="9.75" width="6" height="7.5" rx="1.6" />
  </Icono>
)

export const IconoAuto = (p) => (
  <Icono {...p}>
    <path d="M3.2 11.2 4.6 7.4a1.6 1.6 0 0 1 1.5-1.05h7.8a1.6 1.6 0 0 1 1.5 1.05l1.4 3.8" />
    <rect x="2.4" y="11.2" width="15.2" height="4.2" rx="1.5" />
    <path d="M5 15.4v1.35M15 15.4v1.35" />
    <circle cx="5.6" cy="13.3" r=".35" fill="currentColor" />
    <circle cx="14.4" cy="13.3" r=".35" fill="currentColor" />
  </Icono>
)

export const IconoConsultas = (p) => (
  <Icono {...p}>
    <path d="M3 5.4A2.4 2.4 0 0 1 5.4 3h9.2A2.4 2.4 0 0 1 17 5.4v6.2a2.4 2.4 0 0 1-2.4 2.4H9.2L5.6 16.8V14h0A2.6 2.6 0 0 1 3 11.4Z" />
    <path d="M6.6 7.2h6.8M6.6 10h4" />
  </Icono>
)

export const IconoSitio = (p) => (
  <Icono {...p}>
    <path d="M8 4H5.4A1.9 1.9 0 0 0 3.5 5.9v8.7a1.9 1.9 0 0 0 1.9 1.9h8.7a1.9 1.9 0 0 0 1.9-1.9V12" />
    <path d="M11.5 3.5h5v5M16.5 3.5 9.5 10.5" />
  </Icono>
)

export const IconoBuscar = (p) => (
  <Icono {...p}>
    <circle cx="9" cy="9" r="5.4" />
    <path d="m13.2 13.2 3.6 3.6" />
  </Icono>
)

export const IconoFlecha = (p) => (
  <Icono {...p}>
    <path d="m5.5 8 4.5 4.5L14.5 8" />
  </Icono>
)

export const IconoCheck = (p) => (
  <Icono {...p}>
    <path d="m4.5 10.5 3.4 3.4 7.6-8" />
  </Icono>
)

export const IconoAlerta = (p) => (
  <Icono {...p}>
    <path d="M10 3.2 17.4 16H2.6Z" />
    <path d="M10 8.4v3.6M10 14.2v.05" />
  </Icono>
)
