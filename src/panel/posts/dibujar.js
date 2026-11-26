/* Dibuja las piezas de Instagram del asistente en un <canvas>.

   La IA no dibuja nada: elige el diseño, las fotos, los textos y el orden
   (ver api/_asistente.js) y acá se arma la pieza con las fotos reales que
   subieron al panel, el logo vectorial y las fuentes del sitio, siguiendo la
   plantilla de los flyers que Paolini ya usa en su Instagram.

   Formatos: post 1080×1350 (4:5, el que mejor ocupa el feed) e historia
   1080×1920. */

export const FORMATOS = {
  post: { ancho: 1080, alto: 1350, nombre: 'Post' },
  historia: { ancho: 1080, alto: 1920, nombre: 'Historia' },
}

export const DISENOS = ['collage', 'oferta', 'vendido']

const NEGOCIO = { whatsapp: '3548 468411' }

/* El rojo del logo (distinto del rojo del sitio, que es el de los acentos). */
const ROJO = '#A8162A'

/* ── Textos ────────────────────────────────────────────────────────────── */

const palabra = (p) => (p.length <= 3 || /\d/.test(p) ? p : p[0] + p.slice(1).toLowerCase())
export const titulo = (s = '') => s.trim().split(/\s+/).map(palabra).join(' ')
const miles = (n) => Number(n).toLocaleString('es-AR')
export const precioDe = (auto) => (auto.precio ? `$ ${miles(auto.precio)}` : null)

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
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@1,700;1,800&display=swap'
    document.head.appendChild(link)
    fuentes = new Promise((ok) => {
      link.onload = ok
      link.onerror = ok
    }).then(() =>
      Promise.all(
        ['italic 800 80px Montserrat', 'italic 700 80px Montserrat'].map((f) =>
          document.fonts.load(f),
        ),
      ),
    )
  }
  return fuentes
}

/* ── Primitivas ────────────────────────────────────────────────────────── */

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

const RUTA_WPP = new Path2D(
  'M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.07-1.33A9.93 9.93 0 1 0 12.04 2Zm0 1.67a8.26 8.26 0 1 1-4.2 15.37l-.3-.18-3 .79.8-2.93-.2-.31A8.26 8.26 0 0 1 12.04 3.67Z',
)

/* ── La plantilla de Paolini, tal cual ─────────────────────────────────── */

/* Calcada de los flyers que Paolini ya publica en su Instagram (medidas
   tomadas de sus piezas, pasadas a 1080 de ancho). Dos plantillas:

   - collage: hasta 3 fotos del mismo auto apiladas con cortes apenas
     inclinados y sombra; el modelo en Montserrat itálica (la primera palabra
     en blanco, el resto en rojo) con una raya roja fina que entra desde el
     borde; el logo abajo a la izquierda; la barra "¡No dudes en contactarte
     con nosotros!" con el WhatsApp en un bloque rojo inclinado.
   - oferta: el logo arriba al centro, el nombre grande con su copia gris
     detrás, la foto, la etiqueta roja ("ENTREGA INMEDIATA") y una banda gris
     con la frase grande; abajo la frase de cierre y el WhatsApp centrados.

   El único retoque: el logo vectorial nítido y bordes limpios. Sin precio,
   salvo que lo pidan. */

const NEGRO = '#010101'
const ROJO_FLYER = '#E30613'
const BLANCO = '#FFFFFF'
const CIERRE = '¡No dudes en contactarte con nosotros!'
const LETRA = 'Montserrat'

/* Las uniones entre fotos suben un poco hacia la derecha, como en sus flyers. */
const DESNIVEL = 60

const hist = (H) => H > 1500

/* La barra de abajo: alto y dónde empieza. En las historias termina en
   y = 1560 (debajo va la interfaz de Instagram). */
const barraDe = (H) => (hist(H) ? { y: 1560 - 108, alto: 108 } : { y: H - 108, alto: 108 })

