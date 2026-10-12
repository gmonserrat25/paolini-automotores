import { achicar } from './carga'
import { supabase } from './acceso'

/* Los autos viven en la tabla `autos` de Supabase y las fotos en el bucket
   privado `autos` (ver supabase/001_autos.sql). Todo pasa por la sesión del
   dueño: sin sesión la base no devuelve nada. */

const BUCKET = 'autos'
const VIGENCIA_ENLACES = 60 * 60 // segundos

const falla = (error, que) => {
  throw new Error(`${que}: ${error.message}`)
}

const normPatente = (p) => p.replace(/[^A-Za-z0-9]/g, '').toLowerCase()

/* Enlaces temporales a las fotos: el bucket es privado. */
async function firmar(rutas) {
  const lista = [...new Set(rutas.filter(Boolean))]
  if (!lista.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(lista, VIGENCIA_ENLACES)
  if (error) falla(error, 'No se pudieron firmar las fotos')
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}

/* Todos los autos, ya con el enlace de su foto. */
export async function listarAutos() {
  const { data, error } = await supabase.from('autos').select('*').order('creado', { ascending: true })
  if (error) falla(error, 'No se pudieron leer los autos')
  const enlaces = await firmar(data.map((a) => a.foto_path))
  return data.map((a) => ({ ...a, foto: enlaces[a.foto_path] ?? null }))
}

/* Sube la foto (achicada) y crea la fila. `cargas` es una lista de
   { fila, archivo, metodo } con la fila del Excel y el archivo de la foto. */
export async function agregarAutos(cargas) {
  const nuevos = []
  for (const { fila, archivo, metodo } of cargas) {
    const ruta = `${normPatente(fila.patente)}.jpg`
    const { error: errFoto } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, await achicar(archivo, 1600, 'blob'), { upsert: true, contentType: 'image/jpeg' })
    if (errFoto) falla(errFoto, `No se pudo subir la foto de ${fila.patente}`)

    const { data, error } = await supabase
      .from('autos')
      .insert({
        patente: fila.patente,
        marca: fila.marca,
        modelo: fila.modelo,
        tipo: fila.tipo ?? 'Auto',
        combustible: fila.combustible ?? 'Nafta',
        color: fila.color,
        anio: fila.anio,
        km: fila.km,
        precio: fila.precio,
        foto_path: ruta,
        reconocido_por: metodo,
      })
      .select()
      .single()
    if (error) {
      /* 23505 = la patente ya existe. */
      falla(error, error.code === '23505' ? `La patente ${fila.patente} ya está cargada` : 'No se pudo guardar el auto')
    }
    nuevos.push(data)
  }
  const enlaces = await firmar(nuevos.map((a) => a.foto_path))
  return nuevos.map((a) => ({ ...a, foto: enlaces[a.foto_path] ?? null }))
}

/* Borra el auto y, después, su foto del bucket. Primero la fila: si falla, no
   se toca nada; si fallara sólo el borrado de la foto, el auto igual queda
   eliminado (la foto sobrante no se ve en ningún lado). */
export async function eliminarAuto(id, fotoPath) {
  const { error } = await supabase.from('autos').delete().eq('id', id)
  if (error) falla(error, 'No se pudo eliminar el auto')
  if (fotoPath) await supabase.storage.from(BUCKET).remove([fotoPath])
}

export async function cambiarEstadoAuto(id, estado) {
  const { error } = await supabase.from('autos').update({ estado }).eq('id', id)
  if (error) falla(error, 'No se pudo guardar el estado')
}
