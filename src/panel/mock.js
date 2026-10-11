/* Datos de mentira del panel. Nada de acá es real: cuando exista un backend,
   este archivo deja de usarse y `api.js` pasa a pedirle todo a la API.

   Los autos NO se repiten acá: vienen de `data/vehicles.js`. Este archivo sólo
   guarda lo que el catálogo público no tiene — si la unidad es 0km o usada,
   en qué estado de venta está y quién consultó por ella. */

export const ESTADOS = ['disponible', 'reservado', 'vendido']

export const ESTADO_LABEL = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

/* El catálogo sólo marca "0km" en dos unidades; el resto de las etiquetas
   ("Entrega inmediata", "Novedad") no dice si el auto es nuevo. BYD llega
   siempre de fábrica, así que va como 0km. */
export const CONDICION = {
  tcross: '0km',
  'peugeot-208-gt': '0km',
  'byd-atto2': '0km',
  hibrido: '0km',
  amarok: 'usado',
  'peugeot-208': 'usado',
}

export const ESTADO_INICIAL = {
  tcross: 'disponible',
  'peugeot-208-gt': 'reservado',
  amarok: 'disponible',
  'byd-atto2': 'disponible',
  'peugeot-208': 'vendido',
  hibrido: 'disponible',
}

/* Consultas por semana: las últimas 12 (la última es la semana en curso) y el
   promedio semanal de cada uno de los últimos 12 meses (el último es el mes en
   curso). */
export const CONSULTAS_SEMANALES = [31, 38, 34, 42, 45, 39, 48, 52, 44, 50, 47, 56]
export const CONSULTAS_MENSUALES = [28, 30, 33, 31, 36, 40, 38, 42, 45, 43, 47, 51]

/* Cómo fue cambiando el stock en las últimas 8 semanas. Al último valor lo
   reemplaza el número real, así la tarjeta y su minigráfico nunca discrepan. */
export const HISTORIAL = {
  stock: [4, 5, 5, 6, 6, 6, 5, 5],
  cerokm: [2, 3, 3, 3, 4, 4, 4, 4],
  usados: [2, 2, 2, 3, 2, 2, 1, 1],
}

/* `haceMin` es hace cuántos minutos llegó la consulta; la API lo convierte en
   fecha. Los teléfonos son de relleno. */
export const ESTADOS_CONSULTA = ['nueva', 'contactada', 'visito', 'cerro']

export const ESTADO_CONSULTA_LABEL = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  visito: 'Visitó',
  cerro: 'Cerró',
}

export const ORIGENES = ['whatsapp', 'instagram', 'web', 'mostrador']

export const ORIGEN_LABEL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  web: 'Web',
  mostrador: 'Mostrador',
}

export const CONSULTAS = [
  { id: 'c1', nombre: 'Facundo Ledesma', telefono: '5493548550101', vehiculoId: 'tcross', haceMin: 14, estado: 'nueva', origen: 'web' },
  { id: 'c2', nombre: 'Julieta Bustos', telefono: '5493548550102', vehiculoId: 'byd-atto2', haceMin: 52, estado: 'nueva', origen: 'instagram' },
  { id: 'c3', nombre: 'Matías Oviedo', telefono: '5493548550103', vehiculoId: 'amarok', haceMin: 190, estado: 'nueva', origen: 'whatsapp' },
  { id: 'c4', nombre: 'Camila Altamirano', telefono: '5493548550104', vehiculoId: 'peugeot-208-gt', haceMin: 380, estado: 'nueva', origen: 'whatsapp' },
  { id: 'c5', nombre: 'Nicolás Brizuela', telefono: '5493548550105', vehiculoId: 'hibrido', haceMin: 1500, estado: 'contactada', origen: 'instagram' },
  { id: 'c6', nombre: 'Agustina Carranza', telefono: '5493548550106', vehiculoId: 'tcross', haceMin: 1710, estado: 'contactada', origen: 'web' },
  { id: 'c7', nombre: 'Lucas Peralta', telefono: '5493548550107', vehiculoId: 'amarok', haceMin: 2900, estado: 'visito', origen: 'whatsapp' },
  { id: 'c8', nombre: 'Rocío Giménez', telefono: '5493548550108', vehiculoId: 'byd-atto2', haceMin: 4300, estado: 'cerro', origen: 'mostrador' },
]

/* La plata de cada unidad. `costo` es lo que le salió al salón, `preparacion`
   lo que se gastó en dejarla lista (taller, chapa, gestoría) y `diasEnStock`
   cuánto lleva desde que entró. Una unidad vendida guarda en `vendidoHaceDias`
   cuándo se fue y en `diasEnStock` cuánto tardó. Pesos de mentira. */
export const FICHA = {
  tcross: { precioVenta: 38_500_000, costo: 35_200_000, preparacion: 380_000, diasEnStock: 23 },
  'peugeot-208-gt': { precioVenta: 31_000_000, costo: 28_400_000, preparacion: 290_000, diasEnStock: 38 },
  amarok: { precioVenta: 52_000_000, costo: 46_500_000, preparacion: 920_000, diasEnStock: 74 },
  'byd-atto2': { precioVenta: 36_900_000, costo: 33_800_000, preparacion: 150_000, diasEnStock: 12 },
  'peugeot-208': { precioVenta: 17_800_000, costo: 15_100_000, preparacion: 510_000, diasEnStock: 41, vendidoHaceDias: 4 },
  hibrido: { precioVenta: 41_000_000, costo: 37_600_000, preparacion: 200_000, diasEnStock: 95 },
}

