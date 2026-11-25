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

export const DISENOS = ['collage', 'foco', 'oferta', 'vendido']

const NEGOCIO = { whatsapp: '3548 468411' }

/* El rojo del logo (distinto del rojo del sitio, que es el de los acentos). */
const ROJO = '#A8162A'

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

const RUTA_WPP = new Path2D(
  'M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.07-1.33A9.93 9.93 0 1 0 12.04 2Zm0 1.67a8.26 8.26 0 1 1-4.2 15.37l-.3-.18-3 .79.8-2.93-.2-.31A8.26 8.26 0 0 1 12.04 3.67Z',
)

/* ── La plantilla de Paolini ───────────────────────────────────────────── */

/* Calcada de los flyers que ya publican en su Instagram (collage de fotos
   del mismo auto separadas en diagonal, el modelo en itálica con la segunda
   palabra en rojo y una raya roja que entra desde el borde, el logo abajo y
   la barra "¡No dudes en contactarte con nosotros!" con el WhatsApp en un
   bloque rojo), con toques del sitio: el negro #010101, el rojo #E0323F, la
   Saira itálica de los títulos y el precio. */

const NEGRO = '#010101'
const ROJO_WEB = '#E0323F'
const BLANCO = '#FFFFFF'
const CIERRE = '¡No dudes en contactarte con nosotros!'

/* Las uniones entre fotos suben hacia la derecha, como en sus flyers, un
   poco más inclinadas: el ángulo de la itálica del sitio. */
const DESNIVEL = 120

const zonas = (H) => {
  const hist = H > 1500
  /* En las historias la barra termina en y = 1560 (debajo va la interfaz
     de Instagram) y nada importante arriba de 250. */
  const barraAlto = hist ? 140 : 118
  const barraY = hist ? 1560 - barraAlto : H - barraAlto
  return { hist, k: hist ? 1.2 : 1, barraY, barraAlto, arriba: hist ? 250 : 0 }
}

/* La barra de cierre: el texto de ellos a la izquierda y el WhatsApp en un
   bloque rojo con el lado izquierdo inclinado. */
function barra(ctx, W, H, { barraY, barraAlto, k }) {
  ctx.fillStyle = NEGRO
  ctx.fillRect(0, barraY, W, H - barraY)
  const tam = 46 * k
  fuente(ctx, 800, tam, 'Saira', true)
  const numero = NEGOCIO.whatsapp
  const icono = tam * 1.05
  const bloqueW = ctx.measureText(numero).width + icono + 26 + 70
  const x0 = W - bloqueW
  const inclinacion = barraAlto * 0.32
  ctx.fillStyle = ROJO_WEB
  ctx.beginPath()
  ctx.moveTo(x0 + inclinacion, barraY)
  ctx.lineTo(W, barraY)
  ctx.lineTo(W, barraY + barraAlto)
  ctx.lineTo(x0, barraY + barraAlto)
  ctx.closePath()
  ctx.fill()
  const base = barraY + barraAlto / 2 + tam * 0.36
  ctx.save()
  ctx.fillStyle = BLANCO
  const e = icono / 24
  ctx.translate(x0 + inclinacion + 14, barraY + (barraAlto - icono) / 2)
  ctx.scale(e, e)
  ctx.fill(RUTA_WPP)
  ctx.restore()
  ctx.fillStyle = BLANCO
  ctx.fillText(numero, x0 + inclinacion + 14 + icono + 16, base)
  /* El texto de cierre achica si no entra al lado del bloque. */
  const libre = x0 - 40 - 36
  let t = 32 * k
  fuente(ctx, 700, t, 'Saira', true)
  while (ctx.measureText(CIERRE).width > libre && t > 26) fuente(ctx, 700, (t -= 1), 'Saira', true)
  ctx.fillText(CIERRE, 36, barraY + barraAlto / 2 + t * 0.36)
  /* En las historias, debajo de la barra (donde Instagram pone su
     interfaz) va la dirección del sitio, chica: ahí está todo el stock. */
  if (H > 1500) {
    fuente(ctx, 700, 34, 'Saira', true)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.textAlign = 'center'
    ctx.fillText('paoliniautomotores.com', W / 2, barraY + barraAlto + 70)
    ctx.textAlign = 'left'
  }
}

/* El nombre del modelo como en sus flyers: itálica gruesa, la primera
   palabra en blanco y el resto en rojo, con sombra para leerse sobre la
   foto y una raya roja que entra desde el borde izquierdo. Devuelve el
   ancho que ocupó. */
