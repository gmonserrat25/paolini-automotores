/* El registro de la carga de autos: una fila por cada foto que no se pudo
   reconocer (o que quedó dudosa para revisar), con lo que vio la IA y por qué.

   POST           con sesión: guarda un lote de renglones { renglones: [...] }.
   GET            con sesión: los últimos 200, del más nuevo al más viejo. */

import { esquema, exigirSesion, sql } from './_comun.js'

const MAX_LOTE = 100
const RESULTADOS = ['sin reconocer', 'dudosa']

const texto = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
/* Sólo objetos o listas chicos: es lo que la pantalla manda, pero no se confía. */
const json = (v) => (v && typeof v === 'object' && JSON.stringify(v).length <= 4000 ? JSON.stringify(v) : null)

export default async function handler(req, res) {
  if (!exigirSesion(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  await esquema()

  if (req.method === 'GET') {
    return res.status(200).json(await sql`select * from registro_carga order by creado desc limit 200`)
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const lista = Array.isArray(req.body?.renglones) ? req.body.renglones.slice(0, MAX_LOTE) : []
  const validos = lista.filter((r) => RESULTADOS.includes(r?.resultado) && texto(r?.motivo, 300))
  for (const r of validos) {
    await sql`
      insert into registro_carga (archivo, excel, resultado, motivo, visto, candidatos, asignado)
      values (${texto(r.archivo, 200)}, ${texto(r.excel, 200)}, ${r.resultado}, ${texto(r.motivo, 300)},
              ${json(r.visto)}::jsonb, ${json(r.candidatos)}::jsonb, ${texto(r.asignado, 40)})`
  }
  return res.status(201).json({ guardados: validos.length })
}
