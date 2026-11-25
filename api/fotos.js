/* Las fotos extra de cada auto (interior, detalles, trasera), para los
   collages del asistente de posts. La foto principal sigue en
   autos.foto_url; éstas van en autos.fotos como [{ url, tipo }].

   POST   ?id=          con sesión: { foto: dataURL JPG } → la clasifica con
                        Claude, la sube a Vercel Blob y la agrega.
   PATCH  ?id=          con sesión: { url, tipo } → corrige el tipo a mano.
   DELETE ?id=&url=     con sesión: saca la foto y la borra de Blob.
   Las tres devuelven la lista de fotos del auto ya actualizada. */

import { del, put } from '@vercel/blob'
import { esquema, exigirSesion, sql } from './_comun.js'
import { clasificarFoto, TIPOS } from './_clasificar.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_FOTOS = 8

export default async function handler(req, res) {
  if (!exigirSesion(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  await esquema()

  const id = String(req.query.id ?? '')
  if (!UUID.test(id)) return res.status(400).json({ error: 'Falta el id del auto' })
  const [auto] = await sql`select patente, fotos from autos where id = ${id}`
  if (!auto) return res.status(404).json({ error: 'No existe ese auto' })
  const fotos = Array.isArray(auto.fotos) ? auto.fotos : []

  if (req.method === 'POST') {
    if (fotos.length >= MAX_FOTOS) return res.status(400).json({ error: `Ya tiene ${MAX_FOTOS} fotos extra` })
    const imagen = req.body?.foto
    let tipo
    try {
      tipo = await clasificarFoto(imagen, process.env.ANTHROPIC_API_KEY)
    } catch (e) {
      /* Sin la IA igual se guarda: el tipo se corrige a mano. */
      if (e.status === 400) return res.status(400).json({ error: e.message })
      tipo = 'detalle'
    }
    const archivo = `${auto.patente.replace(/[^A-Za-z0-9]/g, '').toLowerCase()}-${tipo}`
    const subida = await put(`autos/extra/${archivo}.jpg`, Buffer.from(imagen.split(',')[1], 'base64'), {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: true,
    })
    const nueva = { url: subida.url, tipo }
    const [fila] = await sql`
      update autos set fotos = coalesce(fotos, '[]'::jsonb) || ${JSON.stringify([nueva])}::jsonb
      where id = ${id} returning fotos`
    return res.status(201).json({ fotos: fila.fotos })
  }

  const url = req.method === 'DELETE' ? String(req.query.url ?? '') : req.body?.url
  if (!fotos.some((f) => f.url === url)) return res.status(404).json({ error: 'Esa foto no es de este auto' })

  if (req.method === 'PATCH') {
    const tipo = req.body?.tipo
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo de foto desconocido' })
    const nuevas = fotos.map((f) => (f.url === url ? { ...f, tipo } : f))
    const [fila] = await sql`update autos set fotos = ${JSON.stringify(nuevas)}::jsonb where id = ${id} returning fotos`
    return res.status(200).json({ fotos: fila.fotos })
  }

  if (req.method === 'DELETE') {
    const nuevas = fotos.filter((f) => f.url !== url)
    const [fila] = await sql`update autos set fotos = ${JSON.stringify(nuevas)}::jsonb where id = ${id} returning fotos`
    await del(url).catch(() => {})
    return res.status(200).json({ fotos: fila.fotos })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
