/* La parte de lista.js que habla con el modelo. Va aparte (el guión bajo hace
   que Vercel no la publique como función) para que la use también el endpoint
   local de la demo (vite.config.js).

   Lee la lista de stock cuando el panel no puede leerla solo: un PDF (lo que
   exporta Google Sheets o Numbers desde el celular) o el texto de una planilla
   con títulos que no reconoce. Devuelve los autos tal cual figuran; el panel
   después los normaliza con las mismas reglas que un Excel. */

import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
export const LIMITE_PDF = 4_000_000 // caracteres en base64 (~3 MB de PDF; Vercel corta en 4,5 MB)
export const LIMITE_TEXTO = 400_000

const PROMPT =
  'Es la lista de stock de una concesionaria de autos usados de Argentina. Pasá cada vehículo ' +
  'a un objeto con: marca, modelo (con la versión), precio, anio, patente, km y color. ' +
  'La patente puede figurar como "dominio" o "chapa"; copiala tal cual (por ejemplo "AA 436 UM"). ' +
  'precio y km son números enteros: "$10.900.000,00" es 10900000 y "145.600" es 145600. ' +
  'Lo que no figure va null; no completes ni inventes datos, sobre todo la patente. ' +
  'Ignorá títulos, filas vacías, totales, links y columnas que no sean esas. ' +
  'Incluí todos los vehículos, también los que no tienen patente o precio.'

const texto = { type: ['string', 'null'] }
const entero = { type: ['integer', 'null'] }
const ESQUEMA = {
  type: 'object',
  properties: {
    autos: {
      type: 'array',
      items: {
        type: 'object',
        properties: { marca: texto, modelo: texto, precio: entero, anio: entero, patente: texto, km: entero, color: texto },
        required: ['marca', 'modelo', 'precio', 'anio', 'patente', 'km', 'color'],
        additionalProperties: false,
      },
    },
  },
  required: ['autos'],
  additionalProperties: false,
}

const falla = (mensaje, status) => Object.assign(new Error(mensaje), { status })

/* `entrada` es { pdf: base64 } o { texto: "csv" }. Devuelve { autos: [...] } o
   lanza un Error con `.status` listo para responder. */
export async function leerListaConIA(entrada, key) {
  if (!key) throw falla('Falta ANTHROPIC_API_KEY', 503)
  let contenido
  if (typeof entrada?.pdf === 'string' && entrada.pdf.length <= LIMITE_PDF && /^[A-Za-z0-9+/=]+$/.test(entrada.pdf)) {
    contenido = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: entrada.pdf } }
  } else if (typeof entrada?.texto === 'string' && entrada.texto.trim() && entrada.texto.length <= LIMITE_TEXTO) {
    contenido = { type: 'text', text: `<planilla>\n${entrada.texto}\n</planilla>` }
  } else {
    throw falla('Archivo inválido o demasiado grande', 400)
  }

  let respuesta
  try {
    respuesta = await new Anthropic({ apiKey: key, maxRetries: 1, timeout: 120_000 }).beta.messages.create({
      model: MODELO,
      max_tokens: 32_000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [{ role: 'user', content: [contenido, { type: 'text', text: PROMPT }] }],
    })
  } catch (e) {
    throw falla(`Anthropic respondió ${e.status ?? 'con un error'}`, 502)
  }

  if (respuesta.stop_reason === 'refusal') throw falla('El modelo no quiso leer la lista', 422)
  if (respuesta.stop_reason === 'max_tokens') throw falla('La lista es demasiado larga para leerla de una vez', 413)

  const salida = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  try {
    const { autos } = JSON.parse(salida)
    if (!Array.isArray(autos)) throw new Error()
    return { autos }
  } catch {
    throw falla('La respuesta del modelo no era JSON', 502)
  }
}
