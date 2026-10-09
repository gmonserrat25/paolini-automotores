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
export const CONSULTAS = [
  { id: 'c1', nombre: 'Facundo Ledesma', telefono: '5493548550101', vehiculoId: 'tcross', haceMin: 14 },
  { id: 'c2', nombre: 'Julieta Bustos', telefono: '5493548550102', vehiculoId: 'byd-atto2', haceMin: 52 },
  { id: 'c3', nombre: 'Matías Oviedo', telefono: '5493548550103', vehiculoId: 'amarok', haceMin: 190 },
  { id: 'c4', nombre: 'Camila Altamirano', telefono: '5493548550104', vehiculoId: 'peugeot-208-gt', haceMin: 380 },
  { id: 'c5', nombre: 'Nicolás Brizuela', telefono: '5493548550105', vehiculoId: 'hibrido', haceMin: 1500 },
  { id: 'c6', nombre: 'Agustina Carranza', telefono: '5493548550106', vehiculoId: 'tcross', haceMin: 1710 },
  { id: 'c7', nombre: 'Lucas Peralta', telefono: '5493548550107', vehiculoId: 'amarok', haceMin: 2900 },
  { id: 'c8', nombre: 'Rocío Giménez', telefono: '5493548550108', vehiculoId: 'byd-atto2', haceMin: 4300 },
]
