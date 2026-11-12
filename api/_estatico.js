/* El HTML de la home para quien no ejecuta JavaScript: buscadores, asistentes
   de IA, vistas previas y navegadores con JS apagado. El guión bajo evita que
   Vercel publique este archivo como una función.

   La página de verdad es React (src/App.jsx) y se dibuja en el navegador, con
   los autos pedidos a /api/autos. Un rastreador que no corre JS recibía antes
   un <div id="root"></div> vacío. Ahora recibe esto, dentro de ese mismo div;
   cuando React arranca lo reemplaza, así que quien tiene JS no lo ve.

   Dos usos, un solo generador:
   - vite.config.js lo corre al compilar (sin autos) y deja el bloque en el
     index.html, entre los marcadores `estatico:inicio`.
   - api/inicio.js lo corre en cada visita con el stock de ese momento y
     cambia lo que hay entre esos marcadores. */

import { BRANDS, CONTACT, WHATSAPP_URL } from '../src/data/vehicles.js'
import { fichaTexto, marcaBonita, modeloBonito, precioTexto } from '../src/lib/formato.js'

const SITIO = 'https://paoliniautomotores.com'

export const MARCA_INICIO = '<!--estatico:inicio-->'
export const MARCA_FIN = '<!--/estatico:inicio-->'
export const MARCA_JSONLD = '<!--estatico:jsonld-->'
export const MARCA_JSONLD_FIN = '<!--/estatico:jsonld-->'

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/* Un auto de la lista pública (api/autos.js) con los textos ya armados. */
function vista(a) {
  const marca = marcaBonita(a.marca)
  const modelo = modeloBonito(a.modelo)
  return {
    marca,
    modelo,
    nombre: `${marca} ${modelo}`,
    tipo: a.tipo,
    ficha: fichaTexto(a),
    combustible: a.combustible,
    precio: a.precio,
    precioTexto: precioTexto(a.precio),
    reservado: a.estado === 'reservado',
    foto: a.foto ?? null,
    anio: a.anio,
    km: a.km,
  }
}

function tarjeta(v) {
  const consulta = `${WHATSAPP_URL}?text=${encodeURIComponent(`Hola Paolini, quiero consultar por el ${v.nombre}.`)}`
  const datos = [v.marca, v.tipo, v.ficha, v.combustible].filter(Boolean).join(' · ')
  return `<li class="pa-e-auto"><article>
${v.foto ? `<img src="${esc(v.foto)}" alt="${esc(v.nombre)} en Automotores Paolini" loading="lazy" width="320" height="168">` : ''}
<h3>${esc(v.modelo)}${v.reservado ? ' <span class="pa-e-res">Reservado</span>' : ''}</h3>
<p>${esc(datos)}</p>
<p><strong>${esc(v.precioTexto)}</strong> · <a href="${esc(consulta)}" rel="noreferrer">Consultar por WhatsApp</a></p>
</article></li>`
}

const ESTILO = `<style>
.pa-estatico{background:#050505;color:#fff;font:15px/1.65 'Archivo',system-ui,sans-serif;min-height:100vh}
.pa-estatico a{color:#fff}
.pa-estatico h1,.pa-estatico h2,.pa-estatico h3{font-family:'Jost','Archivo',system-ui,sans-serif;line-height:1.15;margin:0}
.pa-estatico h1{font-size:34px;text-transform:uppercase}
.pa-estatico h2{font-size:26px;text-transform:uppercase}
.pa-estatico h3{font-size:18px}
.pa-estatico header,.pa-estatico main>section,.pa-estatico footer{max-width:1100px;margin:0 auto;padding:40px 20px}
.pa-estatico nav a{margin-right:18px;color:#ffffffb3}
.pa-estatico p{color:#ffffffb3;margin:10px 0 0}
.pa-estatico p strong{color:#fff}
.pa-estatico .pa-e-lista{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.pa-estatico .pa-e-auto article{background:#161616;border-radius:10px;padding:18px;height:100%}
.pa-estatico .pa-e-auto img{width:100%;height:auto;aspect-ratio:320/168;object-fit:cover;border-radius:6px;margin-bottom:12px}
.pa-estatico .pa-e-res{font:600 11px/1 'Archivo',sans-serif;text-transform:uppercase;background:#D52B38;border-radius:99px;padding:3px 8px;vertical-align:middle}
.pa-estatico dl{margin:14px 0 0}.pa-estatico dt{color:#ffffff8c;margin-top:8px}.pa-estatico dd{margin:0}
.pa-estatico footer p{font-size:12px}
</style>`

/* El bloque de la home. `autos` es la respuesta de GET /api/autos; sin autos
   (la versión que queda al compilar) muestra el mismo aviso que el sitio. */
