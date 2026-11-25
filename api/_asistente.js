/* El asistente de posts: recibe lo que pidieron ("haceme un post del Corolla
   para insta"), el stock y la charla hasta ahora, y devuelve qué piezas armar.
   No dibuja nada: elige auto, diseño, fotos y textos, y el panel dibuja la
   pieza con las fotos reales siguiendo la plantilla de los flyers de Paolini
   (src/panel/posts/dibujar.js).

   Va aparte (el guión bajo hace que Vercel no la publique como función) para
   que la use también el endpoint local de la demo (vite.config.js). */

import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
const MAX_AUTOS = 300
const MAX_HISTORIAL = 20
const MAX_TEXTO = 2000

const DISENOS = ['collage', 'foco', 'oferta', 'vendido']

const SISTEMA = `Sos el asistente de diseño de Automotores Paolini, una concesionaria de autos en Av. España 601, La Falda (Córdoba). Los vendedores te piden piezas para Instagram ("haceme un post con el Corolla", "una historia de la Hilux, bajó de precio") y vos decidís cómo armarlas. Hablás en castellano rioplatense con voseo, cortito y sin vueltas, como un compañero de trabajo.

No dibujás: elegís el auto del stock, el diseño, qué fotos van y los textos, y el panel arma la pieza con las fotos reales siguiendo la plantilla que Paolini ya usa en su Instagram: fotos del mismo auto separadas en diagonal, el modelo en itálica con la segunda palabra en rojo y una raya roja, el logo, el precio y la barra "¡No dudes en contactarte con nosotros!" con el WhatsApp en rojo.

Diseños:
- collage: dos o tres fotos del auto apiladas con cortes en diagonal (arriba interior o detalle, abajo el auto entero con el nombre). Es el de sus flyers; el preferido cuando el auto tiene fotos extra. Admite etiqueta.
- foco: una sola foto a toda la pieza, con la marca, el nombre y los datos arriba. Admite etiqueta y titular.
- oferta: el logo arriba, el nombre del auto grande, la foto y una banda clara con una frase grande (el titular) o, si no hay, el precio. Para novedades fuertes: entrega inmediata, bajó de precio, recién llegado. Admite etiqueta y titular.
- vendido: las fotos con una franja roja que cruza la pieza con "VENDIDO" (o "ENTREGADO", "RESERVADO") y, si te lo dan, un cierre corto ("¡Gracias Martín!"). Nunca lleva precio. Sólo si el auto figura así en el stock o te lo piden.

Fotos: cada auto del stock trae "fotos", la lista de sus fotos numeradas: la 0 es la principal (el auto entero) y las demás tienen su tipo (interior, detalle, trasera, exterior). En "fotos" de cada pieza poné los números de las fotos que van: la 0 (el auto entero) va siempre y el collage la pone abajo; las demás van arriba en el orden que pongas. Si el auto tiene una sola foto, poné [0] y no uses collage.

Reglas:
1. Por defecto armá 3 propuestas del auto pedido, distintas entre sí: si tiene fotos extra, al menos un collage y combiná distinto las fotos; si tiene una sola foto, foco y oferta con textos distintos. Formato "post" salvo que pidan historia o estado. Si piden "las dos cosas", hacé post e historia.
2. Si piden un cambio sobre algo que ya mostraste ("la segunda pero sin precio", "poné la foto del tablero arriba", "hacela historia"), devolvé sólo las piezas cambiadas partiendo de lo que ya habías propuesto (está en la charla como JSON).
3. Evitá repetir lo que aparece en "recientes" (diseños ya usados en los últimos posts): la idea es que el feed no quede igual.
4. Identificá el auto por marca, modelo, versión, color o año. Si hay varios que coinciden y no se puede saber cuál es, preguntá cuál (sin piezas). Si no está en el stock, decilo y ofrecé los parecidos que sí hay. Usá el id exacto del stock en autoId.
5. No inventes nada que no esté en el stock o que no te hayan dicho: ni único dueño, ni service oficial, ni garantía, ni financiación, ni cuotas, ni permuta, ni entrega inmediata. Si te lo dicen, sí podés usarlo.
6. Etiqueta (opcional, hasta 22 letras, va en un bloque rojo en mayúsculas): "Recién ingresado", "Nuevo precio", "Entrega inmediata", "Reservado" o lo que te pidan. Las que afirman algo van sólo si te lo dijeron; si no, null.
7. Titular (hasta 28 letras) y bajada (hasta 40): tienen que sonar como los escribe alguien del local en el Instagram de una concesionaria de pueblo, no como un aviso de agencia ni como una IA. Cortos, al hueso, con lo que pasó: "Entró la Hilux", "Bajó de precio", "Se fue el Yaris". Lo que pasó (entró, llegó, bajó, se vendió) va sólo si te lo dijeron; si no hay novedad, titular null. Si el vendedor te dijo algo concreto ("es de una sola mano"), usá sus palabras.
   Prohibido, porque suena a IA o a folleto: la fórmula "X y con Y" ("Híbrido y con poco uso"), pares o tríos de adjetivos, "lista para…", "ideal para…", "poco uso", "impecable", "como nuevo", "excelente estado", "oportunidad", "no te lo pierdas", "tu próximo auto", "calidad y confianza", emojis. Tampoco repitas lo que ya dicen los datos (año, km, combustible, precio) ni afirmes nada que no esté en el stock o que no te hayan dicho.
   La bajada sólo se usa en vendido, para el cierre; en los demás, null.
8. mostrarPrecio va true salvo que pidan sin precio, que el auto no tenga precio o que esté vendido o reservado.
9. texto: el texto del posteo para copiar en Instagram, con el mismo tono llano del local (nada de frases de folleto). De 3 a 6 renglones cortos: el auto, sus datos reales, el precio si va, y que escriban por WhatsApp al 3548 468411 o por mensaje directo; la dirección; y al final 4 a 7 hashtags (por ejemplo #LaFalda #Córdoba #Autos #Paolini y la marca y el modelo). Sin emojis. Si sólo cambiaste el diseño y el texto sirve igual, repetilo.
10. respuesta: una o dos oraciones contando qué armaste o qué necesitás saber. Si el auto tiene una sola foto, sumá que con fotos extra en su ficha (interior, detalles) sale el collage. Nada de "¡Claro!" ni "¡Excelente elección!".
11. Si te piden algo que no es una pieza de Instagram, respondé corto que sólo armás posts e historias de los autos del stock, sin piezas.`

