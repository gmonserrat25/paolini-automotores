/* Los autos de la concesionaria.

   GET            público: lo que muestra el sitio (sin patente, sin vendidos).
   GET ?vista=panel   con sesión: todos, con todos los datos.
   POST           con sesión: crea un auto con su foto (la sube a Vercel Blob).
   PATCH ?id=     con sesión: edita los datos del auto (y su estado).
   DELETE ?id=    con sesión: borra el auto y su foto.
   DELETE ?ids=a,b,c  con sesión: borra varios autos y sus fotos de una vez (hasta 100). */

import { del, put } from '@vercel/blob'
import { esquema, exigirSesion, sql } from './_comun.js'

const ESTADOS = ['disponible', 'reservado', 'vendido']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_LOTE = 100
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
    /* Público: se refresca solo cada 5 segundos, así lo que los dueños cargan
       o borran se ve enseguida, sin pegarle a la base en cada visita. Sin
       stale-while-revalidate: no se sirve nunca una lista vieja. */
    res.setHeader('Cache-Control', 'public, s-maxage=5')
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

  /* Borrado en lote: un solo pedido para varios autos. */
  if (req.method === 'DELETE' && req.query.ids != null) {
    const ids = [...new Set(String(req.query.ids).split(',').filter(Boolean))]
    if (!ids.length || ids.length > MAX_LOTE || !ids.every((i) => UUID.test(i))) {
      return res.status(400).json({ error: `Pasá entre 1 y ${MAX_LOTE} ids válidos` })
    }
    const borrados = await sql`
      delete from autos where id = any(string_to_array(${ids.join(',')}, ',')::uuid[]) returning foto_url`
    const fotos = borrados.map((a) => a.foto_url).filter(Boolean)
    if (fotos.length) await del(fotos).catch(() => {})
    return res.status(200).json({ borrados: borrados.length })
  }

  const id = String(req.query.id ?? '')
  if (!UUID.test(id)) return res.status(400).json({ error: 'Falta el id' })

  if (req.method === 'PATCH') {
    const b = req.body ?? {}
    const [actual] = await sql`select * from autos where id = ${id}`
    if (!actual) return res.status(404).json({ error: 'No existe ese auto' })

    /* Se valida cada campo que vino; lo que no vino queda como estaba. */
    const nuevo = { ...actual }
    const obligatorio = { patente: 12, marca: 60, modelo: 80, tipo: 40, combustible: 40 }
    for (const [k, max] of Object.entries(obligatorio)) {
      if (!(k in b)) continue
      const v = texto(b[k], max)
      if (!v) return res.status(400).json({ error: `${k} no puede quedar vacío` })
      nuevo[k] = k === 'patente' ? v.toUpperCase() : v
    }
    if ('color' in b) {
      if (b.color != null && !texto(b.color, 40)) return res.status(400).json({ error: 'color inválido' })
      nuevo.color = b.color == null ? null : texto(b.color, 40)
    }
    const numeros = { anio: [1950, 2100], km: [0, 5_000_000], precio: [0, 1_000_000_000_000] }
    for (const [k, [min, max]] of Object.entries(numeros)) {
      if (!(k in b)) continue
      if (b[k] != null && entero(b[k], min, max) == null) return res.status(400).json({ error: `${k} inválido` })
      nuevo[k] = b[k] ?? null
    }
    if ('estado' in b) {
      if (!ESTADOS.includes(b.estado)) return res.status(400).json({ error: 'Estado desconocido' })
      nuevo.estado = b.estado
    }

    if (nuevo.patente !== actual.patente) {
      const [otro] = await sql`
        select 1 as x from autos
        where id <> ${id} and regexp_replace(upper(patente), '[^A-Z0-9]', '', 'g') = ${nuevo.patente.replace(/[^A-Z0-9]/g, '')}`
      if (otro) return res.status(409).json({ error: `La patente ${nuevo.patente} ya está cargada` })
    }

    const [auto] = await sql`
      update autos set patente = ${nuevo.patente}, marca = ${nuevo.marca}, modelo = ${nuevo.modelo},
        tipo = ${nuevo.tipo}, combustible = ${nuevo.combustible}, color = ${nuevo.color}, anio = ${nuevo.anio},
        km = ${nuevo.km}, precio = ${nuevo.precio}, estado = ${nuevo.estado}
      where id = ${id} returning *`
    return res.status(200).json({ ...fila(auto), foto: auto.foto_url })
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
