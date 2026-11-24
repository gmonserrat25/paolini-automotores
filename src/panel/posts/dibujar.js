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
  negro: { fondo: '#010101', texto: '#FFFFFF', suave: '#B8B8B8', linea: 'rgba(255,255,255,0.16)', acento: '#E0323F', logo: 'claro' },
  rojo: { fondo: ROJO, texto: '#FFFFFF', suave: '#F0C9CF', linea: 'rgba(255,255,255,0.3)', acento: '#FFFFFF', logo: 'blanco' },
  hueso: { fondo: '#ECE8E1', texto: '#141414', suave: '#4A4A4A', linea: 'rgba(20,20,20,0.18)', acento: ROJO, logo: 'oscuro' },
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

/* Las fuentes de la marca. El sitio sólo baja Archivo hasta 700: el 900
   (titular y precio) se pide acá. */
let fuentes
function cargarFuentes() {
  if (!fuentes) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;900&family=Saira:ital,wght@1,700;1,800&display=swap'
    document.head.appendChild(link)
    fuentes = new Promise((ok) => {
      link.onload = ok
      link.onerror = ok
    }).then(() =>
      Promise.all(
        ['italic 800 80px Saira', 'italic 700 80px Saira', '900 40px Archivo', '700 40px Archivo', '600 40px Archivo', '500 40px Archivo', '400 40px Archivo'].map((f) =>
          document.fonts.load(f),
        ),
      ),
    )
  }
  return fuentes
}

/* ── Primitivas ────────────────────────────────────────────────────────── */

function fuente(ctx, peso, tam, familia = 'Archivo', italica = false) {
  ctx.font = `${italica ? 'italic ' : ''}${peso} ${tam}px ${familia}, sans-serif`
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

const RUTA_WPP = new Path2D(
  'M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.07-1.33A9.93 9.93 0 1 0 12.04 2Zm0 1.67a8.26 8.26 0 1 1-4.2 15.37l-.3-.18-3 .79.8-2.93-.2-.31A8.26 8.26 0 0 1 12.04 3.67Z',
)

/* El pie: WhatsApp a la izquierda, dirección a la derecha. */
function pie(ctx, y, W, p, { k = 1, tam = 36 * k, conLinea = true, conLogo = null, derecha = NEGOCIO.direccion } = {}) {
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
    const ancho = 380
    ctx.drawImage(conLogo, W - M - ancho, base - tam * 0.72, ancho, (ancho * conLogo.height) / conLogo.width)
    return
  }
  /* Lo de la derecha achica si no entra al lado del teléfono. */
  const libre = W - 2 * M - tam * 1.5 - ctx.measureText(NEGOCIO.whatsapp).width - 40
  fuente(ctx, 400, tam)
  for (let t = tam; t > tam * 0.6 && ctx.measureText(derecha).width > libre; t -= 1) fuente(ctx, 400, t)
  ctx.fillStyle = p.suave
  ctx.textAlign = 'right'
  ctx.fillText(derecha, W - M, base)
  ctx.textAlign = 'left'
}

function logo(ctx, lg, x, y, ancho, alinear = 'left') {
  const alto = (ancho * lg.height) / lg.width
  ctx.drawImage(lg, alinear === 'right' ? x - ancho : x, y, ancho, alto)
  return alto
}

/* ── Diseños ───────────────────────────────────────────────────────────── */

/* Cada diseño recibe (ctx, W, H, d) con d = { auto, img, lg, p, pieza } y
   dibuja todo encima del fondo ya pintado.

   Reglas que valen para todos (de las revisiones del juez):
   - No se escribe encima del auto: el texto va en bandas lisas.
   - Nada de degradés sobre la foto: corta seco o en diagonal.
   - El gesto de Paolini es el ángulo de la Saira itálica (≈ 10°): lo usan
     el corte diagonal de "sangre" y "precio" y el sello.
   - Precio en su propio renglón, de 80 px o más; datos de 34 px o más; como
     mucho 5 niveles de texto por pieza.
   - En las historias la foto manda, el texto crece ×1,25 y nada importante
     va en los 250 px de arriba ni por debajo de y = 1600. */

const hist = (H) => H > 1500
const lgs_claro = (pieza) => pieza._lgClaro

const zonas = (H) => {
  const hist = H > 1500
  return { hist, k: hist ? 1.25 : 1, arriba: hist ? 250 : 64, pieY: hist ? 1530 : H - 118 }
}