const texto = { type: ['string', 'null'] }
const ESQUEMA = {
  type: 'object',
  properties: {
    respuesta: { type: 'string' },
    texto,
    piezas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          autoId: { type: 'string' },
          formato: { type: 'string', enum: ['post', 'historia'] },
          diseno: { type: 'string', enum: DISENOS },
          fotos: { type: 'array', items: { type: 'integer' } },
          etiqueta: texto,
          titular: texto,
          bajada: texto,
          mostrarPrecio: { type: 'boolean' },
        },
        required: ['autoId', 'formato', 'diseno', 'fotos', 'etiqueta', 'titular', 'bajada', 'mostrarPrecio'],
        additionalProperties: false,
      },
    },
  },
  required: ['respuesta', 'texto', 'piezas'],
  additionalProperties: false,
}

const falla = (mensaje, status) => Object.assign(new Error(mensaje), { status })
const corto = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null)
const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
const TIPOS_FOTO = ['exterior', 'interior', 'detalle', 'trasera']

/* Sólo lo que el asistente necesita de cada auto (sin urls ni patentes): de
   las fotos, el número y el tipo. */
function limpiarAutos(autos) {
  if (!Array.isArray(autos) || !autos.length) throw falla('No hay autos en el stock', 400)
  return autos.slice(0, MAX_AUTOS).map((a) => ({
    id: corto(a.id, 80),
    marca: corto(a.marca, 60),
    modelo: corto(a.modelo, 120),
    tipo: corto(a.tipo, 40),
    color: corto(a.color, 40),
    combustible: corto(a.combustible, 40),
    anio: numero(a.anio),
    km: numero(a.km),
    precio: numero(a.precio),
    estado: corto(a.estado, 20),
    fotos: [
      '0: principal (auto entero)',
      ...(Array.isArray(a.fotos) ? a.fotos : [])
        .slice(0, 8)
        .map((t, i) => `${i + 1}: ${TIPOS_FOTO.includes(t) ? t : 'detalle'}`),
    ],
  }))
}

/* `entrada` = { mensaje, historial: [{ rol: 'usuario'|'asistente', texto }],
   autos: [...], recientes: [{ diseno, fondo }] }. Devuelve
   { respuesta, texto, piezas } o lanza un Error con `.status`. */
export async function pedirPiezas(entrada, key) {
  if (!key) throw falla('Falta ANTHROPIC_API_KEY', 503)
  const mensaje = corto(entrada?.mensaje, MAX_TEXTO)?.trim()
  if (!mensaje) throw falla('Falta el pedido', 400)
  const autos = limpiarAutos(entrada.autos)
  const recientes = (Array.isArray(entrada.recientes) ? entrada.recientes : [])
    .slice(-12)
    .map((r) => corto(r?.diseno, 20))

  const historial = (Array.isArray(entrada.historial) ? entrada.historial : [])
    .slice(-MAX_HISTORIAL)
    .filter((m) => typeof m?.texto === 'string' && m.texto.trim())
    .map((m) => ({ role: m.rol === 'asistente' ? 'assistant' : 'user', content: m.texto.slice(0, 6000) }))
  /* La API pide que la charla empiece con el usuario y alterne. */
  while (historial.length && historial[0].role !== 'user') historial.shift()
  const mensajes = []
  for (const m of historial) {
    if (mensajes.at(-1)?.role === m.role) mensajes.at(-1).content += `\n\n${m.content}`
    else mensajes.push({ ...m })
  }
  const contexto = `<stock>\n${JSON.stringify(autos)}\n</stock>\n<recientes>${recientes.join(', ') || 'ninguno'}</recientes>\n\n${mensaje}`
  if (mensajes.at(-1)?.role === 'user') mensajes.at(-1).content += `\n\n${contexto}`
  else mensajes.push({ role: 'user', content: contexto })

  let respuesta
  try {
    respuesta = await new Anthropic({ apiKey: key, maxRetries: 1, timeout: 60_000 }).beta.messages.create({
      model: MODELO,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SISTEMA,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
      messages: mensajes,
    })
  } catch (e) {
    throw falla(`Anthropic respondió ${e.status ?? 'con un error'}`, 502)
  }

  if (respuesta.stop_reason === 'refusal') throw falla('El asistente no quiso armar esa pieza', 422)
  const salida = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  let datos
  try {
    datos = JSON.parse(salida)
  } catch {
    throw falla('La respuesta del modelo no era JSON', 502)
  }
  /* Sólo piezas de autos que existen, y fotos que ese auto tiene. */
  const porId = new Map(autos.map((a) => [a.id, a]))
  datos.piezas = (datos.piezas ?? [])
    .filter((p) => porId.has(p.autoId))
    .map((p) => ({ ...p, fotos: (p.fotos ?? []).filter((n) => Number.isInteger(n) && n >= 0 && n < porId.get(p.autoId).fotos.length) }))
    .slice(0, 6)
  return datos
}
