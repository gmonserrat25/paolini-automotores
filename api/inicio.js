/* GET /  → la home con el HTML ya escrito (vercel.json manda la raíz acá).

   El index.html que compila Vite se guarda como `plantilla.html` (ver
   vite.config.js) y esta función lo entrega con dos cosas metidas adentro: la
   lista de autos del momento y sus datos estructurados. Así un buscador o una
   IA que no ejecuta JavaScript lee el stock real, y el navegador de siempre
   recibe lo mismo y arranca React encima.

   GET /?panel=1  → la misma plantilla sin el bloque; es lo que sirve /panel.

   Si la base falla, la página sale igual, sin la lista de autos (React la
   pide de nuevo a /api/autos). Es la home del negocio: no puede caerse por
   el stock. */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { esquema, sql } from './_comun.js'
import { armarPagina, MARCA_FIN, MARCA_INICIO } from './_estatico.js'

async function leerPlantilla(req) {
  try {
    return await readFile(join(process.cwd(), 'dist', 'plantilla.html'), 'utf8')
  } catch {
    /* Si el empaquetado no trajo el archivo, se pide al propio sitio. */
    const r = await fetch(`https://${req.headers.host}/plantilla.html`)
    if (!r.ok) throw new Error(`plantilla ${r.status}`)
    return r.text()
  }
}

/* La misma consulta que GET /api/autos: sin patente y sin vendidos. */
async function autosPublicos() {
  await esquema()
  const autos = await sql`
    select id, marca, modelo, tipo, combustible, anio, km, precio, estado, foto_url as foto
    from autos where estado <> 'vendido' order by creado asc`
  return autos.map((a) => ({ ...a, precio: a.precio == null ? null : Number(a.precio) }))
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end()

  let plantilla
  try {
    plantilla = await leerPlantilla(req)
  } catch (e) {
    return res.status(500).send(`No se pudo leer la página: ${e.message}`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (req.query.panel) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600')
    const a = plantilla.indexOf(MARCA_INICIO)
    const b = plantilla.indexOf(MARCA_FIN)
    return res.status(200).send(a === -1 || b === -1 ? plantilla : plantilla.slice(0, a) + plantilla.slice(b + MARCA_FIN.length))
  }

  let autos = []
  try {
    autos = await autosPublicos()
  } catch (e) {
    console.error('inicio: sin stock en el HTML', e.message)
  }

  /* Un minuto de caché y hasta cinco sirviendo lo anterior mientras se
     renueva: el HTML de los buscadores no hace falta que sea al segundo (las
     tarjetas que ve una persona se refrescan solas cada 5 s desde /api/autos). */
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return res.status(200).send(armarPagina(plantilla, autos))
}
