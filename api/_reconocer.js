/* La parte de reconocer.js que habla con el modelo de visión. Va aparte (el
   guión bajo hace que Vercel no la publique como función) para que la usen
   la función de Vercel y el endpoint local de la demo (vite.config.js). */

import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
export const LIMITE = 4_000_000 // caracteres del data URL (~3 MB de imagen)

const PROMPT =
  'Foto de un auto a la venta en Argentina. Devolvé JSON con: patente (la que se lea ' +
  "en la chapa, formato 'AB 123 CD' o 'ABC 123'; null si no se ve o no estás seguro), " +
  'marca, modelo (y versión si se distingue), color (en español, una palabra) y vista ' +
  '(qué muestra la foto: "frente", "lateral", "trasera", "interior", "motor" u "otra"). ' +
  'No inventes la patente. Respondé sólo con el JSON: {"patente", "marca", "modelo", "color", "vista"}.'

const SIN_DATOS = { patente: null, marca: null, modelo: null, color: null, vista: null }

const falla = (mensaje, status) => Object.assign(new Error(mensaje), { status })

/* Devuelve { patente, marca, modelo, color, vista } de la foto, o lanza un Error con
   `.status` listo para responder. Si el modelo no puede leer la chapa devuelve
   `patente: null` (nunca se inventa una: así el cruce con el Excel cae a
   modelo y color en vez de seguir una patente falsa). */
export async function reconocerAuto(imagen, key) {
  if (!key) throw falla('Falta ANTHROPIC_API_KEY', 503)
  const partes = typeof imagen === 'string' && imagen.length <= LIMITE
    ? imagen.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s)
    : null
  if (!partes) throw falla('Imagen inválida o demasiado grande', 400)

  let respuesta
  try {
    respuesta = await new Anthropic({ apiKey: key, maxRetries: 1, timeout: 30_000 }).messages.create({
      model: MODELO,
      max_tokens: 1024,
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

  /* El modelo puede negarse a responder: se trata como una foto sin datos. */
  if (respuesta.stop_reason === 'refusal') return SIN_DATOS

  const texto = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const i = texto.indexOf('{')
  const j = texto.lastIndexOf('}')
  try {
    const { patente, marca, modelo, color, vista } = JSON.parse(texto.slice(i, j + 1))
    return { patente: patente ?? null, marca: marca ?? null, modelo: modelo ?? null, color: color ?? null, vista: vista ?? null }
  } catch {
    throw falla('La respuesta del modelo no era JSON', 502)
  }
}
