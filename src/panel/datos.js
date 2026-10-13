import { achicar } from './carga'
import { DEMO } from './acceso'

/* Los autos viven en la tabla `autos` de la base y las fotos en Vercel Blob.
   Todo pasa por /api/autos, que exige la sesión del dueño (cookie). */

async function pedir(ruta, opciones = {}) {
  const r = await fetch(ruta, {
    credentials: 'same-origin',
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!r.ok) {
    const { error } = await r.json().catch(() => ({}))
    throw new Error(error ?? `El servidor respondió ${r.status}`)
  }
  return r.status === 204 ? null : r.json()
}

/* Todos los autos, con su foto. */
export async function listarAutos() {
  if (DEMO) return (await import('./demo')).listarDemo()
  try {
    return await pedir('/api/autos?vista=panel')
  } catch (e) {
    throw new Error(`No se pudieron leer los autos: ${e.message}`)
  }
}

/* Crea cada auto con su foto (achicada). `cargas` es una lista de
   { fila, archivo, metodo } con la fila del Excel y el archivo de la foto. */
export async function agregarAutos(cargas) {
  if (DEMO) return (await import('./demo')).agregarDemo(cargas)
  const nuevos = []
  for (const { fila, archivo, metodo } of cargas) {
    try {
      nuevos.push(
        await pedir('/api/autos', {
          method: 'POST',
          body: JSON.stringify({ ...fila, metodo, foto: await achicar(archivo, 1600, 'url') }),
        }),
      )
    } catch (e) {
      throw new Error(`${fila.patente}: ${e.message}`)
    }
  }
  return nuevos
}

export async function eliminarAuto(id) {
  if (DEMO) return (await import('./demo')).eliminarDemo(id)
  await pedir(`/api/autos?id=${id}`, { method: 'DELETE' })
}

export async function cambiarEstadoAuto(id, estado) {
  if (DEMO) return (await import('./demo')).estadoDemo(id, estado)
  await pedir(`/api/autos?id=${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) })
}
