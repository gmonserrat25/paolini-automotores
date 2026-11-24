/* Función de Vercel: el asistente de posts de Instagram del panel. Sólo
   responde a quien tiene sesión iniciada. Usa ANTHROPIC_API_KEY, como
   reconocer.js y lista.js. */

import { exigirSesion } from './_comun.js'
import { pedirPiezas } from './_asistente.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!exigirSesion(req, res)) return

  try {
    return res.status(200).json(await pedirPiezas(req.body, process.env.ANTHROPIC_API_KEY))
  } catch (e) {
    return res.status(e.status ?? 502).json({ error: e.message })
  }
}
