/* Modo demo del panel: para mostrarlo en local sin base de datos. Sólo existe en
   desarrollo (`npm run dev`) y con VITE_PANEL_DEMO=1 en `.env.local`. La
   bandera `DEMO` vive en acceso.js y este archivo se carga con import()
   dinámico sólo si está prendida: en un build de producción no entra.

   La cuenta es ficticia y nada se guarda: arranca sin autos, los que se cargan
   viven en memoria y al recargar la página desaparecen. Para probar, usá
   demo-datos/inventario-demo.xlsx y las fotos de demo-datos/fotos. */

const rutaDe = (patente) => `${patente.replace(/[^A-Za-z0-9]/g, '').toLowerCase()}.jpg`

let contador = 0
const autos = []

/* Con VITE_PANEL_DEMO_STOCK=1 la demo arranca con los autos de
   demo-datos/inventario.json (para probar el asistente de posts sin cargar
   nada). Las fotos las sirve vite.config.js en /demo-fotos. */
if (import.meta.env.VITE_PANEL_DEMO_STOCK === '1') {
  const { autos: ejemplo } = (await import('../../demo-datos/inventario.json')).default
  for (const a of ejemplo) {
    autos.push({
      id: `demo-${++contador}`,
      patente: a.patente,
      marca: a.marca,
      modelo: a.modelo,
      tipo: a.tipo ?? 'Auto',
      combustible: a.combustible ?? 'Nafta',
      color: a.color,
      anio: a.anio,
      km: a.km,
      precio: a.precio,
      estado: 'disponible',
      foto_path: rutaDe(a.patente),
      foto: `/demo-fotos/${a.foto.split('/').pop()}`,
      reconocido_por: a.reconocido_por,
    })
  }
}

export const listarDemo = () => autos.map((a) => ({ ...a }))

export function agregarDemo(cargas) {
  return cargas.map(({ fila, archivo, metodo }) => {
    if (autos.some((a) => rutaDe(a.patente) === rutaDe(fila.patente))) {
      throw new Error(`La patente ${fila.patente} ya está cargada`)
    }
    const auto = {
      id: `demo-${++contador}`,
      patente: fila.patente,
      marca: fila.marca,
      modelo: fila.modelo,
      tipo: fila.tipo ?? 'Auto',
      combustible: fila.combustible ?? 'Nafta',
      color: fila.color,
      anio: fila.anio,
      km: fila.km,
      precio: fila.precio,
      estado: 'disponible',
      foto_path: rutaDe(fila.patente),
      foto: URL.createObjectURL(archivo),
      reconocido_por: metodo,
    }
    autos.push(auto)
    return { ...auto }
  })
}

export function eliminarDemo(id) {
  const i = autos.findIndex((a) => a.id === id)
  if (i >= 0) autos.splice(i, 1)
}

export function estadoDemo(id, estado) {
  const auto = autos.find((a) => a.id === id)
  if (auto) auto.estado = estado
}

export function editarDemo(id, cambios) {
  const auto = autos.find((a) => a.id === id)
  if (!auto) throw new Error('No existe ese auto')
  if (cambios.patente && autos.some((a) => a.id !== id && rutaDe(a.patente) === rutaDe(cambios.patente))) {
    throw new Error(`La patente ${cambios.patente} ya está cargada`)
  }
  Object.assign(auto, cambios)
  return { ...auto }
}

/* Las entregas de la demo: también en memoria. */
const entregas = []

export const listarEntregasDemo = () => entregas.map((e) => ({ ...e }))

export function agregarEntregaDemo({ cliente, plural, vehiculo, archivo }) {
  const entrega = {
    id: `demo-entrega-${++contador}`,
    cliente,
    plural,
    vehiculo,
    foto: URL.createObjectURL(archivo),
    creado: new Date().toISOString(),
  }
  entregas.unshift(entrega)
  return { ...entrega }
}

export function eliminarEntregaDemo(id) {
  const i = entregas.findIndex((e) => e.id === id)
  if (i >= 0) entregas.splice(i, 1)
}