function nombre(ctx, texto, x, y, { tam, ancho }) {
  const [primera, ...resto] = texto.split(' ')
  const segunda = resto.join(' ')
  let t = tam
  const medir = () => {
    fuente(ctx, 800, t, 'Saira', true)
    return ctx.measureText(primera + (segunda ? ' ' + segunda : '')).width
  }
  while (medir() > ancho && t > tam * 0.5) t -= 2
  const w1 = ctx.measureText(primera + (segunda ? ' ' : '')).width
  const total = medir()
  /* La raya: del borde hasta un poco después del nombre, con la punta
     cortada en diagonal. */
  const ry = y + t * 0.12
  const rh = Math.max(7, t * 0.09)
  ctx.fillStyle = ROJO_WEB
  ctx.beginPath()
  ctx.moveTo(0, ry)
  ctx.lineTo(x + total + 46, ry)
  ctx.lineTo(x + total + 46 - rh * 1.2, ry + rh)
  ctx.lineTo(0, ry + rh)
  ctx.closePath()
  ctx.fill()
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.75)'
  ctx.shadowBlur = t * 0.35
  ctx.shadowOffsetY = t * 0.04
  ctx.fillStyle = BLANCO
  ctx.fillText(primera, x, y)
  if (segunda) {
    ctx.fillStyle = ROJO_WEB
    ctx.fillText(segunda, x + w1, y)
  }
  ctx.restore()
  return total
}

/* Una etiqueta como el "ENTREGA INMEDIATA" de sus flyers: bloque rojo
   inclinado con el texto en mayúsculas. */
function etiquetaRoja(ctx, texto, x, y, { tam = 30 }) {
  const t = texto.toUpperCase()
  fuente(ctx, 800, tam, 'Saira', true)
  const h = tam * 1.7
  const inc = h * 0.3
  const w = ctx.measureText(t).width + tam * 1.3 + inc
  ctx.fillStyle = ROJO_WEB
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w + inc, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = BLANCO
  ctx.fillText(t, x + tam * 0.6, y + h / 2 + tam * 0.36)
  return h
}

