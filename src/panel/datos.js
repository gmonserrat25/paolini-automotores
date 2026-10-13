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

/* Crea cada auto con todas sus fotos (achicadas). `cargas` es una lista de
   { fila, archivos, metodo } con la fila del Excel y los archivos de sus fotos,
   la portada primero. La portada va con el auto y las demás se suman de a una
   (un pedido no admite varias fotos juntas); si alguna falla el auto queda
   creado con las que subieron y el error lo cuenta. */
export async function agregarAutos(cargas) {
  if (DEMO) return (await import('./demo')).agregarDemo(cargas)
  const nuevos = []
  for (const { fila, archivos, metodo } of cargas) {
    let auto
    try {
      auto = await pedir('/api/autos', {
        method: 'POST',
        body: JSON.stringify({ ...fila, metodo, foto: await achicar(archivos[0], 1600, 'url') }),
      })
    } catch (e) {
      throw new Error(`${fila.patente}: ${e.message}`)
    }
    let fallidas = 0
    for (const archivo of archivos.slice(1)) {
      try {
        auto = await pedir(`/api/autos?id=${auto.id}`, {
          method: 'POST',
          body: JSON.stringify({ foto: await achicar(archivo, 1600, 'url') }),
        })
      } catch {
        fallidas += 1
      }
    }
    nuevos.push(auto)
    if (fallidas) {
      throw new Error(`${fila.patente}: se cargó el auto pero ${fallidas} de sus fotos no subieron`)
    }
  }
  return nuevos
}

/* Borra uno o varios autos (con sus fotos). De a 100 por pedido. */
export async function eliminarAutos(ids) {
  if (DEMO) {
    const { eliminarDemo } = await import('./demo')
    return ids.forEach(eliminarDemo)
  }
  for (let i = 0; i < ids.length; i += 100) {
    await pedir(`/api/autos?ids=${ids.slice(i, i + 100).join(',')}`, { method: 'DELETE' })
  }
}

export async function cambiarEstadoAuto(id, estado) {
  if (DEMO) return (await import('./demo')).estadoDemo(id, estado)
  await pedir(`/api/autos?id=${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) })
}

/* Cambia el estado de varios autos a la vez. De a 100 por pedido. */
export async function cambiarEstadoAutos(ids, estado) {
  if (DEMO) {
    const { estadoDemo } = await import('./demo')
    return ids.forEach((id) => estadoDemo(id, estado))
  }
  for (let i = 0; i < ids.length; i += 100) {
    await pedir(`/api/autos?ids=${ids.slice(i, i + 100).join(',')}`, { method: 'PATCH', body: JSON.stringify({ estado }) })
  }
}

/* Edita los datos de un auto. Devuelve la fila ya guardada. */
export async function editarAuto(id, cambios) {
  if (DEMO) return (await import('./demo')).editarDemo(id, cambios)
  return pedir(`/api/autos?id=${id}`, { method: 'PATCH', body: JSON.stringify(cambios) })
}
