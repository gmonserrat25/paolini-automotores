import { VEHICLES } from '../data/vehicles'
import {
  CONDICION,
  CONSULTAS,
  CONSULTAS_MENSUALES,
  CONSULTAS_SEMANALES,
  ESTADOS,
  ESTADO_INICIAL,
  HISTORIAL,
} from './mock'

/* La capa de datos del panel.

   Hoy lee de `mock.js` y simula la demora de una red. Para pasar a una API
   real alcanza con reescribir el cuerpo de estas dos funciones con `fetch`
   (GET del panel completo y PATCH del estado de una unidad): la forma de lo
   que devuelven es lo único que el resto del panel conoce. */

const LATENCIA = 550
const espera = (ms = LATENCIA) => new Promise((resolver) => setTimeout(resolver, ms))

/* Hace de base de datos mientras no haya una. */
const estados = { ...ESTADO_INICIAL }

const diaCorto = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const mesCorto = new Intl.DateTimeFormat('es-AR', { month: 'short' })
const mesLargo = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const sinPunto = (texto) => texto.replace('.', '')

function lunesDe(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function serieSemanal(hoy) {
  const lunes = lunesDe(hoy)
  return CONSULTAS_SEMANALES.map((valor, i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() - (CONSULTAS_SEMANALES.length - 1 - i) * 7)
    const dia = sinPunto(diaCorto.format(d))
    return { etiqueta: dia, titulo: `Semana del ${dia}`, valor }
  })
}

function serieAnual(hoy) {
  return CONSULTAS_MENSUALES.map((valor, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (CONSULTAS_MENSUALES.length - 1 - i), 1)
    const largo = mesLargo.format(d)
    return {
      etiqueta: sinPunto(mesCorto.format(d)),
      titulo: largo.charAt(0).toUpperCase() + largo.slice(1) + ' · promedio semanal',
      valor,
    }
  })
}

/* GET /panel */
export async function cargarPanel() {
  await espera()
  const hoy = new Date()

  const stock = VEHICLES.map((v) => ({
    ...v,
    condicion: CONDICION[v.id],
    estado: estados[v.id],
  }))

  const consultas = CONSULTAS.map((c) => {
    const auto = VEHICLES.find((v) => v.id === c.vehiculoId)
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      vehiculo: `${auto.brand} ${auto.model}`,
      fecha: new Date(hoy.getTime() - c.haceMin * 60_000),
    }
  })

  return {
    stock,
    consultas,
    historial: HISTORIAL,
    series: { mensual: serieSemanal(hoy), anual: serieAnual(hoy) },
  }
}

/* PATCH /stock/:id */
export async function guardarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) throw new Error(`Estado desconocido: ${estado}`)
  await espera(250)
  estados[id] = estado
  return { id, estado }
}
