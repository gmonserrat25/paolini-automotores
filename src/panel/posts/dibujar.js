/* Dibuja las piezas de Instagram del asistente en un <canvas>.

   La IA no dibuja nada: elige el diseño, el fondo, los textos y el encuadre
   (ver api/_asistente.js) y acá se arma la pieza con la foto real que subieron
   al panel, el logo vectorial y las fuentes del sitio. Así cada pieza es
   distinta pero siempre es Paolini, y el auto es el auto.

   Formatos: post 1080×1350 (4:5, el que mejor ocupa el feed) e historia
   1080×1920. */

export const FORMATOS = {
  post: { ancho: 1080, alto: 1350, nombre: 'Post' },
  historia: { ancho: 1080, alto: 1920, nombre: 'Historia' },
}

export const DISENOS = ['vitrina', 'ficha', 'titular', 'sangre', 'precio', 'vendido']
export const FONDOS = ['negro', 'rojo', 'hueso']

const NEGOCIO = { whatsapp: '3548 468411', direccion: 'Av. España 601 · La Falda' }

const ROJO = '#A8162A'
const PALETAS = {
  negro: { fondo: '#010101', texto: '#FFFFFF', suave: 'rgba(255,255,255,0.68)', linea: 'rgba(255,255,255,0.16)', acento: '#E0323F', logo: 'claro' },
  rojo: { fondo: ROJO, texto: '#FFFFFF', suave: 'rgba(255,255,255,0.78)', linea: 'rgba(255,255,255,0.3)', acento: '#FFFFFF', logo: 'blanco' },
  hueso: { fondo: '#ECE8E1', texto: '#141414', suave: 'rgba(20,20,20,0.64)', linea: 'rgba(20,20,20,0.18)', acento: ROJO, logo: 'oscuro' },
}

const M = 72 // margen

/* ── Textos ────────────────────────────────────────────────────────────── */

const palabra = (p) => (p.length <= 3 || /\d/.test(p) ? p : p[0] + p.slice(1).toLowerCase())
export const titulo = (s = '') => s.trim().split(/\s+/).map(palabra).join(' ')
const miles = (n) => Number(n).toLocaleString('es-AR')
export const precioDe = (auto) => (auto.precio ? `$ ${miles(auto.precio)}` : null)

function datosDe(auto) {
  return [auto.anio, auto.km != null ? (auto.km === 0 ? '0 km' : `${miles(auto.km)} km`) : null, titulo(auto.combustible ?? '')]
    .filter(Boolean)
    .join('  ·  ')
}

/* ── Recursos ──────────────────────────────────────────────────────────── */

const cache = new Map()
function cargarImagen(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((ok, mal) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => ok(img)
        img.onerror = () => {
          cache.delete(src)
          mal(new Error('No se pudo cargar la foto'))
        }
        img.src = src
      }),
    )
  }
  return cache.get(src)
}

/* El logo en tres versiones: claro (original, para fondo negro), blanco
   entero (para el rojo) y oscuro (para el hueso). */
let logos
function cargarLogos() {
  logos ??= fetch('/ig/logo-paolini.svg')
    .then((r) => r.text())
    .then(async (svg) => {
      const version = (blanco, rojo) =>
        cargarImagen(
          URL.createObjectURL(
            new Blob([svg.replace('fill="#FFFFFF"', `fill="${blanco}"`).replace('fill="#A8162A"', `fill="${rojo}"`)], {
              type: 'image/svg+xml',
            }),
          ),
        )
      const [claro, blanco, oscuro] = await Promise.all([
        version('#FFFFFF', ROJO),
        version('#FFFFFF', '#FFFFFF'),
        version('#141414', ROJO),
      ])
      return { claro, blanco, oscuro }
    })
    .catch((e) => {
      logos = undefined
      throw e
    })
  return logos
}

let fuentes
const cargarFuentes = () =>
  (fuentes ??= Promise.all(
    ['italic 800 80px Saira', 'italic 700 80px Saira', '700 40px Archivo', '600 40px Archivo', '500 40px Archivo', '400 40px Archivo'].map((f) =>
      document.fonts.load(f),
    ),
  ))

/* ── Primitivas ────────────────────────────────────────────────────────── */

