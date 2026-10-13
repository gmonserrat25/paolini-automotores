/* La parte de reconocer.js que habla con el modelo de visión. Va aparte (el
   guión bajo hace que Vercel no la publique como función) para que la usen
   la función de Vercel y el endpoint local de la demo (vite.config.js). */

const MODELO = 'gpt-4.1-mini'
export const LIMITE = 4_000_000 // caracteres del data URL (~3 MB de imagen)

/* Devuelve { patente, marca, modelo, color } de la foto, o lanza un Error con
   `.status` listo para responder. */
export async function reconocerAuto(imagen, key) {
  if (!key) throw Object.assign(new Error('Falta OPENAI_API_KEY'), { status: 503 })
  if (typeof imagen !== 'string' || !imagen.startsWith('data:image/') || imagen.length > LIMITE) {
    throw Object.assign(new Error('Imagen inválida o demasiado grande'), { status: 400 })
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
  if (!r.ok) throw Object.assign(new Error(`OpenAI respondió ${r.status}`), { status: 502 })

  const { choices } = await r.json()
  const { patente, marca, modelo, color } = JSON.parse(choices[0].message.content)
  return { patente, marca, modelo, color }
}
