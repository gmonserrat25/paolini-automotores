import { DIAS_ALERTA } from './mock'

/* Las cuentas del panel. Todo lo que se muestra como total sale de acá, de
   los mismos datos que dibuja la tabla, así un número nunca contradice a la
   lista que lo explica. */

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export const pesos = (n) => formatoPesos.format(n).replace(/\s/g, ' ')

/* "$ 128,4 M": para las tarjetas, donde los siete dígitos no entran. */
export function pesosCorto(n) {
  if (Math.abs(n) < 1_000_000) return pesos(n)
  return `$ ${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
}

export const COSTO_TOTAL = (v) => v.costo + v.preparacion
export const MARGEN = (v) => v.precioVenta - COSTO_TOTAL(v)

export const enStock = (stock) => stock.filter((v) => v.estado !== 'vendido')
export const esVieja = (v) => v.estado !== 'vendido' && v.diasEnStock >= DIAS_ALERTA
export const viejas = (stock) => stock.filter(esVieja)

/* Plata parada en unidades que todavía no se vendieron. */
export const capitalInmovilizado = (stock) => enStock(stock).reduce((t, v) => t + COSTO_TOTAL(v), 0)

/* Las ventas del mes: las de afuera del catálogo más las unidades del
   catálogo que están en "Vendido". */
export function ventasDelMes({ stock, ventasExtra }) {
  const delCatalogo = stock
    .filter((v) => v.estado === 'vendido')
    .map((v) => ({
      id: v.id,
      descripcion: `${v.brand} ${v.model}`,
      precio: v.precioVenta,
      costo: COSTO_TOTAL(v),
      origen: v.origenVenta,
    }))
  return [...ventasExtra, ...delCatalogo]
}

export function resumenVentas(datos) {
  const ventas = ventasDelMes(datos)
  const pesosTotal = ventas.reduce((t, v) => t + v.precio, 0)
  const margen = ventas.reduce((t, v) => t + (v.precio - v.costo), 0)
  return { ventas, unidades: ventas.length, pesos: pesosTotal, margen }
}

const MIN_SIN_RESPONDER = 120
export const sinResponder = (consultas, ahora = new Date()) =>
  consultas.filter((c) => c.estado === 'nueva' && (ahora - c.fecha) / 60_000 > MIN_SIN_RESPONDER)

/* Horario del salón: lunes a viernes 9–13 y 17–21, sábados 9–13, domingos
   cerrado. */
export function fueraDeHorario(fecha) {
  const dia = fecha.getDay()
  const hora = fecha.getHours() + fecha.getMinutes() / 60
  if (dia === 0) return true
  const manana = hora >= 9 && hora < 13
  if (dia === 6) return !manana
  return !(manana || (hora >= 17 && hora < 21))
}

/* Cada búsqueda frente a las unidades disponibles que la responden. */
export function demanda(busquedas, stock) {
  const libres = stock.filter((v) => v.estado === 'disponible')
  const responde = (v, { tipo, motor }) => (tipo ? v.type === tipo : motor.includes(v.specs[0]))
  return busquedas
    .map((b) => ({ ...b, unidades: libres.filter((v) => responde(v, b.regla)).length }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

/* Simulaciones de cuota agrupadas por unidad: cuántas, anticipo promedio y
   la cantidad de cuotas que más se eligió. */
export function cuotasPorUnidad(simulaciones, stock) {
  const grupos = new Map()
  for (const [id, anticipo, cuotas] of simulaciones) {
    const g = grupos.get(id) ?? { id, anticipos: [], cuotas: {} }
    g.anticipos.push(anticipo)
    g.cuotas[cuotas] = (g.cuotas[cuotas] ?? 0) + 1
    grupos.set(id, g)
  }
  return [...grupos.values()]
    .map((g) => {
      const v = stock.find((u) => u.id === g.id)
      return {
        id: g.id,
        unidad: `${v.brand} ${v.model}`,
        cantidad: g.anticipos.length,
        anticipo: g.anticipos.reduce((t, n) => t + n, 0) / g.anticipos.length,
        cuotas: Number(Object.entries(g.cuotas).sort((a, b) => b[1] - a[1])[0][0]),
      }
    })
    .sort((a, b) => b.cantidad - a.cantidad)
}
