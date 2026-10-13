/* Función de Vercel: recibe una foto y devuelve qué auto es y qué patente se
   lee. Sólo responde a quien tiene sesión iniciada en el panel.

   Variable de entorno del proyecto de Vercel (nunca en el código):
   - OPENAI_API_KEY        la key del servicio de visión
   (y SESSION_SECRET, que comparten todas las funciones: ver _comun.js).
   Sin OPENAI_API_KEY responde 503 y el panel deja asignar el auto a mano. */

import { exigirSesion } from './_comun.js'
import { reconocerAuto } from './_reconocer.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!exigirSesion(req, res)) return

  try {
    return res.status(200).json(await reconocerAuto(req.body?.imagen, process.env.OPENAI_API_KEY))
  } catch (e) {
    return res.status(e.status ?? 502).json({ error: e.message })
  }
}