/* Oscurece los bordes de la foto, como en sus flyers. */
function vineta(ctx, x, y, w, h, fuerza = 0.55) {
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${fuerza})`)
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

/* Reparte las fotos en paneles apilados con uniones en diagonal. `cortes`
   son las alturas de cada unión (en x = 0); la unión sube DESNIVEL hacia la
   derecha. Cada panel lleva su foto, su viñeta y una sombra en la unión. */
function collage(ctx, W, imgs, cortes, tope, fin) {
  const bordes = [tope, ...cortes, fin]
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
    foto(ctx, img, 0, top, W, y1 - top, { focoY: i === imgs.length - 1 ? 0.6 : 0.5 })
    vineta(ctx, 0, top, W, y1 - top, 0.5)
    ctx.restore()
  })
  /* Las uniones: una línea negra con sombra, para que cada foto parezca
     apoyada sobre la de abajo. */
  for (const y of cortes) {
    ctx.save()
    ctx.strokeStyle = NEGRO
    ctx.lineWidth = 8
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 28
    ctx.beginPath()
    ctx.moveTo(-10, y + DESNIVEL / W * 10)
    ctx.lineTo(W + 10, y - DESNIVEL - DESNIVEL / W * 10)
    ctx.stroke()
    ctx.restore()
  }
}

/* El precio, en el idioma de la plantilla: un bloque blanco inclinado con
   la cifra en Saira itálica negra, apoyado con su borde de abajo en `base`
   y alineado a la derecha. Devuelve dónde empieza (arriba). */
function chipPrecio(ctx, W, precio, base, k) {
  const tam = 70 * k
  fuente(ctx, 800, tam, 'Saira', true)
  const h = 96 * k
  const inc = h * 0.21
  const w = ctx.measureText(precio).width + tam * 0.8 + inc
  const x = W - 40 - w
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 24
  ctx.fillStyle = BLANCO
  ctx.beginPath()
  ctx.moveTo(x + inc, base - h)
  ctx.lineTo(W - 40, base - h)
  ctx.lineTo(W - 40 - inc, base)
  ctx.lineTo(x, base)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#111111'
  ctx.fillText(precio, x + inc / 2 + tam * 0.4, base - h / 2 + tam * 0.36)
  return base - h
}

/* El pie de la foto: el logo solo a la izquierda y, si va, el precio a la
   derecha, apoyados sobre la barra con un degradé a negro. */
function piePlantilla(ctx, W, { lg, barraY, k }, precio) {
  velo(ctx, 0, barraY - 260 * k, W, 262 * k, NEGRO, [[0, 0], [0.55, 0.75], [1, 1]])
  const ancho = 360
  const logoAlto = (ancho * lg.height) / lg.width
  ctx.drawImage(lg, 36, barraY - 40 * k - logoAlto, ancho, logoAlto)
  if (precio) chipPrecio(ctx, W, precio, barraY - 24 * k, k)
}

const precioPieza = (auto, pieza) => (pieza.mostrarPrecio && precioDe(auto)) || null
const nombreDe = (auto) => (auto.modelo ?? '').trim().toUpperCase()

/* Collage de 3 (o 2) fotos: arriba el interior, en el medio un detalle y
   abajo el auto entero con el nombre. */
function plantillaCollage(ctx, W, H, d) {
  const { auto, imgs, pieza } = d
  const z = zonas(H)
  const { k, barraY } = z
  const [principal, ...extras] = imgs
  const otras = extras.slice(0, 2)
  const tope = 0
  const fin = barraY
  /* El auto entero ocupa ~52 % y las demás se reparten el resto. */
  const altoPrincipal = (fin - tope) * (otras.length === 2 ? 0.5 : 0.58)
  const resto = fin - tope - altoPrincipal
  const cortes = otras.map((_, i) => tope + (resto / otras.length) * (i + 1) + DESNIVEL * 0.25)
  collage(ctx, W, [...otras, principal], cortes, tope, fin)

  /* Nombre y etiqueta arriba del panel del auto entero. */
  const yNombre = cortes.at(-1) + 40 * k + 96 * k
  if (pieza.etiqueta) etiquetaRoja(ctx, pieza.etiqueta, 0, cortes.at(-1) + 20 * k, { tam: 28 * k })
  nombre(ctx, nombreDe(auto), 40, yNombre + (pieza.etiqueta ? 40 * k : 0), { tam: 100 * k, ancho: W - 120 })
  piePlantilla(ctx, W, { ...d, ...z }, precioPieza(auto, pieza))
  barra(ctx, W, H, z)
}

/* Foco: una sola foto con el borde de abajo en diagonal y, debajo, una
   placa negra con la etiqueta, el nombre, la ficha y el precio. */
function plantillaFoco(ctx, W, H, d) {
  const { auto, imgs, pieza } = d
  const z = zonas(H)
  const { k, barraY } = z
  const etiqueta = pieza.etiqueta || pieza.titular
  /* La placa se arma de abajo hacia arriba. */
  const pieAlto = 140 * k
  const fichaBase = barraY - pieAlto - 24 * k
  const nombreBase = fichaBase - 58 * k
  const etiquetaY = nombreBase - 100 * k - 62 * k
  const fotoFin = (etiqueta ? etiquetaY : nombreBase - 110 * k) - 34 * k
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, fotoFin - DESNIVEL)
  ctx.lineTo(0, fotoFin)
  ctx.closePath()
  ctx.clip()
  foto(ctx, imgs[0], 0, 0, W, fotoFin, { focoY: 0.6 })
  vineta(ctx, 0, 0, W, fotoFin, 0.5)
  ctx.restore()
  /* La sombra sobre el corte, como entre las fotos del collage. */
  ctx.save()
  ctx.strokeStyle = NEGRO
  ctx.lineWidth = 8
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = 28
  ctx.beginPath()
  ctx.moveTo(-10, fotoFin + 1)
  ctx.lineTo(W + 10, fotoFin - DESNIVEL - 1)
  ctx.stroke()
  ctx.restore()

  if (etiqueta) etiquetaRoja(ctx, etiqueta, 0, etiquetaY, { tam: 30 * k })
  nombre(ctx, nombreDe(auto), 40, nombreBase, { tam: 104 * k, ancho: W - 120 })
  fuente(ctx, 600, 36 * k, 'Saira', true)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText([titulo(auto.marca), datosDe(auto)].filter(Boolean).join('  ·  '), 40, fichaBase)
  piePlantilla(ctx, W, { ...d, ...z }, precioPieza(auto, pieza))
  barra(ctx, W, H, z)
}

/* Oferta: como su flyer del 208 blanco. Logo arriba, el nombre grande con
   su sombra calada detrás, la foto, la etiqueta roja y una banda clara con
   la frase grande. */
function plantillaOferta(ctx, W, H, d) {
  const { auto, imgs, lg, pieza } = d
  const z = zonas(H)
  const { k, barraY, arriba } = z
  ctx.fillStyle = NEGRO
  ctx.fillRect(0, 0, W, H)
  const fotoY = arriba + 330 * k
  const bandaAlto = 120 * k
  const fotoFin = barraY - bandaAlto - 40 * k
  foto(ctx, imgs[0], 0, fotoY, W, fotoFin - fotoY, { focoY: 0.6 })
  vineta(ctx, 0, fotoY, W, fotoFin - fotoY, 0.6)
  velo(ctx, 0, fotoY, W, 200, NEGRO, [[0, 1], [1, 0]])
  velo(ctx, 0, fotoFin - 220, W, 222, NEGRO, [[0, 0], [1, 0.9]])

  const logoAlto = (440 * lg.height) / lg.width
  ctx.drawImage(lg, (W - 440) / 2, arriba + 56 * k, 440, logoAlto)
  /* El nombre: una copia grande y apagada detrás, y la sólida adelante. */
  const n = `${titulo(auto.marca)} ${nombreDe(auto)}`.toUpperCase()
  let t = 130 * k
  fuente(ctx, 800, t, 'Saira', true)
  while (ctx.measureText(n).width > W - 80 && t > 60) fuente(ctx, 800, (t -= 2), 'Saira', true)
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillText(n, W / 2 - 14, arriba + 250 * k - t * 0.3)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 24
  ctx.fillStyle = BLANCO
  ctx.fillText(n, W / 2, arriba + 250 * k + t * 0.25)
  ctx.restore()
  ctx.textAlign = 'left'

  /* Etiqueta y banda clara con la frase (o el precio). */
  const bandaY = barraY - bandaAlto - 20 * k
  if (pieza.etiqueta) etiquetaRoja(ctx, pieza.etiqueta, 0, bandaY - 64 * k, { tam: 28 * k })
  const g = ctx.createLinearGradient(0, bandaY, 0, bandaY + bandaAlto)
  g.addColorStop(0, '#F2F2F2')
  g.addColorStop(1, '#B9B9B9')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, bandaY)
  ctx.lineTo(W - 40, bandaY)
  ctx.lineTo(W - 40 - bandaAlto * 0.3, bandaY + bandaAlto)
  ctx.lineTo(0, bandaY + bandaAlto)
  ctx.closePath()
  ctx.fill()
  const precio = precioPieza(auto, pieza)
  if (pieza.titular && precio) chipPrecio(ctx, W, precio, bandaY - 18 * k, k)
  const frase = (pieza.titular || precio || 'Consultá el precio').toUpperCase()
  let tf = 72 * k
  fuente(ctx, 800, tf, 'Saira', true)
  while (ctx.measureText(frase).width > W - 160 && tf > 36) fuente(ctx, 800, (tf -= 2), 'Saira', true)
  ctx.fillStyle = '#141414'
  ctx.fillText(frase, 40, bandaY + bandaAlto / 2 + tf * 0.36)
  barra(ctx, W, H, z)
}

/* Vendido / entregado: las fotos como siempre y una franja roja inclinada
   que cruza la pieza con la palabra. Nunca lleva precio. */
function plantillaVendido(ctx, W, H, d) {
  const { auto, imgs, pieza } = d
  const z = zonas(H)
  const { k, barraY } = z
  if (imgs.length >= 2) collage(ctx, W, imgs.slice(1, 2).concat(imgs[0]), [barraY * 0.38], 0, barraY)
  else {
    foto(ctx, imgs[0], 0, 0, W, barraY, { focoY: 0.6 })
    vineta(ctx, 0, 0, W, barraY, 0.55)
  }
  const palabraV = (pieza.etiqueta || 'Vendido').toUpperCase()
  const alto = 200 * k
  const y0 = Math.max(z.arriba + 40 * k, barraY * 0.3 - alto / 2)
  const inc = alto * 0.21
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 40
  ctx.fillStyle = ROJO_WEB
  ctx.beginPath()
  ctx.moveTo(0, y0)
  ctx.lineTo(W - 70 + inc, y0)
  ctx.lineTo(W - 70, y0 + alto)
  ctx.lineTo(0, y0 + alto)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  let t = 170 * k
  fuente(ctx, 800, t, 'Saira', true)
  while (ctx.measureText(palabraV).width > W - 200 && t > 80) fuente(ctx, 800, (t -= 4), 'Saira', true)
  ctx.fillStyle = BLANCO
  ctx.fillText(palabraV, 40, y0 + alto / 2 + t * 0.36)
  const gracias = pieza.bajada || pieza.titular
  velo(ctx, 0, barraY - 260 * k, W, 262 * k, NEGRO, [[0, 0], [0.55, 0.75], [1, 1]])
  nombre(ctx, nombreDe(auto), 40, barraY - (gracias ? 96 : 40) * k, { tam: 84 * k, ancho: W - 120 })
  if (gracias) {
    fuente(ctx, 700, 40 * k, 'Saira', true)
    ctx.fillStyle = BLANCO
    ctx.fillText(gracias, 40, barraY - 30 * k)
  }
  barra(ctx, W, H, z)
}

/* Qué diseño se puede hacer con cuántas fotos. */
const PLANTILLAS = {
  collage: { dibujar: plantillaCollage, fotos: 2 },
  foco: { dibujar: plantillaFoco, fotos: 1 },
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
