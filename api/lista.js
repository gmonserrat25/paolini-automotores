/* Función de Vercel: recibe la lista de stock en PDF (o el texto de una
   planilla que el panel no supo leer solo) y devuelve los autos. Sólo responde
   a quien tiene sesión iniciada en el panel. Usa ANTHROPIC_API_KEY, como
   reconocer.js. */

import { exigirSesion } from './_comun.js'
import { leerListaConIA } from './_lista.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!exigirSesion(req, res)) return

  try {
    return res.status(200).json(await leerListaConIA(req.body, process.env.ANTHROPIC_API_KEY))
  } catch (e) {
    return res.status(e.status ?? 502).json({ error: e.message })
  }
}