function fuente(ctx, peso, tam, familia = 'Archivo', italica = false) {
  ctx.font = `${italica ? 'italic ' : ''}${peso} ${tam}px ${familia}, sans-serif`
}

function espaciado(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

/* La foto que cubre la caja (x, y, w, h) sin deformarse. `foco` corre el
   recorte (0 = izquierda, 1 = derecha) y `zoom` la acerca. */
function foto(ctx, img, x, y, w, h, { foco = 0.5, focoY = 0.5, zoom = 1 } = {}) {
  const escala = Math.max(w / img.width, h / img.height) * zoom
  const sw = w / escala
  const sh = h / escala
  const sx = (img.width - sw) * foco
  const sy = (img.height - sh) * focoY
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  ctx.restore()
}

/* Un degradé del color `color` que tapa la caja de `desde` (0) a `hasta` (1). */
function velo(ctx, x, y, w, h, color, paradas) {
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  for (const [t, a] of paradas) g.addColorStop(t, conAlfa(color, a))
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

function conAlfa(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

/* Escribe `texto` en hasta `lineas` renglones, achicando la letra hasta que
   entre en `ancho`. Devuelve la altura usada. */
function bloque(ctx, texto, x, y, { ancho, tam, min = tam * 0.55, lineas = 2, alto = 1.02, peso = 800, familia = 'Saira', italica = true, color, alinear = 'left' }) {
  ctx.fillStyle = color
  ctx.textAlign = alinear
  ctx.textBaseline = 'alphabetic'
  let t = tam
  let renglones
  for (; t >= min; t -= 2) {
    fuente(ctx, peso, t, familia, italica)
    renglones = partir(ctx, texto, ancho)
    if (renglones.length <= lineas && renglones.every((r) => ctx.measureText(r).width <= ancho)) break
  }
  /* Sin viudas: si el último renglón queda con una palabra suelta, se
     reparte el texto en renglones más parejos. */
  if (renglones.length > 1) {
    for (let a = ancho * 0.95; a > ancho * 0.55; a -= ancho * 0.05) {
      const otra = partir(ctx, texto, a)
      if (otra.length !== renglones.length) break
      renglones = otra
      if (ctx.measureText(otra.at(-1)).width > ctx.measureText(otra[0]).width * 0.6) break
    }
  }
  renglones = renglones.slice(0, lineas)
  renglones.forEach((r, i) => ctx.fillText(r, x, y + t * 0.8 + i * t * alto))
  ctx.textAlign = 'left'
  return t * 0.8 + (renglones.length - 1) * t * alto + t * 0.22
}

function partir(ctx, texto, ancho) {
  const palabras = texto.split(/\s+/)
  const renglones = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (ctx.measureText(prueba).width > ancho && actual) {
      renglones.push(actual)
      actual = p
    } else actual = prueba
  }
  if (actual) renglones.push(actual)
  return renglones
}

function linea(ctx, x, y, w, color, grosor = 2) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, grosor)
}

/* La etiqueta ("Recién ingresado", "Oferta"): un rectángulo lleno, sin
   redondeo, con el texto en blanco. */
function etiqueta(ctx, texto, x, y, { fondo = ROJO, color = '#FFFFFF', tam = 30 } = {}) {
  fuente(ctx, 600, tam)
  espaciado(ctx, 0.2)
  const w = ctx.measureText(texto).width + tam * 1.1
  const h = tam * 1.75
  ctx.fillStyle = fondo
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, x + tam * 0.55, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
  espaciado(ctx, 0)
  return h
}

const RUTA_WPP = new Path2D(
  'M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.07-1.33A9.93 9.93 0 1 0 12.04 2Zm0 1.67a8.26 8.26 0 1 1-4.2 15.37l-.3-.18-3 .79.8-2.93-.2-.31A8.26 8.26 0 0 1 12.04 3.67Z',
)

