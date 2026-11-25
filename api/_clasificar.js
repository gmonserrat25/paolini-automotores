/* Mira una foto extra de un auto y dice de qué es (exterior, interior,
   detalle o trasera), para que el asistente de posts sepa qué va en cada
   lugar del collage. Va aparte (el guión bajo hace que Vercel no la publique
   como función) para que la use también el endpoint local de la demo
   (vite.config.js). */

import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
export const TIPOS = ['exterior', 'interior', 'detalle', 'trasera']
export const LIMITE = 2_500_000 // caracteres del data URL (~1,8 MB de imagen)

const PROMPT =
  'Foto de un auto a la venta. Respondé con una sola palabra: "exterior" si se ve el auto ' +
  'entero o casi entero de afuera (de frente, de costado o de 3/4); "trasera" si se ve sobre ' +
  'todo la cola o las luces traseras; "interior" si es el tablero, el volante, los asientos o el baúl ' +
  'por dentro; "detalle" si es un primer plano de una parte de afuera (faro, parrilla, llanta, logo).'

const falla = (mensaje, status) => Object.assign(new Error(mensaje), { status })

/* Devuelve el tipo de la foto. Si el modelo no responde algo de la lista,
   la foto se toma como "detalle" (el lugar menos comprometido del collage). */
export async function clasificarFoto(imagen, key) {
  if (!key) throw falla('Falta ANTHROPIC_API_KEY', 503)
  const partes = typeof imagen === 'string' && imagen.length <= LIMITE
    ? imagen.match(/^data:(image\/jpeg);base64,(.+)$/s)
    : null
  if (!partes) throw falla('La foto tiene que ser un JPG de menos de 1,8 MB', 400)

  let respuesta
  try {
    respuesta = await new Anthropic({ apiKey: key, maxRetries: 1, timeout: 30_000 }).messages.create({
      model: MODELO,
      max_tokens: 20,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: partes[1], data: partes[2] } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    })
  } catch (e) {
    throw falla(`Anthropic respondió ${e.status ?? 'con un error'}`, 502)
  }
  const texto = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('').toLowerCase()
  return TIPOS.find((t) => texto.includes(t)) ?? 'detalle'
}
