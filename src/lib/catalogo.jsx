import { createContext, useContext, useEffect, useState } from 'react'
import { BRANDS } from '../data/vehicles'
import { asset } from './asset'

/* El catálogo del sitio público: los autos que cargan los dueños desde el
   panel (/panel). Se leen en vivo de la vista pública `autos_publicos` de
   Supabase (ver supabase/001_autos.sql), así que un Excel nuevo aparece en la
   página sin publicar nada. Es un fetch común: no carga el SDK de Supabase.

   La URL y la clave "anon" son públicas por diseño; la vista sólo expone
   los datos que ya se ven en la tarjeta (sin patente) y no los vendidos. */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL
const CLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY
const CAMPOS = 'id,marca,modelo,tipo,combustible,anio,km,precio,foto_path'

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
    image: a.foto_path
      ? `${URL_BASE}/storage/v1/object/public/autos/${a.foto_path}`
      : asset('/ig/logo-paolini.svg'),
  }
}

async function leerAutos(senal) {
  const r = await fetch(`${URL_BASE}/rest/v1/autos_publicos?select=${CAMPOS}&order=creado.asc`, {
    headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}` },
    cache: 'no-store',
    signal: senal,
  })
  if (!r.ok) throw new Error(`autos_publicos ${r.status}`)
  return (await r.json()).map(aVehiculo)
}

export function CatalogoProvider({ children }) {
  const configurado = Boolean(URL_BASE && CLAVE)
  const [datos, setDatos] = useState({ vehicles: [], estado: configurado ? 'cargando' : 'listo' })

  useEffect(() => {
    if (!configurado) return
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
  }, [configurado])

  return <CatalogoContext.Provider value={datos}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => useContext(CatalogoContext)
