import { createContext, useContext, useEffect, useState } from 'react'
import { BRANDS } from '../data/vehicles'
import { asset } from './asset'

/* El catálogo del sitio público: los autos que cargan los dueños desde el
   panel (/panel). Se leen en vivo de GET /api/autos (api/autos.js), así que un
   Excel nuevo aparece en la página sin publicar nada (la respuesta se
   refresca sola cada pocos segundos).

   Esa respuesta es pública y sólo trae lo que ya se ve en la tarjeta: sin
   patente y sin los autos vendidos. */

const CatalogoContext = createContext({ vehicles: [], estado: 'listo' })

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const capitalizar = (palabra) => palabra.charAt(0) + palabra.slice(1).toLowerCase()

/* Las marcas conocidas salen con su nombre de siempre (BYD, no Byd). */
function marcaBonita(marca) {
  const conocida = BRANDS.find((b) => b.toLowerCase() === marca.toLowerCase())
  return conocida ?? marca.split(' ').map(capitalizar).join(' ')
}

/* Los Excel suelen venir todo en mayúsculas ("HILUX SRV 4X4 2.8"). Si es así
   se pasa a "Hilux SRV 4X4 2.8": las palabras cortas o con números quedan como
   están (versiones, siglas). Si ya viene con minúsculas, no se toca. */
function modeloBonito(modelo) {
  if (modelo !== modelo.toUpperCase()) return modelo
  return modelo
    .split(' ')
    .map((p) => (p.length <= 3 || /\d/.test(p) ? p : capitalizar(p)))
    .join(' ')
}

/* Una fila de la vista, con la forma de las tarjetas del sitio. */
function aVehiculo(a) {
  const ficha = [a.anio, a.km != null && `${a.km.toLocaleString('es-AR')} km`].filter(Boolean).join(' · ')
  return {
    id: a.id,
    brand: marcaBonita(a.marca),
    model: modeloBonito(a.modelo),
    type: a.tipo,
    ficha,
    detail: [a.tipo, ficha].filter(Boolean).join(' · '),
    tag: a.precio ? pesos.format(a.precio) : 'A consultar',
    specs: [a.combustible],
    image: a.foto ?? asset('/ig/logo-paolini.svg'),
  }
}

async function leerAutos(senal) {
  const r = await fetch('/api/autos', { signal: senal })
  if (!r.ok) throw new Error(`autos ${r.status}`)
  return (await r.json()).map(aVehiculo)
}

export function CatalogoProvider({ children }) {
  const [datos, setDatos] = useState({ vehicles: [], estado: 'cargando' })

  useEffect(() => {
    const control = new AbortController()
    const cargar = () =>
      leerAutos(control.signal)
        .then((vehicles) => setDatos({ vehicles, estado: 'listo' }))
        .catch((e) => {
          if (e.name !== 'AbortError') setDatos((d) => ({ ...d, estado: d.vehicles.length ? 'listo' : 'error' }))
        })
    cargar()
    /* Al volver a la pestaña se vuelve a leer: lo que se cargó mientras
       tanto aparece sin recargar. */
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      control.abort()
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  return <CatalogoContext.Provider value={datos}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => useContext(CatalogoContext)
