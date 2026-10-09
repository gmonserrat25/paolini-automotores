import { VEHICLES } from '../data/vehicles'
import {
  AGENDA,
  BUSQUEDAS,
  CONDICION,
  CONSULTAS,
  CONSULTAS_MENSUALES,
  CONSULTAS_SEMANALES,
  EMBUDO_ORIGEN,
  ESTADOS,
  ESTADOS_CONSULTA,
  ESTADO_INICIAL,
  FICHA,
  HISTORIAL,
  MES_ANTERIOR,
  OBJETIVO_VENTAS,
  ORIGEN_VENTA,
  PRESUPUESTOS_MES,
  SIMULACIONES,
  TASACIONES,
  VENTAS_FUERA_CATALOGO,
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
const estadosConsulta = Object.fromEntries(CONSULTAS.map((c) => [c.id, c.estado]))
const tasacionesContactadas = Object.fromEntries(TASACIONES.map((t) => [t.id, t.contactada]))

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

  /* Las ventas se cuentan dentro del mes: el mock habla de "hace N días" y
     si hoy es el 3, una venta de hace 6 días cae en el mes pasado. */
  const diasDelMes = hoy.getDate() - 1
  const dentroDelMes = (dias) => Math.min(dias, diasDelMes)

  const stock = VEHICLES.map((v) => {
    const ficha = FICHA[v.id]
    return {
      ...v,
      ...ficha,
      condicion: CONDICION[v.id],
      estado: estados[v.id],
      origenVenta: ORIGEN_VENTA[v.id] ?? 'mostrador',
      vendidoHaceDias: ficha.vendidoHaceDias === undefined ? undefined : dentroDelMes(ficha.vendidoHaceDias),
    }
  })

  const consultas = CONSULTAS.map((c) => {
    const auto = VEHICLES.find((v) => v.id === c.vehiculoId)
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      vehiculo: `${auto.brand} ${auto.model}`,
      origen: c.origen,
      estado: estadosConsulta[c.id],
      fecha: new Date(hoy.getTime() - c.haceMin * 60_000),
    }
  })

  const tasaciones = TASACIONES.map((t) => ({
    ...t,
    contactada: tasacionesContactadas[t.id],
    fecha: new Date(hoy.getTime() - t.haceMin * 60_000),
  }))

  const agenda = AGENDA.map((a) => {
    const auto = VEHICLES.find((v) => v.id === a.vehiculoId)
    const [h, m] = a.hora.split(':').map(Number)
    const cuando = new Date(hoy)
    cuando.setHours(h, m, 0, 0)
    return { ...a, vehiculo: `${auto.brand} ${auto.model}`, cuando }
  })

  return {
    stock,
    consultas,
    tasaciones,
    agenda,
    busquedas: BUSQUEDAS,
    simulaciones: SIMULACIONES,
    ventasExtra: VENTAS_FUERA_CATALOGO.map((v) => ({ ...v, haceDias: dentroDelMes(v.haceDias) })),
    objetivoVentas: OBJETIVO_VENTAS,
    mesAnterior: MES_ANTERIOR,
    embudo: { origen: EMBUDO_ORIGEN, presupuestos: PRESUPUESTOS_MES },
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

/* PATCH /consultas/:id */
export async function guardarEstadoConsulta(id, estado) {
  if (!ESTADOS_CONSULTA.includes(estado)) throw new Error(`Estado de consulta desconocido: ${estado}`)
  await espera(250)
  estadosConsulta[id] = estado
  return { id, estado }
}

/* PATCH /tasaciones/:id */
export async function guardarTasacion(id, contactada) {
  await espera(250)
  tasacionesContactadas[id] = contactada
  return { id, contactada }
}
