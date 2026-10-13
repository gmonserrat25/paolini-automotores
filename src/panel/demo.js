/* Modo demo del panel: para mostrarlo en local sin Supabase. Sólo existe en
   desarrollo (`npm run dev`) y con VITE_PANEL_DEMO=1 en `.env.local`. La
   bandera `DEMO` vive en acceso.js y este archivo se carga con import()
   dinámico sólo si está prendida: en un build de producción no entra.

   La cuenta es ficticia y nada se guarda: arranca sin autos, los que se cargan
   viven en memoria y al recargar la página desaparecen. Para probar, usá
   supabase/seed/inventario-demo.xlsx y las fotos de supabase/seed/fotos. */

const rutaDe = (patente) => `${patente.replace(/[^A-Za-z0-9]/g, '').toLowerCase()}.jpg`

let contador = 0
const autos = []

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