export function bloqueInicio(autos = []) {
  const vistas = autos.map(vista)
  const disponibles = vistas.filter((v) => !v.reservado)
  const reservados = vistas.filter((v) => v.reservado)

  const stock = vistas.length
    ? `${disponibles.length ? `<ul class="pa-e-lista">${disponibles.map(tarjeta).join('\n')}</ul>` : ''}
${reservados.length ? `<h3 style="margin-top:36px">Reservados</h3><p>Ya tienen dueño en camino. Si te interesa uno parecido, consultanos.</p><ul class="pa-e-lista">${reservados.map(tarjeta).join('\n')}</ul>` : ''}`
    : `<p>Estamos actualizando el stock. Escribinos y te contamos qué tenemos disponible hoy.</p>`

  return `${MARCA_INICIO}
<div class="pa-estatico">
${ESTILO}
<header>
<nav aria-label="Principal"><a href="#nosotros">Nosotros</a><a href="#vehiculos">Vehículos</a><a href="#financiacion">Financiación</a><a href="#contacto">Contacto</a></nav>
</header>
<main>
<section>
<h1>Automotores Paolini: te acercamos al auto que buscás</h1>
<p>Ya sea que vengas a comprar tu primer 0km, a ver los usados certificados o a que te asesoremos con la financiación, en Paolini está todo en un mismo lugar. Multimarca, en el centro de La Falda, Córdoba, desde hace más de treinta años.</p>
<p>Marcas: ${BRANDS.map(esc).join(', ')}.</p>
</section>
<section id="vehiculos">
<h2>Vehículos destacados</h2>
${stock}
<p><a href="${esc(WHATSAPP_URL)}" rel="noreferrer">Consultar stock por WhatsApp</a></p>
</section>
<section id="nosotros">
<h2>Convertimos sueños en caminos</h2>
<dl>
<dt>Financiación</dt><dd>Hasta 60 cuotas</dd>
<dt>Tu usado</dt><dd>Como parte de pago</dd>
<dt>Entrega</dt><dd>Inmediata</dd>
</dl>
</section>
<section id="financiacion">
<h2>Financiación y tu usado como parte de pago</h2>
<p>Te armamos la financiación con el banco o la marca, tomamos tu usado como parte de pago y te decimos el número final antes de que firmes nada.</p>
<p><a href="${esc(WHATSAPP_URL)}" rel="noreferrer">Consultá por WhatsApp</a> · <a href="${esc(CONTACT.instagram)}" rel="noreferrer">Mirá el stock en Instagram</a></p>
</section>
<section id="contacto">
<h2>Contacto</h2>
<address style="font-style:normal;color:#ffffffb3">
<p>${esc(CONTACT.address)}</p>
<p>Teléfono y WhatsApp: <a href="tel:+${esc(CONTACT.whatsapp)}">${esc(CONTACT.phone)}</a></p>
<p><a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></p>
</address>
<dl>
${CONTACT.hours.map(([dia, horas]) => `<dt>${esc(dia)}</dt><dd>${esc(horas)}</dd>`).join('\n')}
</dl>
<p><a href="https://maps.google.com/?q=${encodeURIComponent(CONTACT.address)}" rel="noreferrer">Cómo llegar</a></p>
</section>
</main>
<footer><p>Automotores Paolini · ${esc(CONTACT.address)}</p><p><a href="https://neurolabs.ar" rel="noreferrer">Sitio web por Neurolabs</a></p></footer>
</div>
${MARCA_FIN}`
}

/* Los autos a la vista de Google y de las IA: una lista de Car, cada uno con
   su precio si lo tiene. Sin autos no se emite nada. */
export function jsonLdAutos(autos = []) {
  const items = autos
    .filter((a) => a.estado !== 'reservado')
    .map(vista)
    .map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Car',
        name: v.nombre,
        brand: { '@type': 'Brand', name: v.marca },
        model: v.modelo,
        ...(v.anio ? { vehicleModelDate: String(v.anio) } : {}),
        ...(v.km != null ? { mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.km, unitCode: 'KMT' } } : {}),
        ...(v.combustible ? { fuelType: v.combustible } : {}),
        ...(v.foto ? { image: v.foto } : {}),
        ...(v.precio
          ? {
              offers: {
                '@type': 'Offer',
                price: v.precio,
                priceCurrency: 'ARS',
                availability: 'https://schema.org/InStock',
                seller: { '@id': `${SITIO}/#negocio` },
              },
            }
          : {}),
      },
    }))
  if (!items.length) return `${MARCA_JSONLD}${MARCA_JSONLD_FIN}`
  const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Vehículos en stock', itemListElement: items })
  /* Un "<" suelto en un dato cerraría el <script>: se escapa. */
  return `${MARCA_JSONLD}<script type="application/ld+json">${json.replace(/</g, '\\u003c')}</script>${MARCA_JSONLD_FIN}`
}

/* Mete el bloque (y los datos estructurados) en el index.html compilado. */
export function armarPagina(plantilla, autos) {
  const entre = (html, ini, fin, nuevo) => {
    const a = html.indexOf(ini)
    const b = html.indexOf(fin)
    return a === -1 || b === -1 || b < a ? html : html.slice(0, a) + nuevo + html.slice(b + fin.length)
  }
  let html = entre(plantilla, MARCA_INICIO, MARCA_FIN, bloqueInicio(autos))
  html = entre(html, MARCA_JSONLD, MARCA_JSONLD_FIN, jsonLdAutos(autos))
  return html
}