function m(ctx, peso, tam) {
  ctx.font = `italic ${peso} ${tam}px ${LETRA}, sans-serif`
}

function sombraTexto(ctx, blur = 16) {
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = blur
  ctx.shadowOffsetY = 3
}

/* El ícono de WhatsApp en blanco, de lado `lado`, con la esquina en (x, y). */
function iconoWpp(ctx, x, y, lado) {
  ctx.save()
  ctx.fillStyle = BLANCO
  ctx.translate(x, y)
  ctx.scale(lado / 24, lado / 24)
  ctx.fill(RUTA_WPP)
  ctx.restore()
}

/* Barra del collage: la frase a la izquierda sobre negro y el bloque rojo
   inclinado con el WhatsApp a la derecha. */
function barraCollage(ctx, W, H, cierre = CIERRE, derecha = null) {
  const { y, alto } = barraDe(H)
  ctx.fillStyle = NEGRO
  ctx.fillRect(0, y + 22, W, H - y - 22)
  const x0 = 648
  ctx.fillStyle = ROJO_FLYER
  ctx.beginPath()
  ctx.moveTo(x0 + 28, y)
  ctx.lineTo(W, y)
  ctx.lineTo(W, y + alto)
  ctx.lineTo(x0, y + alto)
  ctx.closePath()
  ctx.fill()
  const base = y + alto / 2 + 22
  if (derecha) {
    m(ctx, 800, 30)
    ctx.fillStyle = BLANCO
    ctx.textAlign = 'center'
    ctx.fillText(derecha, (x0 + 14 + W) / 2, base - 4)
    ctx.textAlign = 'left'
  } else {
    iconoWpp(ctx, x0 + 40, y + (alto - 54) / 2, 54)
    m(ctx, 800, 48)
    ctx.fillStyle = BLANCO
    ctx.fillText(NEGOCIO.whatsapp, x0 + 106, base - 4)
  }
  m(ctx, 700, 29)
  let t = 29
  while (ctx.measureText(cierre).width > x0 - 50 && t > 22) m(ctx, 700, (t -= 1))
  ctx.fillStyle = BLANCO
  ctx.fillText(cierre, 30, base - 6)
}

/* El modelo como en sus flyers: primera palabra blanca, el resto rojo, con
   una raya roja fina que entra desde el borde. `y` es la base del texto. */
function nombreFlyer(ctx, texto, x, y, tam, ancho) {
  const [primera, ...resto] = texto.split(' ')
  const segunda = resto.join(' ')
  let t = tam
  m(ctx, 800, t)
  while (ctx.measureText(texto).width > ancho && t > 30) m(ctx, 800, (t -= 2))
  const w1 = ctx.measureText(primera + (segunda ? ' ' : '')).width
  const total = ctx.measureText(texto).width
  ctx.fillStyle = ROJO_FLYER
  ctx.fillRect(0, y + t * 0.14, x + total * 0.96, Math.max(4, t * 0.08))
  ctx.save()
  sombraTexto(ctx, 14)
  ctx.fillStyle = BLANCO
  ctx.fillText(primera, x, y)
  if (segunda) {
    ctx.fillStyle = ROJO_FLYER
    ctx.fillText(segunda, x + w1, y)
  }
  ctx.restore()
}

/* La etiqueta roja de sus flyers ("ENTREGA INMEDIATA"): bloque rojo con el
   extremo derecho inclinado y el texto blanco en mayúsculas. */
function etiquetaFlyer(ctx, texto, y, tam = 30) {
  const t = texto.toUpperCase()
  m(ctx, 800, tam)
  const w = ctx.measureText(t).width + 40
  const h = tam * 2.3
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, ROJO_FLYER)
  g.addColorStop(1, '#A50410')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(w + h * 0.45, y)
  ctx.lineTo(w, y + h)
  ctx.lineTo(0, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.save()
  sombraTexto(ctx, 8)
  ctx.fillStyle = BLANCO
  ctx.fillText(t, 16, y + h / 2 + tam * 0.36)
  ctx.restore()
  return h
}