/* El pie: WhatsApp a la izquierda, dirección a la derecha. */
function pie(ctx, y, W, p, { k = 1, tam = 30 * k, conLinea = true, conLogo = null } = {}) {
  if (conLinea) linea(ctx, M, y, W - 2 * M, p.linea)
  const base = y + (conLinea ? 30 : 0) + tam
  ctx.save()
  ctx.fillStyle = p.texto
  const e = (tam * 1.2) / 24
  ctx.translate(M, base - tam * 0.95)
  ctx.scale(e, e)
  ctx.fill(RUTA_WPP)
  ctx.restore()
  fuente(ctx, 600, tam)
  ctx.fillStyle = p.texto
  ctx.fillText(NEGOCIO.whatsapp, M + tam * 1.5, base)
  if (conLogo) {
    /* En vez de la dirección, el logo (cuando no entra en otro lado). */
    const ancho = 300
    ctx.drawImage(conLogo, W - M - ancho, base - tam * 0.72, ancho, (ancho * conLogo.height) / conLogo.width)
    return
  }
  fuente(ctx, 400, tam)
  ctx.fillStyle = p.suave
  ctx.textAlign = 'right'
  ctx.fillText(NEGOCIO.direccion, W - M, base)
  ctx.textAlign = 'left'
}

function logo(ctx, lg, x, y, ancho, alinear = 'left') {
  const alto = (ancho * lg.height) / lg.width
  ctx.drawImage(lg, alinear === 'right' ? x - ancho : x, y, ancho, alto)
  return alto
}

/* Dibuja `escribir(ctx)` en una capa transparente del ancho de la pieza,
   empezando en y = 0, y devuelve la capa y la altura que usó. Sirve para
   medir un bloque de texto antes de decidir dónde va. */
function capa(W, escribir) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = 1400
  const alto = escribir(c.getContext('2d'))
  return { c, alto }
}

/* ── Diseños ───────────────────────────────────────────────────────────── */

/* Cada diseño recibe (ctx, W, H, d) con d = { auto, img, lg, p, pieza } y
   dibuja todo encima del fondo ya pintado.

   Reglas que valen para todos (de las revisiones del juez):
   - La foto nunca se funde en rojo ni en hueso: o corta (en diagonal, con el
     ángulo de la Saira itálica, que es el gesto de Paolini) o, sobre negro,
     se va a negro.
   - No se escribe encima del auto: el texto va en bandas lisas.
   - Precio en su propio renglón, de 72 px o más; datos de 34 px o más.
   - En las historias la foto manda (850 px o más), el texto crece ×1,25 y
     nada importante va en los 250 px de arriba (ahí Instagram pone su barra). */

const zonas = (H) => {
  const hist = H > 1500
  return { hist, k: hist ? 1.25 : 1, arriba: hist ? 250 : 64, pieY: hist ? 1630 : H - 118 }
}

/* La caída del corte diagonal: el ángulo de la Saira itálica, suavizado
   para que no se coma la foto (≈ 6°). */
const CAIDA = 110

/* Pinta de `color` todo lo que está debajo de una línea que sube hacia la
   derecha: en x = 0 está en `y`, en x = W está en `y - CAIDA`. */
function cuna(ctx, W, H, y, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(W, y - CAIDA)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fill()
}

/* El modelo en Saira itálica: primero achica para que entre en un renglón;
   si no alcanza, parte después de la primera palabra ("Corolla / HV SEG
   CVT"), nunca deja un "1.8" colgando. Devuelve la altura usada. */
function modelo(ctx, texto, x, y, { ancho, tam, color, alinear = 'left', lineas = 2 }) {
  ctx.fillStyle = color
  ctx.textAlign = alinear
  for (let t = tam; t >= tam * 0.74; t -= 2) {
    fuente(ctx, 800, t, 'Saira', true)
    if (ctx.measureText(texto).width <= ancho) {
      ctx.fillText(texto, x, y + t * 0.8)
      ctx.textAlign = 'left'
      return t * 1.02
    }
  }
  const [primera, ...resto] = texto.split(' ')
  const renglones = lineas > 1 && resto.length ? [primera, resto.join(' ')] : [texto]
  let t = tam
  for (; t > 30; t -= 2) {
    fuente(ctx, 800, t, 'Saira', true)
    if (renglones.every((r) => ctx.measureText(r).width <= ancho)) break
  }
  renglones.forEach((r, i) => ctx.fillText(r, x, y + t * 0.8 + i * t * 0.98))
  ctx.textAlign = 'left'
  return t * 0.8 + (renglones.length - 1) * t * 0.98 + t * 0.22
}