/* El ángulo de la Saira itálica: en 1080 px de ancho, el corte sube 190. */
const CAIDA = 190
const INCLINACION = 0.18 // tan(10°)

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

/* El sello ("Oferta", "Recién ingresado"): un paralelogramo con los lados
   al ángulo de la itálica y el texto en Saira itálica. Devuelve su alto. */
function sello(ctx, texto, x, y, { tam = 32, fondo = ROJO, color = '#FFFFFF' } = {}) {
  fuente(ctx, 700, tam, 'Saira', true)
  const h = tam * 1.75
  const d = h * INCLINACION
  const w = ctx.measureText(texto).width + tam * 1.2 + d
  ctx.fillStyle = fondo
  ctx.beginPath()
  ctx.moveTo(x + d, y)
  ctx.lineTo(x + w + d, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, x + d / 2 + tam * 0.6, y + h / 2 + 1)
  ctx.textBaseline = 'alphabetic'
  return h
}

/* El modelo en Saira itálica: achica hasta `min` para que entre en un
   renglón; si no alcanza, parte después de la primera palabra ("Corolla /
   HV SEG CVT"), nunca deja un "1.8" colgando. Devuelve la altura usada. */
function modelo(ctx, texto, x, y, { ancho, tam, color, alinear = 'left', lineas = 2, min = tam * 0.7 }) {
  ctx.fillStyle = color
  ctx.textAlign = alinear
  for (let t = tam; t >= min; t -= 2) {
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
const selloFondo = (p) => (p === PALETAS.rojo ? '#010101' : ROJO)
/* La marca va en la línea de datos, no en un renglón suelto. */
const lineaDatos = (auto) => `${titulo(auto.marca)}  ·  ${datosDe(auto)}`

/* Vitrina: la foto ocupa toda la pieza y abajo, sobre el piso, el modelo,
   los datos y el precio grande. El degradé arranca bajo para no ensuciar el
   auto. Siempre oscura (va negro aunque pidan otro fondo). */
function vitrina(ctx, W, H, { auto, img, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  const p = PALETAS.negro
  foto(ctx, img, 0, 0, W, H, pieza.encuadre)
  velo(ctx, 0, 0, W, arriba + 260, '#000000', [[0, 0.7], [1, 0]])
  const desde = hist(H) ? 1100 : 760
  velo(ctx, 0, desde, W, H - desde, '#000000', [[0, 0], [0.35, 0.7], [1, 0.85]])
  logo(ctx, pieza._lgClaro, M, arriba, 560)

  const precioBase = pieY - 40 * k
  const datosBase = precioBase - 112 * k
  const modeloY = datosBase - 44 * k - 112 * k
  modelo(ctx, titulo(auto.modelo), M, modeloY, { ancho: W - 2 * M, tam: 112 * k, color: p.texto, lineas: 1, min: 64 })
  if (pieza.etiqueta) sello(ctx, pieza.etiqueta, M, modeloY - 82 * k, { tam: 32 * k })
  texto1(ctx, lineaDatos(auto), M, datosBase, { tam: 40 * k, color: p.suave, ancho: W - 2 * M })
  texto1(ctx, precioTexto(auto, pieza), M, precioBase, { tam: 98 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k })
}

/* Ficha: la foto a sangre arriba con corte recto y abajo el auto con sus
   datos en tres columnas (año | km | combustible). El logo va en el pie. */
function ficha(ctx, W, H, { auto, img, p, pieza }) {
  const { k, pieY } = zonas(H)
  const abajo = (pieza.etiqueta ? 70 : 0) + 400 * k
  const fotoH = pieY - 30 * k - abajo
  foto(ctx, img, 0, 0, W, fotoH + 10, pieza.encuadre)
  velo(ctx, 0, 0, W, zonas(H).arriba + 240, '#000000', [[0, 0.65], [1, 0]])
  logo(ctx, lgs_claro(pieza), M, zonas(H).arriba, 520)
  /* La unión foto/panel sube 80 px de izquierda a derecha. */
  ctx.fillStyle = p.fondo
  ctx.beginPath()
  ctx.moveTo(0, fotoH + 10)
  ctx.lineTo(W, fotoH - 70)
  ctx.lineTo(W, fotoH + 12)
  ctx.lineTo(0, fotoH + 12)
  ctx.closePath()
  ctx.fill()

  let y = fotoH + 44 * k
  if (pieza.etiqueta) y += sello(ctx, pieza.etiqueta, M, y, { tam: 30 * k, fondo: selloFondo(p) }) + 24 * k
  y += modelo(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y, { ancho: W - 2 * M, tam: 66 * k, color: p.texto, lineas: 1, min: 40 })

  const cols = [
    ['Año', auto.anio],
    ['Kilómetros', auto.km != null ? miles(auto.km) : null],
    ['Combustible', titulo(auto.combustible ?? '')],
  ].filter(([, v]) => v)
  const ancho = (W - 2 * M) / cols.length
  y += 24 * k
  linea(ctx, M, y, W - 2 * M, p.linea, 2)
  cols.forEach(([clave, v], i) => {
    const x = M + i * ancho
    if (i) {
      ctx.fillStyle = p.linea
      ctx.fillRect(x - 16, y + 18 * k, 2, 84 * k)
    }
    texto1(ctx, String(v), x, y + 58 * k, { tam: 42 * k, peso: 700, color: p.texto, ancho: ancho - 32 })
    texto1(ctx, clave, x, y + 96 * k, { tam: 28 * k, peso: 400, color: p.suave })
  })
  y += 118 * k
  linea(ctx, M, y, W - 2 * M, p.linea, 2)
  texto1(ctx, precioTexto(auto, pieza), M, y + 104 * k, { tam: 82 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k, conLinea: false })
}

/* Titular: arriba un titular en Saira itálica sobre color liso, en el medio
   la foto con el borde de arriba en diagonal y abajo auto y precio. No se
   escribe sobre el auto. */
function titular(ctx, W, H, { auto, img, lg, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 520)
  let y = arriba + 80 * k
  y += bloque(ctx, pieza.titular || pieza.etiqueta || `${titulo(auto.marca)} ${auto.anio ?? ''}`.trim(), M, y, {
    ancho: W - 2 * M,
    tam: 100 * k,
    min: 64,
    lineas: 2,
    alto: 0.96,
    peso: 800,
    familia: 'Saira',
    italica: true,
    color: p.texto,
  })
  const fotoY = Math.round(y + 24 * k)
  const bandaAbajo = 214 * k + (H - pieY)
  const fin = H - bandaAbajo
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, fotoY + 110)
  ctx.lineTo(W, fotoY)
  ctx.lineTo(W, fin)
  ctx.lineTo(0, fin)
  ctx.closePath()
  ctx.clip()
  foto(ctx, img, 0, fotoY, W, fin - fotoY, { ...pieza.encuadre, focoY: 0.6 })
  ctx.restore()

  const by = fin + 30 * k
  texto1(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, by + 40 * k, { tam: 42 * k, peso: 600, color: p.texto, ancho: W - 2 * M })
  texto1(ctx, datosDe(auto), M, by + 88 * k, { tam: 34 * k, color: p.suave })
  texto1(ctx, precioTexto(auto, pieza), M, by + 168 * k, { tam: 72 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k })
}

/* Sangre: la foto ocupa toda la pieza y una banda de color entra desde abajo
   cortada en diagonal al ángulo de la itálica. El más "Paolini". */
function sangre(ctx, W, H, { auto, img, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  /* Se arma de abajo hacia arriba para que no quede aire muerto. */
  const precioBase = pieY - 50 * k
  const datosBase = precioBase - 104 * k
  const modeloY = datosBase - 34 * k - 104 * k
  const selloY = modeloY - 30 * k - 51 * k
  const bandaY = (pieza.etiqueta ? selloY : modeloY) - 34 * k
  foto(ctx, img, 0, 0, W, bandaY + 4, { ...pieza.encuadre, focoY: 0.85 })
  velo(ctx, 0, 0, W, arriba + 260, '#000000', [[0, 0.7], [1, 0]])
  logo(ctx, pieza._lgClaro, M, arriba, 560)
  cuna(ctx, W, H, bandaY + 4, p.fondo)
  if (pieza.etiqueta) sello(ctx, pieza.etiqueta, M, selloY, { tam: 32 * k, fondo: selloFondo(p) })
  modelo(ctx, titulo(auto.modelo), M, modeloY, { ancho: W - 2 * M, tam: 102 * k, color: p.texto, lineas: 1 })
  texto1(ctx, lineaDatos(auto), M, datosBase, { tam: 40 * k, color: p.suave, ancho: W - 2 * M })
  texto1(ctx, precioTexto(auto, pieza), M, precioBase, { tam: 90 * k, peso: 700, color: p.texto })
  pie(ctx, pieY, W, p, { k })
}

/* Precio: el número manda, para ofertas y nuevos precios. Arriba el precio
   enorme, después el auto y la foto con corte diagonal. */
function precio(ctx, W, H, { auto, img, lg, p, pieza }) {
  if (!pieza.mostrarPrecio || !precioDe(auto)) return sangre(ctx, W, H, { auto, img, lg, p, pieza })
  const { k, arriba, pieY } = zonas(H)
  logo(ctx, lg, M, arriba, 520)
  let y = arriba + 84 * k
  if (pieza.etiqueta) y += sello(ctx, pieza.etiqueta, M, y, { tam: 32 * k, fondo: selloFondo(p) }) + 26 * k
  /* Archivo Black lo más grande que entre en el ancho. */
  let t = 160 * k
  for (; t > 100; t -= 4) {
    fuente(ctx, 900, t)
    if (ctx.measureText(precioDe(auto)).width <= W - 2 * M) break
  }
  ctx.fillStyle = p.texto
  ctx.fillText(precioDe(auto), M, y + t * 0.74)
  y += t * 0.74 + 44 * k
  y += modelo(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y, { ancho: W - 2 * M, tam: 56 * k, color: p.texto, lineas: 1, min: 38 })
  texto1(ctx, datosDe(auto), M, y + 44 * k, { tam: 38 * k, color: p.suave })
  /* El lado alto de la diagonal sube a la par del renglón de datos (que es
     corto y va a la izquierda), así la foto gana alto sin pisar texto. */
  const fotoY = Math.round(y + 16 * k)
  const fin = pieY - 56 * k
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, fotoY + CAIDA)
  ctx.lineTo(W, fotoY)
  ctx.lineTo(W, fin)
  ctx.lineTo(0, fin)
  ctx.closePath()
  ctx.clip()
  foto(ctx, img, 0, fotoY, W, fin - fotoY, pieza.encuadre)
  ctx.restore()
  pie(ctx, pieY, W, p, { k, conLinea: false })
}

/* La foto con el color apagado al 60 % (para "vendido": que se lea como
   festejo, no como baja). Se hace a mano: el filtro del canvas no anda en
   todos lados. */
function fotoApagada(img, cuanto = 0.6) {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const datos = g.getImageData(0, 0, c.width, c.height)
  const d = datos.data
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
    d[i] += (v - d[i]) * cuanto
    d[i + 1] += (v - d[i + 1]) * cuanto
    d[i + 2] += (v - d[i + 2]) * cuanto
  }
  g.putImageData(datos, 0, 0)
  return c
}

/* Vendido / reservado / entregado: el auto y un cierre corto arriba, y la
   palabra en un sello rojo gigante que cruza el borde de la foto. Nunca
   lleva precio y va siempre sobre hueso. */
function vendido(ctx, W, H, { auto, img, lg, p, pieza }) {
  const { k, arriba, pieY } = zonas(H)
  let y = arriba
  logo(ctx, lg, M, y, 520)
  y += 84 * k
  modelo(ctx, `${titulo(auto.marca)} ${titulo(auto.modelo)}`, M, y, { ancho: W - 2 * M, tam: 64 * k, color: p.texto, lineas: 1, min: 40 })
  y += 70 * k
  const cierre = pieza.bajada || pieza.titular
  if (cierre) {
    texto1(ctx, cierre, M, y + 44 * k, { tam: 40 * k, peso: 400, color: p.suave, ancho: W - 2 * M })
    y += 50 * k
  }
  const selloY = y + 36 * k
  const alto = 130 * k * 1.75
  const fotoY = Math.round(selloY + alto - 40 * k)
  foto(ctx, fotoApagada(img), 0, fotoY, W, pieY - 40 * k - fotoY, pieza.encuadre)
  sello(ctx, pieza.etiqueta || 'Vendido', M - 8, selloY, { tam: 130 * k, color: PALETAS.hueso.fondo })
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
  let p = (rojo && pieza.fondo === 'rojo' ? PALETAS.negro : PALETAS[pieza.fondo]) ?? PALETAS.negro
  /* "Vendido" va en rojo: sólo se lee fuerte sobre hueso. */
  if (pieza.diseno === 'vendido') p = PALETAS.hueso
  /* El rojo lleno sólo donde el bloque de color es grande y tiene
     intención (ficha, sangre, precio); en titular pasa a hueso. */
  if (pieza.diseno === 'titular' && p === PALETAS.rojo) p = PALETAS.hueso
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
