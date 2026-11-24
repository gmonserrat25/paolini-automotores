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

export const DISENOS = ['vitrina', 'ficha', 'titular', 'bloque', 'catalogo', 'vendido']
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
function pie(ctx, y, W, p, { tam = 28, conLinea = true, conLogo = null } = {}) {
  if (conLinea) linea(ctx, M, y, W - 2 * M, p.linea)
  const base = y + (conLinea ? 30 : 0) + tam
  ctx.save()
  ctx.fillStyle = p.texto
  const e = (tam * 1.15) / 24
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

/* ── Diseños ───────────────────────────────────────────────────────────── */

/* Cada diseño recibe (ctx, W, H, d) con d = { auto, img, lg, p, pieza } y
   dibuja todo encima del fondo ya pintado. */

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

/* Vitrina: la foto arriba a sangre que se funde en el fondo; abajo el auto,
   apoyado sobre el pie. */
function vitrina(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  const pieY = H - (hist ? 200 : 112)
  const precio = pieza.mostrarPrecio && precioDe(auto)

  const texto = capa(W, (c) => {
    let y = 0
    if (pieza.etiqueta) y += etiqueta(c, pieza.etiqueta, M, y) + 28
    fuente(c, 600, 34)
    c.fillStyle = p.acento
    c.fillText(titulo(auto.marca), M, y + 30)
    y += 44
    y += bloque(c, titulo(auto.modelo), M, y, { ancho: W - 2 * M, tam: hist ? 112 : 100, color: p.texto })
    fuente(c, 500, 33)
    c.fillStyle = p.suave
    c.fillText(datosDe(auto), M, y + 32)
    y += 50
    if (pieza.bajada) {
      y += bloque(c, pieza.bajada, M, y + 6, { ancho: W - 2 * M, tam: 31, min: 24, lineas: 2, alto: 1.3, peso: 400, familia: 'Archivo', italica: false, color: p.suave }) + 6
    }
    fuente(c, 700, hist ? 80 : 68)
    c.fillStyle = p.texto
    c.fillText(precio || 'Consultá el precio', M, y + (hist ? 92 : 80))
    return y + (hist ? 92 : 80)
  })

  const textoY = pieY - (hist ? 90 : 56) - texto.alto
  const fotoY = hist ? 220 : 0
  const fotoH = Math.max(textoY + 120 - fotoY, H * 0.45)
  foto(ctx, img, 0, fotoY, W, fotoH, pieza.encuadre)
  velo(ctx, 0, fotoY + fotoH - 300, W, 302, p.fondo, [[0, 0], [0.6, 0.85], [1, 1]])
  if (hist) velo(ctx, 0, fotoY, W, 160, p.fondo, [[0, 1], [1, 0]])
  else velo(ctx, 0, 0, W, 240, '#000000', [[0, 0.6], [1, 0]])
  logo(ctx, hist ? lg : pieza._lgClaro, M, hist ? 110 : 60, 440)
  ctx.drawImage(texto.c, 0, textoY)
  pie(ctx, pieY, W, p)
}

/* Ficha: la foto enmarcada y debajo una ficha técnica de renglones finos. */
function ficha(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  let y = hist ? 150 : 64
  logo(ctx, lg, M, y, 400)
  if (pieza.etiqueta) {
    fuente(ctx, 600, 26)
    ctx.fillStyle = p.acento
    ctx.textAlign = 'right'
    ctx.fillText(pieza.etiqueta, W - M, y + 18)
    ctx.textAlign = 'left'
  }
  y += hist ? 110 : 76
  if (pieza.titular) {
    y += bloque(ctx, pieza.titular, M, y, { ancho: W - 2 * M, tam: hist ? 64 : 52, min: 34, lineas: 2, alto: 1.1, peso: 600, familia: 'Archivo', italica: false, color: p.texto }) + 28
  }
  const fotoH = H - y - (hist ? 640 : 470)
  foto(ctx, img, M, y, W - 2 * M, fotoH, pieza.encuadre)
  y += fotoH + (hist ? 64 : 44)

  const colIzq = Math.round((W - 2 * M) * 0.5)
  fuente(ctx, 600, 28)
  ctx.fillStyle = p.acento
  ctx.fillText(titulo(auto.marca), M, y + 24)
  bloque(ctx, titulo(auto.modelo), M, y + 36, { ancho: colIzq - 24, tam: hist ? 76 : 62, min: 34, lineas: 3, color: p.texto })

  const filas = [
    ['Año', auto.anio],
    ['Kilómetros', auto.km != null ? miles(auto.km) : null],
    ['Combustible', titulo(auto.combustible ?? '')],
    ['Precio', pieza.mostrarPrecio && precioDe(auto) ? precioDe(auto) : 'Consultar'],
  ].filter(([, v]) => v)
  const x = M + colIzq + 12
  const w = W - M - x
  const alto = hist ? 74 : 62
  filas.forEach(([k, v], i) => {
    const fy = y + i * alto
    linea(ctx, x, fy, w, p.linea, 2)
    fuente(ctx, 400, hist ? 28 : 25)
    ctx.fillStyle = p.suave
    ctx.fillText(k, x, fy + alto * 0.62)
    fuente(ctx, i === filas.length - 1 ? 700 : 600, hist ? 30 : 27)
    ctx.fillStyle = p.texto
    ctx.textAlign = 'right'
    ctx.fillText(String(v), x + w, fy + alto * 0.62)
    ctx.textAlign = 'left'
  })
  linea(ctx, x, y + filas.length * alto, w, p.linea, 2)
  pie(ctx, H - (hist ? 200 : 104), W, p, { conLinea: false, tam: 26 })
}

/* Titular: la foto a toda la pieza, oscurecida arriba y abajo; el titular
   manda. */
function titular(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  const apaisada = img.width / img.height > 1.05
  const sombra = p.fondo
  if (apaisada) {
    /* Una foto horizontal no llena la pieza sin cortar el auto: va en una
       franja y el resto es fondo. */
    const fh = Math.round(W / (img.width / img.height) * 1.12)
    const fy = Math.round(H * (hist ? 0.36 : 0.3))
    ctx.fillStyle = sombra
    ctx.fillRect(0, 0, W, H)
    foto(ctx, img, 0, fy, W, fh, pieza.encuadre)
    velo(ctx, 0, fy, W, 120, sombra, [[0, 1], [1, 0]])
    velo(ctx, 0, fy + fh - 200, W, 202, sombra, [[0, 0], [1, 1]])
  } else {
    foto(ctx, img, 0, 0, W, H, pieza.encuadre)
    velo(ctx, 0, 0, W, H * 0.42, sombra, [[0, 0.88], [0.6, 0.45], [1, 0]])
    velo(ctx, 0, H * 0.55, W, H * 0.45, sombra, [[0, 0], [0.55, 0.85], [1, 0.96]])
  }
  const claro = p
  let y = hist ? 170 : 84
  if (pieza.etiqueta) y += etiqueta(ctx, pieza.etiqueta, M, y) + 30
  y += bloque(ctx, pieza.titular || titulo(auto.modelo), M, y, {
    ancho: W - 2 * M,
    tam: hist ? 92 : 80,
    min: 44,
    lineas: 3,
    alto: 1.06,
    peso: 700,
    familia: 'Archivo',
    italica: false,
    color: p.texto,
  })
  if (pieza.bajada) {
    bloque(ctx, pieza.bajada, M, y + 18, { ancho: W - 2 * M - 80, tam: 32, min: 24, lineas: 2, alto: 1.3, peso: 400, familia: 'Archivo', italica: false, color: claro.suave })
  }

  let by = H - (hist ? 520 : 380)
  fuente(ctx, 600, 30)
  ctx.fillStyle = p.acento
  ctx.fillText(titulo(auto.marca), M, by)
  by += 12
  by += bloque(ctx, titulo(auto.modelo), M, by, { ancho: W - 2 * M - 160, tam: 64, min: 40, lineas: 1, color: p.texto })
  fuente(ctx, 500, 30)
  ctx.fillStyle = claro.suave
  const precio = pieza.mostrarPrecio && precioDe(auto)
  ctx.fillText(datosDe(auto) + (precio ? `  ·  ${precio}` : ''), M, by + 28)
  pie(ctx, H - (hist ? 210 : 116), W, claro, { conLogo: lg })
}

/* Bloque: media pieza de color lleno con el texto, media foto con corte
   seco. Es el más "flyer" de todos. */
function bloqueColor(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  const corte = Math.round(H * (hist ? 0.47 : 0.44))
  let y = hist ? 150 : 70
  logo(ctx, lg, M, y, 400)
  y += hist ? 150 : 104
  if (pieza.etiqueta) {
    fuente(ctx, 600, 30)
    ctx.fillStyle = p.acento
    ctx.fillRect(M, y + 8, 14, 14)
    ctx.fillStyle = p.texto
    ctx.fillText(pieza.etiqueta, M + 30, y + 24)
    y += 60
  }
  if (pieza.titular) {
    y += bloque(ctx, pieza.titular, M, y, { ancho: W - 2 * M, tam: 40, min: 28, lineas: 2, alto: 1.2, peso: 500, familia: 'Archivo', italica: false, color: p.suave }) + 14
  }
  fuente(ctx, 600, 30)
  ctx.fillStyle = p.texto
  ctx.fillText(titulo(auto.marca), M, y + 26)
  y += 36
  bloque(ctx, titulo(auto.modelo), M, y, { ancho: W - 2 * M, tam: hist ? 120 : 104, min: 56, lineas: 2, color: p.texto })

  foto(ctx, img, 0, corte, W, H - corte, pieza.encuadre)
  velo(ctx, 0, H - 300, W, 300, '#000000', [[0, 0], [1, 0.82]])
  const claro = PALETAS.negro
  const precio = pieza.mostrarPrecio && precioDe(auto)
  const base = H - (hist ? 250 : 150)
  fuente(ctx, 500, 30)
  ctx.fillStyle = claro.suave
  ctx.fillText(datosDe(auto), M, base)
  if (precio) {
    fuente(ctx, 700, 56)
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'right'
    ctx.fillText(precio, W - M, base)
    ctx.textAlign = 'left'
  }
  pie(ctx, base + 34, W, claro, { conLinea: false, tam: 26 })
}

/* Catálogo: la foto con un filete corrido detrás, como página de revista;
   textos chicos y mucho aire. */
function catalogo(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  const top = hist ? 160 : 64
  logo(ctx, lg, W / 2 - 210, top, 420)
  const fx = M + 28
  const fy = top + (hist ? 150 : 96)
  const fw = W - 2 * M - 56
  const fh = hist ? 920 : 690
  ctx.strokeStyle = p.acento
  ctx.lineWidth = 3
  ctx.strokeRect(fx + 22, fy + 22, fw, fh)
  ctx.fillStyle = p.fondo
  ctx.fillRect(fx, fy, fw, fh)
  foto(ctx, img, fx, fy, fw, fh, pieza.encuadre)

  let y = fy + fh + (hist ? 100 : 74)
  ctx.textAlign = 'center'
  if (pieza.etiqueta) {
    fuente(ctx, 600, 26)
    ctx.fillStyle = p.acento
    ctx.fillText(pieza.etiqueta, W / 2, y)
    y += 24
  }
  fuente(ctx, 500, 30)
  ctx.fillStyle = p.suave
  ctx.textAlign = 'left'
  y += bloque(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, W / 2, y, {
    ancho: W - 2 * M,
    tam: hist ? 76 : 64,
    min: 38,
    lineas: 2,
    alto: 1.05,
    color: p.texto,
    alinear: 'center',
  })
  const precio = pieza.mostrarPrecio && precioDe(auto)
  fuente(ctx, 500, 30)
  ctx.fillStyle = p.suave
  ctx.textAlign = 'center'
  ctx.fillText(datosDe(auto) + (precio ? `  ·  ${precio}` : ''), W / 2, y + 34)
  if (pieza.bajada && hist) {
    fuente(ctx, 400, 30)
    ctx.fillText(pieza.bajada, W / 2, y + 100)
  }
  ctx.textAlign = 'left'
  pie(ctx, H - (hist ? 200 : 104), W, p, { conLinea: false, tam: 26 })
}

/* Vendido / reservado / entregado: el auto ya tiene dueño. El estado va
   grande y en rojo; el precio no va nunca. */
function vendido(ctx, W, H, { auto, img, lg, p, pieza }) {
  const hist = H > 1500
  const fotoY = hist ? 640 : 430
  foto(ctx, img, 0, fotoY, W, H - fotoY, pieza.encuadre)
  velo(ctx, 0, fotoY, W, 180, p.fondo, [[0, 1], [1, 0]])
  velo(ctx, 0, H - 260, W, 260, '#000000', [[0, 0], [1, 0.8]])
  let y = hist ? 160 : 64
  logo(ctx, lg, M, y, 400)
  y += hist ? 140 : 100
  y += bloque(ctx, pieza.etiqueta || 'Vendido', M, y, { ancho: W - 2 * M, tam: hist ? 170 : 150, min: 80, lineas: 1, color: p === PALETAS.rojo ? '#FFFFFF' : ROJO })
  fuente(ctx, 600, 34)
  ctx.fillStyle = p.texto
  ctx.fillText(`${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y + 20)
  if (pieza.titular || pieza.bajada) {
    bloque(ctx, pieza.titular || pieza.bajada, M, y + 46, { ancho: W - 2 * M, tam: 32, min: 24, lineas: 2, alto: 1.3, peso: 400, familia: 'Archivo', italica: false, color: p.suave })
  }
  pie(ctx, H - (hist ? 200 : 104), W, PALETAS.negro, { conLinea: false, tam: 26 })
}

const DIBUJOS = { vitrina, ficha, titular, bloque: bloqueColor, catalogo, vendido }

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
  const p = PALETAS[pieza.fondo] ?? PALETAS.negro
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
