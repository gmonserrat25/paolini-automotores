import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fichaTexto, marcaBonita, modeloBonito, precioTexto } from './formato'
import { asset } from './asset'

/* El catálogo del sitio público: los autos que cargan los dueños desde el
   panel (/panel). Se leen en vivo de GET /api/autos (api/autos.js), así que un
   Excel nuevo aparece en la página sin publicar nada (la respuesta se
   refresca sola cada pocos segundos).

   Esa respuesta es pública y sólo trae lo que ya se ve en la tarjeta: sin
   patente y sin los autos vendidos. */

const CatalogoContext = createContext({ vehicles: [], disponibles: [], estado: 'listo' })

/* Una fila de la vista, con la forma de las tarjetas del sitio. */
function aVehiculo(a) {
  const ficha = fichaTexto(a)
  return {
    id: a.id,
    reservado: a.estado === 'reservado',
    brand: marcaBonita(a.marca),
    model: modeloBonito(a.modelo),
    type: a.tipo,
    ficha,
    detail: [a.tipo, ficha].filter(Boolean).join(' · '),
    tag: precioTexto(a.precio),
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

  /* `vehicles` trae todo lo que se muestra (disponibles y reservados);
     `disponibles` es lo que se puede ofrecer: los reservados no entran al
     buscador ni al carrusel. */
  const valor = useMemo(
    () => ({ ...datos, disponibles: datos.vehicles.filter((v) => !v.reservado) }),
    [datos],
  )
  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => useContext(CatalogoContext)