function texto1(ctx, t, x, y, { tam, peso = 500, color, alinear = 'left', ancho }) {
  fuente(ctx, peso, tam)
  /* Si no entra, achica hasta que entre. */
  if (ancho) for (let s = tam; s > tam * 0.6 && ctx.measureText(t).width > ancho; s -= 2) fuente(ctx, peso, s)
  ctx.fillStyle = color
  ctx.textAlign = alinear
  ctx.fillText(t, x, y)
  ctx.textAlign = 'left'
}

const precioTexto = (auto, pieza) => (pieza.mostrarPrecio && precioDe(auto)) || 'Consultá el precio'
const etiquetaFondo = (p) => (p === PALETAS.rojo ? '#010101' : ROJO)

/* Vitrina: la foto arriba y el auto abajo, apoyado sobre el pie. En negro la
   foto se va a negro; en rojo y hueso la corta la diagonal. */
function vitrina(ctx, W, H, { auto, img, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  const negro = p.fondo === PALETAS.negro.fondo

  const capaTexto = capa(W, (c) => {
    let y = 0
    if (pieza.etiqueta) y += etiqueta(c, pieza.etiqueta, M, y, { tam: 32 * k, fondo: etiquetaFondo(p) }) + 30 * k
    texto1(c, titulo(auto.marca), M, y + 34 * k, { tam: 36 * k, peso: 600, color: p.acento })
    y += 48 * k
    y += modelo(c, titulo(auto.modelo), M, y, { ancho: W - 2 * M, tam: 108 * k, color: p.texto })
    texto1(c, datosDe(auto), M, y + 36 * k, { tam: 36 * k, color: p.suave })
    y += 54 * k
    if (pieza.bajada) {
      y += bloque(c, pieza.bajada, M, y + 4, { ancho: W - 2 * M, tam: 34 * k, min: 30, lineas: 2, alto: 1.3, peso: 400, familia: 'Archivo', italica: false, color: p.suave }) + 4
    }
    texto1(c, precioTexto(auto, pieza), M, y + 96 * k, { tam: 84 * k, peso: 700, color: p.texto })
    return y + 108 * k
  })

  const textoY = pieY - 40 * k - capaTexto.alto
  if (negro) {
    const fotoH = textoY + 60
    foto(ctx, img, 0, 0, W, fotoH, pieza.encuadre)
    velo(ctx, 0, fotoH - 300, W, 302, '#010101', [[0, 0], [1, 1]])
  } else {
    foto(ctx, img, 0, 0, W, textoY - 20, pieza.encuadre)
    cuna(ctx, W, H, textoY - 20, p.fondo)
  }
  velo(ctx, 0, 0, W, arriba + 200, '#000000', [[0, 0.62], [1, 0]])
  logo(ctx, pieza._lgClaro, M, arriba, 480)
  ctx.drawImage(capaTexto.c, 0, textoY)
  pie(ctx, pieY, W, p, { k })
}

/* Ficha: la foto casi a lo ancho y abajo modelo, una ficha corta y el
   precio. Sobria, de catálogo. */
function ficha(ctx, W, H, { auto, img, lg, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 460)
  if (pieza.etiqueta) texto1(ctx, pieza.etiqueta, W - M, arriba + 28, { tam: 32 * k, peso: 600, color: p.acento, alinear: 'right' })

  const fotoY = arriba + 84 * k
  const abajo = (44 + 3 * 60 + 116) * k
  const fotoH = pieY - 44 * k - abajo - fotoY
  foto(ctx, img, 40, fotoY, W - 80, fotoH, pieza.encuadre)

  const y = fotoY + fotoH + 44 * k
  const izq = 500
  texto1(ctx, titulo(auto.marca), M, y + 30 * k, { tam: 34 * k, peso: 600, color: p.acento })
  modelo(ctx, titulo(auto.modelo), M, y + 44 * k, { ancho: izq - M - 24, tam: 78 * k, color: p.texto })

  const filas = [
    ['Año', auto.anio],
    ['Kilómetros', auto.km != null ? miles(auto.km) : null],
    ['Combustible', titulo(auto.combustible ?? '')],
  ].filter(([, v]) => v)
  const x = izq + 16
  const w = W - M - x
  const alto = 60 * k
  filas.forEach(([clave, v], i) => {
    const fy = y + i * alto
    linea(ctx, x, fy, w, p.linea, 2)
    texto1(ctx, clave, x, fy + alto * 0.7, { tam: 32 * k, peso: 400, color: p.suave })
    texto1(ctx, String(v), x + w, fy + alto * 0.7, { tam: 32 * k, peso: 600, color: p.texto, alinear: 'right' })
  })
  linea(ctx, x, y + filas.length * alto, w, p.linea, 2)
  texto1(ctx, precioTexto(auto, pieza), W - M, pieY - 40 * k, { tam: 80 * k, peso: 700, color: p.texto, alinear: 'right' })
  pie(ctx, pieY, W, p, { k, conLinea: false })
}

/* Titular: arriba el titular grande sobre color liso, en el medio la foto
   limpia y abajo modelo, datos y precio. No se escribe sobre el auto. */
function titular(ctx, W, H, { auto, img, lg, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 440)
  if (pieza.etiqueta) texto1(ctx, pieza.etiqueta, W - M, arriba + 28, { tam: 32 * k, peso: 600, color: p.acento, alinear: 'right' })
  let y = arriba + 70 * k
  y += bloque(ctx, pieza.titular || `${titulo(auto.marca)} ${auto.anio ?? ''}`.trim(), M, y, {
    ancho: W - 2 * M,
    tam: 92 * k,
    min: 60,
    lineas: 2,
    alto: 0.95,
    peso: 800,
    familia: 'Archivo',
    italica: false,
    color: p.texto,
  })
  const fotoY = Math.round(y + 34 * k)
  const bandaAbajo = 250 * k + (H - pieY)
  const fotoH = H - bandaAbajo - fotoY
  foto(ctx, img, 0, fotoY, W, fotoH, { ...pieza.encuadre, focoY: 0.6 })

  const by = fotoY + fotoH + 30 * k
  modelo(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, by, { ancho: W - 2 * M, tam: 58 * k, color: p.texto, lineas: 1 })
  texto1(ctx, datosDe(auto), M, by + 108 * k, { tam: 34 * k, color: p.suave })
  texto1(ctx, precioTexto(auto, pieza), M, by + 196 * k, { tam: 78 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k })
}

/* Sangre: la foto ocupa toda la pieza y una banda de color entra desde abajo
   cortada en diagonal. Es el más "Paolini" de todos. */
function sangre(ctx, W, H, { auto, img, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  const bandaY = Math.round(pieY - 330 * k)
  foto(ctx, img, 0, 0, W, bandaY + 20, pieza.encuadre)
  velo(ctx, 0, 0, W, arriba + 200, '#000000', [[0, 0.62], [1, 0]])
  logo(ctx, pieza._lgClaro, M, arriba, 480)
  cuna(ctx, W, H, bandaY + 20, p.fondo)
  if (pieza.etiqueta) {
    /* La etiqueta se apoya sobre la diagonal, del lado alto. */
    fuente(ctx, 600, 32 * k)
    const w = ctx.measureText(pieza.etiqueta).width + 32 * k * 1.1
    etiqueta(ctx, pieza.etiqueta, W - M - w, bandaY - CAIDA - 40 * k, { tam: 32 * k, fondo: etiquetaFondo(p) })
  }
  let y = bandaY + 40 * k
  y += modelo(ctx, titulo(auto.modelo), M, y, { ancho: W - 2 * M, tam: 100 * k, color: p.texto, lineas: 1 })
  texto1(ctx, `${titulo(auto.marca)}  ·  ${datosDe(auto)}`, M, y + 34 * k, { tam: 34 * k, color: p.suave, ancho: W - 2 * M })
  texto1(ctx, precioTexto(auto, pieza), M, y + 132 * k, { tam: 88 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k })
}

/* Precio: el número manda, para ofertas y nuevos precios. Arriba el precio
   enorme, después el auto y la foto con corte diagonal hacia abajo. */
function precio(ctx, W, H, { auto, img, lg, p, pieza }) {
  if (!pieza.mostrarPrecio || !precioDe(auto)) return vitrina(ctx, W, H, { auto, img, lg, p, pieza })
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 440)
  let y = arriba + 80 * k
  if (pieza.etiqueta) {
    texto1(ctx, pieza.etiqueta, M, y + 34 * k, { tam: 36 * k, peso: 600, color: p.acento })
    y += 50 * k
  }
  /* Archivo 800 lo más grande que entre en el ancho. */
  let t = 170 * k
  for (; t > 100; t -= 4) {
    fuente(ctx, 800, t)
    if (ctx.measureText(precioDe(auto)).width <= W - 2 * M) break
  }
  ctx.fillStyle = p.texto
  ctx.fillText(precioDe(auto), M, y + t * 0.78)
  y += t * 0.95
  modelo(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y, { ancho: W - 2 * M, tam: 56 * k, color: p.texto, lineas: 1 })
  texto1(ctx, datosDe(auto), M, y + 100 * k, { tam: 34 * k, color: p.suave })
  const fotoY = Math.round(y + 140 * k)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, fotoY + CAIDA)
  ctx.lineTo(W, fotoY)
  ctx.lineTo(W, pieY - 40 * k)
  ctx.lineTo(0, pieY - 40 * k)
  ctx.closePath()
  ctx.clip()
  foto(ctx, img, 0, fotoY, W, pieY - 40 * k - fotoY, pieza.encuadre)
  ctx.restore()
  pie(ctx, pieY, W, p, { k, conLinea: false })
}

