/* Función de Vercel: recibe una foto y devuelve qué auto es y qué patente se
   lee. La key va en la variable de entorno OPENAI_API_KEY del proyecto de
   Vercel (nunca en el código ni en el navegador). Sin ella responde 503 y el
   panel deja asignar el auto a mano.

   OJO: el panel todavía no tiene login, así que cualquiera que sepa la URL
   podría gastar crédito. Antes de publicarlo hay que ponerle acceso. */

const MODELO = 'gpt-4.1-mini'
const LIMITE = 4_000_000 // caracteres del data URL (~3 MB de imagen)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
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
