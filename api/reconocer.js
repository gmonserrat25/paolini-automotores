/* Función de Vercel: recibe una foto y devuelve qué auto es y qué patente se
   lee. Sólo responde a quien tiene sesión iniciada en el panel.

   Variables de entorno del proyecto de Vercel (nunca en el código):
   - OPENAI_API_KEY        la key del servicio de visión
   - SUPABASE_URL          la misma URL del proyecto de Supabase
   - SUPABASE_ANON_KEY     la clave "anon" (pública) de Supabase
   Sin OPENAI_API_KEY responde 503 y el panel deja asignar el auto a mano. */

import { reconocerAuto } from './_reconocer.js'

/* El pase de la sesión se verifica con Supabase: si no es de un usuario real,
   no se gasta ni un centavo. */
async function usuarioDe(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  return r.ok ? r.json() : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!(await usuarioDe(req))) return res.status(401).json({ error: 'Sin sesión' })

  try {
    return res.status(200).json(await reconocerAuto(req.body?.imagen, process.env.OPENAI_API_KEY))
  } catch (e) {
    return res.status(e.status ?? 502).json({ error: e.message })
  }
}