/* La foto en blanco y negro (para "vendido": el rojo queda sólo en la
   palabra). Se hace a mano: el filtro del canvas no anda en todos lados. */
function fotoGris(img) {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const datos = g.getImageData(0, 0, c.width, c.height)
  const d = datos.data
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
    d[i] = d[i + 1] = d[i + 2] = v
  }
  g.putImageData(datos, 0, 0)
  return c
}

/* Vendido / reservado / entregado: la palabra grande, la foto en blanco y
   negro y una línea de cierre. Nunca lleva precio. */
function vendido(ctx, W, H, { auto, img, lg, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 440)
  let y = arriba + 70 * k
  y += modelo(ctx, pieza.etiqueta || 'Vendido', M, y, { ancho: W - 2 * M, tam: 180 * k, color: p === PALETAS.rojo ? '#FFFFFF' : ROJO, lineas: 1 })
  texto1(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y + 22 * k, { tam: 40 * k, peso: 600, color: p.texto })
  y += 40 * k
  if (pieza.bajada || pieza.titular) {
    texto1(ctx, pieza.bajada || pieza.titular, M, y + 48 * k, { tam: 34 * k, peso: 400, color: p.suave, ancho: W - 2 * M })
    y += 52 * k
  }
  const fotoY = Math.round(y + 56 * k)
  foto(ctx, fotoGris(img), 0, fotoY, W, pieY - 40 * k - fotoY, pieza.encuadre)
  pie(ctx, pieY, W, p, { k, conLinea: false })
}

