/* Las entregas: la foto con quien se llevó el auto.

   GET            público: las últimas, de la más nueva a la más vieja.
   POST           con sesión: crea una entrega con su foto (la sube a Vercel Blob).
   DELETE ?id=    con sesión: borra la entrega y su foto. */

import { del, put } from '@vercel/blob'
import { esquema, exigirSesion, sql } from './_comun.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FOTO_MAX = 2_500_000 // caracteres del data URL (~1,8 MB de imagen)
const PUBLICAS = 9 // las que muestra el sitio: una grande y ocho chicas

const texto = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null)

export default async function handler(req, res) {
  await esquema()

  if (req.method === 'GET') {
    if (req.query.vista === 'panel') {
      if (!exigirSesion(req, res)) return
      res.setHeader('Cache-Control', 'no-store')
      const todas = await sql`
        select id, cliente, plural, vehiculo, foto_url as foto, creado from entregas order by creado desc`
      return res.status(200).json(todas)
    }
    /* Igual que los autos: se refresca sola cada 5 segundos. */
    res.setHeader('Cache-Control', 'public, s-maxage=5')
    const entregas = await sql`
      select id, cliente, plural, vehiculo, foto_url as foto
      from entregas order by creado desc limit ${PUBLICAS}`
    return res.status(200).json(entregas)
  }

  if (!exigirSesion(req, res)) return
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const cliente = texto(b.cliente, 60)
    const vehiculo = texto(b.vehiculo, 80)
    if (!cliente || !vehiculo) return res.status(400).json({ error: 'Faltan el nombre o el vehículo' })
    if (typeof b.foto !== 'string' || !b.foto.startsWith('data:image/jpeg;base64,') || b.foto.length > FOTO_MAX) {
      return res.status(400).json({ error: 'La foto tiene que ser un JPG de menos de 1,8 MB' })
    }

    const foto = await put('entregas/entrega.jpg', Buffer.from(b.foto.split(',')[1], 'base64'), {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: true,
    })
    try {
      const [entrega] = await sql`
        insert into entregas (cliente, plural, vehiculo, foto_url)
        values (${cliente}, ${b.plural === true}, ${vehiculo}, ${foto.url})
        returning id, cliente, plural, vehiculo, foto_url as foto, creado`
      return res.status(201).json(entrega)
    } catch (e) {
      await del(foto.url).catch(() => {})
      throw e
    }
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id ?? '')
    if (!UUID.test(id)) return res.status(400).json({ error: 'Falta el id' })
    const [entrega] = await sql`delete from entregas where id = ${id} returning foto_url`
    if (!entrega) return res.status(404).json({ error: 'No existe esa entrega' })
    await del(entrega.foto_url).catch(() => {})
    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
