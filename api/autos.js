/* Los autos de la concesionaria.

   GET            público: lo que muestra el sitio (sin patente, sin vendidos).
   GET ?vista=panel   con sesión: todos, con todos los datos.
   POST           con sesión: crea un auto con su foto (la sube a Vercel Blob).
   PATCH ?id=     con sesión: cambia el estado.
   DELETE ?id=    con sesión: borra el auto y su foto. */

import { del, put } from '@vercel/blob'
import { esquema, exigirSesion, sql } from './_comun.js'

const ESTADOS = ['disponible', 'reservado', 'vendido']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FOTO_MAX = 2_500_000 // caracteres del data URL (~1,8 MB de imagen)

/* bigint llega como texto: se pasa a número para el navegador. */
const fila = (a) => ({ ...a, precio: a.precio == null ? null : Number(a.precio) })

const texto = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null)
const entero = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null)

export default async function handler(req, res) {
  await esquema()

  if (req.method === 'GET') {
    if (req.query.vista === 'panel') {
      if (!exigirSesion(req, res)) return
      res.setHeader('Cache-Control', 'no-store')
      const autos = await sql`select * from autos order by creado asc`
      return res.status(200).json(autos.map((a) => ({ ...fila(a), foto: a.foto_url })))
    }
    /* Público: se refresca solo cada medio minuto, sin pegarle a la base en
       cada visita. */
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300')
    const autos = await sql`
      select id, marca, modelo, tipo, combustible, anio, km, precio, foto_url as foto
      from autos where estado <> 'vendido' order by creado asc`
    return res.status(200).json(autos.map(fila))
  }

  if (!exigirSesion(req, res)) return
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const patente = texto(b.patente, 12)?.toUpperCase()
    const marca = texto(b.marca, 60)
    const modelo = texto(b.modelo, 80)
    if (!patente || !marca || !modelo) return res.status(400).json({ error: 'Faltan patente, marca o modelo' })
    if (typeof b.foto !== 'string' || !b.foto.startsWith('data:image/jpeg;base64,') || b.foto.length > FOTO_MAX) {
      return res.status(400).json({ error: 'La foto tiene que ser un JPG de menos de 1,8 MB' })
    }

    const [existe] = await sql`
      select 1 as x from autos where regexp_replace(upper(patente), '[^A-Z0-9]', '', 'g') = ${patente.replace(/[^A-Z0-9]/g, '')}`
    if (existe) return res.status(409).json({ error: `La patente ${patente} ya está cargada` })

    const archivo = patente.replace(/[^A-Z0-9]/g, '').toLowerCase()
    const foto = await put(`autos/${archivo}.jpg`, Buffer.from(b.foto.split(',')[1], 'base64'), {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: true,
    })
    try {
      const [auto] = await sql`
        insert into autos (patente, marca, modelo, tipo, combustible, color, anio, km, precio, foto_url, reconocido_por)
        values (${patente}, ${marca}, ${modelo}, ${texto(b.tipo, 40) ?? 'Auto'}, ${texto(b.combustible, 40) ?? 'Nafta'},
                ${texto(b.color, 40)}, ${entero(b.anio, 1950, 2100)}, ${entero(b.km, 0, 5_000_000)},
                ${entero(b.precio, 0, 1_000_000_000_000)}, ${foto.url}, ${texto(b.metodo, 40)})
        returning *`
      return res.status(201).json({ ...fila(auto), foto: auto.foto_url })
    } catch (e) {
      await del(foto.url).catch(() => {})
      throw e
    }
  }

  const id = String(req.query.id ?? '')
  if (!UUID.test(id)) return res.status(400).json({ error: 'Falta el id' })

  if (req.method === 'PATCH') {
    const estado = req.body?.estado
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado desconocido' })
    const [auto] = await sql`update autos set estado = ${estado} where id = ${id} returning id`
    return auto ? res.status(200).json({ id, estado }) : res.status(404).json({ error: 'No existe ese auto' })
  }

  if (req.method === 'DELETE') {
    const [auto] = await sql`delete from autos where id = ${id} returning foto_url`
    if (!auto) return res.status(404).json({ error: 'No existe ese auto' })
    /* La fila se borra primero: si fallara sólo el borrado de la foto, el auto
       igual queda eliminado y la foto sobrante no se ve en ningún lado. */
    if (auto.foto_url) await del(auto.foto_url).catch(() => {})
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