/* Oscurece los bordes de la foto, como en sus flyers. */
function vineta(ctx, x, y, w, h, fuerza = 0.5) {
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${fuerza})`)
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

/* Reparte las fotos en paneles apilados con uniones apenas inclinadas y una
   sombra en cada unión. `cortes` son las alturas de cada unión en x = 0. */
function apilar(ctx, W, imgs, cortes, fin) {
  const bordes = [0, ...cortes, fin]
  imgs.forEach((img, i) => {
    const y0 = bordes[i]
    const y1 = bordes[i + 1]
    const arriba = i === 0 ? 0 : DESNIVEL
    const abajo = i === imgs.length - 1 ? 0 : DESNIVEL
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, y0)
    ctx.lineTo(W, y0 - arriba)
    ctx.lineTo(W, y1 - abajo)
    ctx.lineTo(0, y1)
    ctx.closePath()
    ctx.clip()
    const top = y0 - arriba
    foto(ctx, img, 0, top, W, y1 - top, { focoY: i === imgs.length - 1 ? 0.55 : 0.5 })
    vineta(ctx, 0, top, W, y1 - top, 0.45)
    ctx.restore()
  })
  for (const y of cortes) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'
    ctx.lineWidth = 6
    ctx.shadowColor = 'rgba(0,0,0,0.95)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 6
    ctx.beginPath()
    ctx.moveTo(-10, y)
    ctx.lineTo(W + 10, y - DESNIVEL)
    ctx.stroke()
    ctx.restore()
  }
}

const nombreDe = (auto) => (auto.modelo ?? '').trim().toUpperCase()
const precioPieza = (auto, pieza) => (pieza.mostrarPrecio && precioDe(auto)) || null

/* Collage (o una sola foto si no hay más): como su flyer del 208 GT. */
function plantillaCollage(ctx, W, H, { auto, imgs, lg, pieza }, opciones = {}) {
  const { y: barraY } = barraDe(H)
  const fin = barraY + 22
  const [principal, ...extras] = imgs
  const otras = extras.slice(0, 2)
  /* Proporciones de su flyer: arriba 28 %, medio 24 %, el auto el resto. */
  const reparto = otras.length === 2 ? [0.28, 0.52] : otras.length === 1 ? [0.42] : []
  const cortes = reparto.map((r) => Math.round(fin * r + DESNIVEL / 2))
  apilar(ctx, W, [...otras, principal], cortes, fin)
  /* El auto se funde en negro hacia la barra, donde va el logo. */
  velo(ctx, 0, barraY - 300, W, 322, NEGRO, [[0, 0], [0.6, 0.55], [1, 0.9]])

  /* El nombre: un poco abajo del último corte, como en su flyer. */
  const yNombre = (cortes.at(-1) ?? (hist(H) ? 320 : 120)) + 112
  let yEtiqueta = yNombre - 64 - 64
  if (pieza.etiqueta) etiquetaFlyer(ctx, pieza.etiqueta, yEtiqueta, 26)
  nombreFlyer(ctx, nombreDe(auto), 172, yNombre, 66, W - 240)
  const precio = precioPieza(auto, pieza)
  if (precio) {
    m(ctx, 800, 44)
    ctx.save()
    sombraTexto(ctx)
    ctx.fillStyle = BLANCO
    ctx.fillText(precio, 172, yNombre + 70)
    ctx.restore()
  }
  const ancho = 436
  ctx.drawImage(lg, 32, barraY - 50 - (ancho * lg.height) / lg.width, ancho, (ancho * lg.height) / lg.width)
  barraCollage(ctx, W, H, opciones.cierre, opciones.derecha)
}

/* Oferta: como su flyer del Peugeot 208 blanco. */
function plantillaOferta(ctx, W, H, { auto, imgs, lg, pieza }, opciones = {}) {
  const arriba = hist(H) ? 230 : 0
  const fotoY = arriba + 352
  const bandaY = hist(H) ? 1290 : 1040
  const bandaAlto = 100
  /* Arriba, la misma foto oscurecida y desenfocada, como fondo del título. */
  ctx.save()
  ctx.filter = 'blur(18px) brightness(0.45)'
  foto(ctx, imgs[0], -40, -40, W + 80, fotoY + 80, { focoY: 0.3 })
  ctx.restore()
  /* Si el navegador no sabe desenfocar (Safari viejo), se oscurece más. */
  ctx.fillStyle = 'filter' in ctx ? 'rgba(1,1,1,0.35)' : 'rgba(1,1,1,0.7)'
  ctx.fillRect(0, 0, W, fotoY)
  /* La foto de una entrega suele ser vertical, con la persona y el auto en
     la mitad de abajo: el recorte baja para que no queden afuera. */
  foto(ctx, imgs[0], 0, fotoY, W, bandaY - fotoY, { focoY: auto.entrega ? 0.72 : 0.6 })
  vineta(ctx, 0, fotoY, W, bandaY - fotoY, 0.35)
  ctx.fillStyle = NEGRO
  ctx.fillRect(0, bandaY + bandaAlto, W, H - bandaY - bandaAlto)

  const ancho = 436
  ctx.drawImage(lg, (W - ancho) / 2, arriba + 30, ancho, (ancho * lg.height) / lg.width)
  const n = `${titulo(auto.marca ?? '')} ${nombreDe(auto)}`.trim().toUpperCase().replace(/^(\S+) \1 /, '$1 ')
  let t = 96
  m(ctx, 800, t)
  while (ctx.measureText(n).width > W - 140 && t > 50) m(ctx, 800, (t -= 2))
  /* La copia gris detrás, más grande y más arriba, como en su flyer. */
  const tg = t * 1.25
  m(ctx, 800, tg)
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.fillText(n, W / 2, arriba + 272, W - 60)
  m(ctx, 800, t)
  ctx.save()
  sombraTexto(ctx, 18)
  ctx.fillStyle = BLANCO
  ctx.fillText(n, W / 2, arriba + 350)
  ctx.restore()
  ctx.textAlign = 'left'

  /* Etiqueta roja sobre la foto y banda gris con la frase. */
  if (pieza.etiqueta) etiquetaFlyer(ctx, pieza.etiqueta, bandaY - 72, 28)
  const g = ctx.createLinearGradient(0, bandaY, 0, bandaY + bandaAlto)
  g.addColorStop(0, '#9B9B9B')
  g.addColorStop(1, '#6E6E6E')
  ctx.fillStyle = g
  ctx.fillRect(0, bandaY, W, bandaAlto)
  const frase = (opciones.frase || pieza.titular || precioPieza(auto, pieza) || 'Consultanos').toUpperCase()
  let tf = 74
  m(ctx, 800, tf)
  while (ctx.measureText(frase).width > W - 60 && tf > 36) m(ctx, 800, (tf -= 2))
  ctx.save()
  sombraTexto(ctx, 10)
  ctx.fillStyle = BLANCO
  ctx.textAlign = 'center'
  ctx.fillText(frase, W / 2, bandaY + bandaAlto / 2 + tf * 0.36)
  ctx.restore()

  /* Cierre centrado: la frase y el WhatsApp grande. */
  const cierre = opciones.cierre || CIERRE
  m(ctx, 700, 36)
  ctx.fillStyle = BLANCO
  ctx.textAlign = 'center'
  ctx.fillText(cierre, W / 2, bandaY + bandaAlto + 76)
  ctx.textAlign = 'left'
  if (opciones.derecha) {
    m(ctx, 800, 44)
    ctx.textAlign = 'center'
    ctx.fillText(opciones.derecha, W / 2, bandaY + bandaAlto + 156)
    ctx.textAlign = 'left'
  } else {
    m(ctx, 800, 72)
    const wn = ctx.measureText(NEGOCIO.whatsapp).width
    const lado = 76
    const x = (W - (lado + 24 + wn)) / 2
    iconoWpp(ctx, x, bandaY + bandaAlto + 108, lado)
    ctx.fillText(NEGOCIO.whatsapp, x + lado + 24, bandaY + bandaAlto + 172)
  }
}

/* Vendido / entregado: la misma oferta con la etiqueta "VENDIDO" y la banda
   con el agradecimiento; abajo, en vez del teléfono, el sitio. */
function plantillaVendido(ctx, W, H, d) {
  const pieza = { ...d.pieza, etiqueta: d.pieza.etiqueta || 'Vendido', mostrarPrecio: false }
  const gracias = d.pieza.bajada || d.pieza.titular || '¡Gracias por confiar en nosotros!'
  plantillaOferta(ctx, W, H, { ...d, pieza }, { frase: gracias, cierre: 'Buscá el tuyo en', derecha: 'paoliniautomotores.com' })
}

/* Qué diseño se puede hacer con cuántas fotos ("foco" queda como collage de
   una sola foto). */
const PLANTILLAS = {
  collage: { dibujar: plantillaCollage, fotos: 1 },
  foco: { dibujar: plantillaCollage, fotos: 1 },
  oferta: { dibujar: plantillaOferta, fotos: 1 },
  vendido: { dibujar: plantillaVendido, fotos: 1 },
}

/* Las fotos del auto en el orden en que se usan: primero la principal (el
   auto entero) y después interior y detalles. Si el asistente eligió un
   orden (`pieza.fotos`, índices de auto.fotos), se respeta. */
function fotosDe(auto, pieza) {
  const todas = [{ url: auto.foto, tipo: 'exterior' }, ...(auto.fotos ?? []).filter((f) => f?.url && f.url !== auto.foto)]
  if (Array.isArray(pieza.fotos) && pieza.fotos.length) {
    /* La principal (la 0) va siempre primera: el collage la pone abajo, con
       el nombre; las demás, en el orden que eligió el asistente. */
    const elegidas = [...new Set(pieza.fotos)].sort((a, b) => (a === 0 ? -1 : b === 0 ? 1 : 0)).map((i) => todas[i]).filter(Boolean)
    if (elegidas.length) return elegidas
  }
  const orden = ['interior', 'detalle', 'trasera', 'frente', 'lateral', 'exterior']
  const extras = todas.slice(1).sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo))
  return [todas[0], ...extras]
}

/* ── Entrada ───────────────────────────────────────────────────────────── */

/* Dibuja la pieza en `canvas`. `pieza` viene del asistente:
   { diseno, formato, fotos, etiqueta, titular, bajada, mostrarPrecio } y
   `auto` es la unidad del stock con `foto` (la principal) y `fotos` (las
   extra, con su tipo: interior, detalle, trasera…). */
export async function dibujarPieza(canvas, pieza, auto) {
  const { ancho: W, alto: H } = FORMATOS[pieza.formato] ?? FORMATOS.post
  const lista = fotosDe(auto, pieza)
  const [cargadas, lgs] = await Promise.all([
    Promise.all(lista.map((f) => cargarImagen(f.url).catch(() => null))),
    cargarLogos(),
    cargarFuentes(),
  ])
  const imgs = cargadas.filter(Boolean)
  if (!imgs.length) throw new Error('No se pudo cargar la foto')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = NEGRO
  ctx.fillRect(0, 0, W, H)
  let plantilla = PLANTILLAS[pieza.diseno] ?? PLANTILLAS.collage
  /* Si no hay fotos suficientes para el collage, va una sola foto. */
  if (imgs.length < plantilla.fotos) plantilla = PLANTILLAS.foco
  plantilla.dibujar(ctx, W, H, { auto, imgs, lg: lgs.claro, pieza })
}

/* El PNG listo para bajar o compartir. */
export const aPng = (canvas) => new Promise((ok) => canvas.toBlob(ok, 'image/png'))
