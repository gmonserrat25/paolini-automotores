import { BRANDS } from '../data/vehicles.js'

/* Cómo se escriben los datos de un auto. Es JavaScript puro, sin React ni
   Vite, porque lo usan dos lados: las tarjetas del sitio (lib/catalogo.jsx) y
   el HTML que la función api/inicio.js arma para quien no ejecuta JavaScript
   (api/_estatico.js). Si cambia acá, cambia igual en los dos. */

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const capitalizar = (palabra) => palabra.charAt(0) + palabra.slice(1).toLowerCase()

/* Las marcas conocidas salen con su nombre de siempre (BYD, no Byd). */
export function marcaBonita(marca) {
  const conocida = BRANDS.find((b) => b.toLowerCase() === marca.toLowerCase())
  return conocida ?? marca.split(' ').map(capitalizar).join(' ')
}

/* Los Excel suelen venir todo en mayúsculas ("HILUX SRV 4X4 2.8"). Si es así
   se pasa a "Hilux SRV 4X4 2.8": las palabras cortas o con números quedan como
   están (versiones, siglas). Si ya viene con minúsculas, no se toca. */
export function modeloBonito(modelo) {
  if (modelo !== modelo.toUpperCase()) return modelo
  return modelo
    .split(' ')
    .map((p) => (p.length <= 3 || /\d/.test(p) ? p : capitalizar(p)))
    .join(' ')
}

export const precioTexto = (precio) => (precio ? pesos.format(precio) : 'A consultar')

/* "2019 · 84.000 km" */
export const fichaTexto = (a) =>
  [a.anio, a.km != null && `${a.km.toLocaleString('es-AR')} km`].filter(Boolean).join(' · ')
