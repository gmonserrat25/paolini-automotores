/* Una entrega es la foto con quien se llevó el auto. El texto no se carga a
   mano: sale de dos campos (nombre del cliente y vehículo entregado), así
   todas dicen lo mismo. `plural` es para una familia o una pareja.

   Se cargan como les salga: "GRACIELA", "graciela" o "Graciela". Si viene
   todo en mayúsculas o todo en minúsculas se acomoda ("Graciela", "Polo
   Robust 0km"); si ya tiene mayúsculas y minúsculas, se respeta tal cual
   (para que "T-Cross" o "Hilux SRV" no se rompan). Las siglas cortas
   (GT, SR, VW) del vehículo quedan en mayúsculas; en los nombres no ("ANA" → "Ana"). */

const CHICAS = new Set(['y', 'e', 'de', 'del', 'la', 'las', 'los', 'el'])
const palabra = (p, i, siglas) => {
  if (i > 0 && CHICAS.has(p.toLowerCase())) return p.toLowerCase() // "Juan y Ana"
  if (/^\d+km$/i.test(p)) return p.toLowerCase() // 0KM → 0km
  if (/\d/.test(p) || (siglas && p.length <= 3 && p === p.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{2}/.test(p))) return p
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

export function prolijo(texto = '', { siglas = true } = {}) {
  const t = String(texto).trim().replace(/\s+/g, ' ')
  const mezclado = t !== t.toUpperCase() && t !== t.toLowerCase()
  if (mezclado) return t.replace(/\b(\d+)km\b/gi, '$1km') // "0Km" → "0km"
  /* Todo en minúsculas: las siglas no se pueden adivinar, va todo en tipo título. */
  const base = t === t.toLowerCase() ? t.replace(/\S+/g, (p) => p.charAt(0).toUpperCase() + p.slice(1)) : t
  let n = 0
  return base.replace(/[^\s-]+/g, (p) => palabra(p, n++, siglas))
}

/* Lo grande: "¡Gracias Graciela!" */
export const gracias = ({ cliente }) => `¡Gracias ${prolijo(cliente, { siglas: false })}!`

/* Lo de abajo: "Se fue con su Polo Robust 0km." */
export const seFue = ({ plural, vehiculo }) => `${plural ? 'Se fueron' : 'Se fue'} con su ${prolijo(vehiculo)}.`

/* Las dos juntas, para donde va en una sola línea (texto alternativo, listas). */
export const frase = (e) => `${gracias(e)} ${seFue(e)}`
