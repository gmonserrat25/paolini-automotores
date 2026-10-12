/* Función de Vercel: recibe una foto y devuelve qué auto es y qué patente se
   lee. Sólo responde a quien tiene sesión iniciada en el panel.

   Variables de entorno del proyecto de Vercel (nunca en el código):
   - OPENAI_API_KEY        la key del servicio de visión
   - SUPABASE_URL          la misma URL del proyecto de Supabase
   - SUPABASE_ANON_KEY     la clave "anon" (pública) de Supabase
   Sin OPENAI_API_KEY responde 503 y el panel deja asignar el auto a mano. */

const MODELO = 'gpt-4.1-mini'
const LIMITE = 4_000_000 // caracteres del data URL (~3 MB de imagen)

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

  const key = process.env.OPENAI_API_KEY
  if (!key) return res.status(503).json({ error: 'Falta OPENAI_API_KEY' })

  const { imagen } = req.body ?? {}
  if (typeof imagen !== 'string' || !imagen.startsWith('data:image/') || imagen.length > LIMITE) {
    return res.status(400).json({ error: 'Imagen inválida o demasiado grande' })
  }

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Foto de un auto a la venta en Argentina. Devolvé JSON con: patente (la que se lea ' +
                "en la chapa, formato 'AB 123 CD' o 'ABC 123'; null si no se ve o no estás seguro), " +
                'marca, modelo (y versión si se distingue) y color (en español, una palabra). ' +
                'No inventes la patente.',
            },
            { type: 'image_url', image_url: { url: imagen, detail: 'high' } },
          ],
        },
      ],
    }),
  })
  if (!r.ok) return res.status(502).json({ error: `OpenAI respondió ${r.status}` })

  const { choices } = await r.json()
  const { patente, marca, modelo, color } = JSON.parse(choices[0].message.content)
  return res.status(200).json({ patente, marca, modelo, color })
}