/* Pasados estos días sin venderse, la unidad se marca. */
export const DIAS_ALERTA = 60

/* Ventas del mes de unidades que no están en el catálogo de la página (el
   catálogo muestra sólo las destacadas). Las del catálogo se suman solas
   cuando una unidad pasa a "Vendido". */
export const VENTAS_FUERA_CATALOGO = [
  { id: 'v1', descripcion: 'Fiat Cronos 2022', precio: 19_800_000, costo: 18_100_000, haceDias: 2, origen: 'whatsapp' },
  { id: 'v2', descripcion: 'Toyota Hilux 2019', precio: 41_500_000, costo: 37_900_000, haceDias: 6, origen: 'instagram' },
]

/* De dónde salió la venta de las unidades del catálogo; si no figura, fue en
   el mostrador. */
export const ORIGEN_VENTA = { 'peugeot-208': 'whatsapp' }

export const OBJETIVO_VENTAS = 8
export const MES_ANTERIOR = { unidades: 5, pesos: 187_400_000, margen: 13_600_000 }

/* El embudo del mes en curso. Las ventas no están: se cuentan de la lista de
   arriba. `presupuestos` es el total; el resto va por origen. */
export const PRESUPUESTOS_MES = 11
export const EMBUDO_ORIGEN = {
  whatsapp: { consultas: 34, visitas: 8 },
  instagram: { consultas: 18, visitas: 4 },
  web: { consultas: 12, visitas: 3 },
  mostrador: { consultas: 8, visitas: 6 },
}

/* Lo que escribieron los visitantes en el buscador de la web, agrupado, en los
   últimos 30 días. `regla` dice qué unidades del stock responden a esa
   búsqueda. */
export const BUSQUEDAS = [
  { id: 'b1', etiqueta: 'Pick-up 4x4 diésel', cantidad: 30, regla: { tipo: 'Pick-up' } },
  { id: 'b2', etiqueta: 'SUV automática', cantidad: 24, regla: { tipo: 'SUV' } },
  { id: 'b3', etiqueta: 'Hatchback nafta', cantidad: 19, regla: { tipo: 'Hatchback' } },
  { id: 'b4', etiqueta: 'Eléctrico o híbrido', cantidad: 11, regla: { motor: ['Eléctrico', 'Híbrido'] } },
  { id: 'b5', etiqueta: 'Sedán', cantidad: 8, regla: { tipo: 'Sedán' } },
  { id: 'b6', etiqueta: 'Utilitario', cantidad: 5, regla: { tipo: 'Utilitario' } },
]

/* Lo que pasa hoy en el salón. `hora` es "HH:MM". */
export const AGENDA = [
  { id: 'a1', hora: '09:30', tipo: 'visita', cliente: 'Federico Sosa', vehiculoId: 'amarok' },
  { id: 'a2', hora: '11:00', tipo: 'entrega', cliente: 'Rocío Giménez', vehiculoId: 'byd-atto2' },
  { id: 'a3', hora: '17:30', tipo: 'prueba', cliente: 'Julieta Bustos', vehiculoId: 'byd-atto2' },
  { id: 'a4', hora: '19:00', tipo: 'visita', cliente: 'Camila Altamirano', vehiculoId: 'peugeot-208-gt' },
]

export const TIPO_AGENDA = { visita: 'Visita', prueba: 'Prueba de manejo', entrega: 'Entrega' }

/* Tasaciones que pidieron por la web: el auto del cliente, el rango que se le
   devolvió y si alguien ya lo llamó. */
export const TASACIONES = [
  { id: 't1', nombre: 'Ezequiel Montenegro', telefono: '5493548550201', auto: 'Ford Focus 2018', km: 92_000, desde: 11_200_000, hasta: 12_400_000, haceMin: 95, contactada: false },
  { id: 't2', nombre: 'Valeria Arias', telefono: '5493548550202', auto: 'Chevrolet Onix 2020', km: 58_000, desde: 13_800_000, hasta: 14_900_000, haceMin: 640, contactada: false },
  { id: 't3', nombre: 'Gonzalo Funes', telefono: '5493548550203', auto: 'Renault Duster 2017', km: 121_000, desde: 12_100_000, hasta: 13_300_000, haceMin: 1900, contactada: true },
  { id: 't4', nombre: 'Marina Quiroga', telefono: '5493548550204', auto: 'Toyota Etios 2019', km: 74_000, desde: 11_900_000, hasta: 12_800_000, haceMin: 3400, contactada: true },
]

/* Simulaciones de cuota hechas en las fichas, últimos 30 días: [unidad,
   anticipo, cuotas]. */
export const SIMULACIONES = [
  ['tcross', 8_000_000, 36], ['tcross', 10_000_000, 48], ['tcross', 12_000_000, 36], ['tcross', 8_000_000, 24],
  ['amarok', 15_000_000, 36], ['amarok', 20_000_000, 24], ['amarok', 15_000_000, 36],
  ['byd-atto2', 9_000_000, 48], ['byd-atto2', 12_000_000, 48], ['byd-atto2', 10_000_000, 36],
  ['peugeot-208-gt', 6_000_000, 24], ['peugeot-208-gt', 8_000_000, 24],
  ['hibrido', 10_000_000, 48],
]