const DIBUJOS = { vitrina, ficha, titular, sangre, precio, vendido, bloque: sangre, catalogo: ficha }

/* ── Entrada ───────────────────────────────────────────────────────────── */

/* Dibuja la pieza en `canvas`. `pieza` viene del asistente:
   { diseno, fondo, formato, etiqueta, titular, bajada, mostrarPrecio,
     encuadre: { foco, zoom } } y `auto` es la unidad del stock. */
export async function dibujarPieza(canvas, pieza, auto) {
  const { ancho: W, alto: H } = FORMATOS[pieza.formato] ?? FORMATOS.post
  const [img, lgs] = await Promise.all([cargarImagen(auto.foto), cargarLogos(), cargarFuentes()])
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  /* Un auto rojo sobre fondo rojo se pierde: pasa a negro. */
  const rojo = /rojo|bord|granate/i.test(auto.color ?? '')
  const p = (rojo && pieza.fondo === 'rojo' ? PALETAS.negro : PALETAS[pieza.fondo]) ?? PALETAS.negro
  const lg = lgs[p.logo]
  ctx.fillStyle = p.fondo
  ctx.fillRect(0, 0, W, H)
  const encuadre = {
    foco: { izquierda: 0.15, centro: 0.5, derecha: 0.85 }[pieza.encuadre?.foco] ?? 0.5,
    zoom: Math.min(1.6, Math.max(1, Number(pieza.encuadre?.zoom) || 1)),
  }
  const dibujo = DIBUJOS[pieza.diseno] ?? vitrina
  dibujo(ctx, W, H, { auto, img, lg, p, pieza: { ...pieza, encuadre, _lgClaro: lgs.claro } })
}

/* El PNG listo para bajar o compartir. */
export const aPng = (canvas) => new Promise((ok) => canvas.toBlob(ok, 'image/png'))
