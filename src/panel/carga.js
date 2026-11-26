import { unzipSync, strFromU8 } from 'fflate'

/* La parte de la carga que no es pantalla: leer el Excel, reconocer la foto y
   cruzar las dos cosas. El cruce es el mismo que hace
   `scripts/cargar-autos/cargar.py`: primero por patente (exacta o a una letra
   de distancia) y, si la chapa no se ve, por marca + modelo + color. */

const COLUMNAS = ['marca', 'modelo', 'precio', 'anio', 'patente', 'km', 'color']

export const normPatente = (p) => (p ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const limpiar = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

/* Número de una celda. Si viene como texto se lee a la argentina: "$10.900.000,00"
   es 10900000 y "145.600" km son 145600 (el punto separa miles; una coma o un
   punto seguidos de uno o dos dígitos al final son decimales y se descartan). */
export function numero(x) {
  if (x == null || x === '') return null
  if (typeof x === 'number') return Number.isFinite(x) ? Math.round(x) : null
  const s = String(x).replace(/[^\d.,]/g, '').replace(/[.,]\d{1,2}$/, '').replace(/[.,]/g, '')
  return s ? Number(s) : null
}

/* Una patente tiene letras y números (AAA 123 o AA 123 BB). Así se descarta la
   fila de títulos, que dice "PATENTE". */
const pareceUnaPatente = (p) => {
  const n = normPatente(p)
  return n.length >= 6 && n.length <= 8 && /[A-Z]/.test(n) && /\d/.test(n)
}

/* Los 0 km vienen sin patente. Si en la columna de la patente dice "0KM" (o
   "0 km", "s/p", "sin patente"), o está vacía y el auto no tiene kilómetros,
   se carga igual como 0 km. Como la base pide una patente única, se le pone
   un código propio "0KM-XXXX" que sale de marca + modelo + color (y de cuál
   es, si hay varios iguales): así, si suben el mismo Excel de nuevo, el
   código da igual y no se duplica. En el panel se muestra "0 km". */
const DICE_SIN_PATENTE = /^(0\s*km|okm|0km|s\/?p|sin\s*patente|sin\s*dominio|-+)$/i
export const esCodigo0km = (p) => /^0KM-[A-Z0-9]{4}$/i.test(p ?? '')
export const mostrarPatente = (p) => (esCodigo0km(p) ? '0 km (sin patente)' : p)

function codigo0km(semilla) {
  let h = 2166136261
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return `0KM-${h.toString(36).toUpperCase().padStart(4, '0').slice(-4)}`
}

/* Les pone el código a los 0 km de una lista, en orden. */
function codigosA0km(filas) {
  const vistos = new Map()
  for (const f of filas) {
    if (!f.cero) continue
    const base = [f.marca, f.modelo, f.color].map(norm).join('|')
    const n = (vistos.get(base) ?? 0) + 1
    vistos.set(base, n)
    f.patente = codigo0km(`${base}|${n}`)
    delete f.cero
  }
  return filas
}

/* Títulos de columna que se reconocen (sin tildes ni espacios). "Año" queda "ano". */
const TITULOS = {
  marca: ['marca'],
  modelo: ['modelo', 'version', 'vehiculo', 'unidad', 'descripcion'],
  precio: ['precio', 'valor', 'importe', 'contado'],
  anio: ['ano', 'anio', 'year'],
  patente: ['patente', 'dominio', 'chapa'],
  km: ['km', 'kms', 'kilometraje', 'kilometros'],
  color: ['color'],
}
const clave = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/* Si la fila es la de títulos, en qué columna está cada dato. Hace falta la
   patente y al menos dos datos más, para no confundirla con un auto. */
function columnasDeTitulos(fila) {
  const cols = {}
  fila.forEach((v, i) => {
    const k = clave(v)
    if (!k) return
    const campo = Object.keys(TITULOS).find(
      (c) => !(c in cols) && TITULOS[c].some((t) => k === t || (t.length >= 4 && k.startsWith(t))),
    )
    if (campo) cols[campo] = i
  })
  return 'patente' in cols && Object.keys(cols).length >= 3 ? cols : null
}

/* Un auto con la forma que usa el panel, o null si no tiene patente (y no es
   un 0 km). Los 0 km salen con `cero: true` y sin patente todavía: el código
   se lo pone codigosA0km(), que necesita ver la lista entera. */
export function normalizarFila(crudo) {
  const f = {}
  for (const k of ['marca', 'modelo', 'color', 'patente']) f[k] = limpiar(crudo[k])
  for (const k of ['precio', 'anio', 'km']) f[k] = numero(crudo[k])
  if (pareceUnaPatente(f.patente)) return { ...f, ...clasificar(f.modelo) }
  const sinKm = !f.km
  /* Un año viejo sin patente es un usado al que le falta el dato, no un 0 km. */
  const anioOk = !f.anio || f.anio >= new Date().getFullYear() - 1
  const dice0km = DICE_SIN_PATENTE.test(f.patente) || (!f.patente && sinKm)
  if (dice0km && sinKm && anioOk && f.marca && f.modelo && !columnasDeTitulos(Object.values(crudo))) {
    return { ...f, patente: '', km: 0, cero: true, ...clasificar(f.modelo) }
  }
  return null
}

/* Filas de autos a partir de una tabla (lista de filas, cada una lista de
   celdas). Busca la fila de títulos en las primeras 30 para saber dónde está
   cada dato, así no importa el orden de las columnas, si hay columnas de más
   o filas vacías. Sin títulos, se asume el orden de siempre: marca, modelo,
   precio, año, patente, km, color. Devuelve { filas, sinPatente }, con los
   autos que quedaron afuera por no tener patente ("PEUGEOT 208"). */
export function filasDeTabla(tabla) {
  let cols = null
  let desde = 0
  for (let i = 0; i < Math.min(tabla.length, 30) && !cols; i++) {
    cols = columnasDeTitulos(tabla[i] ?? [])
    desde = i + 1
  }
  if (!cols) {
    cols = Object.fromEntries(COLUMNAS.map((k, i) => [k, i]))
    desde = 0
  }
  const filas = []
  const sinPatente = []
  for (const t of tabla.slice(desde)) {
    const crudo = Object.fromEntries(COLUMNAS.map((k) => [k, cols[k] == null ? null : t?.[cols[k]]]))
    const f = normalizarFila(crudo)
    if (f) filas.push(f)
    else if (limpiar(crudo.modelo) && !columnasDeTitulos(t ?? [])) {
      sinPatente.push(limpiar(`${limpiar(crudo.marca)} ${limpiar(crudo.modelo)}`))
    }
  }
  return { filas: codigosA0km(filas), sinPatente }
}

/* Las hojas de un .xlsx como tablas, en orden. Las celdas pueden venir como
   número, como texto compartido (lo que guarda Excel) o como texto en línea
   (lo que guardan Numbers, ChatGPT o Python/openpyxl). */
export function tablasDeXlsx(buffer) {
  const zip = unzipSync(new Uint8Array(buffer))
  const xml = (ruta) => new DOMParser().parseFromString(strFromU8(zip[ruta]), 'application/xml')
  const texto = (nodo) => [...nodo.getElementsByTagName('t')].map((t) => t.textContent).join('')

  const compartidas = zip['xl/sharedStrings.xml']
    ? [...xml('xl/sharedStrings.xml').getElementsByTagName('si')].map(texto)
    : []
  const hojas = Object.keys(zip)
    .map((r) => [r, r.match(/^xl\/worksheets\/sheet(\d+)\.xml$/)?.[1]])
    .filter(([, n]) => n)
    .sort((a, b) => a[1] - b[1])
    .map(([r]) => r)
  if (!hojas.length) throw new Error('no es xlsx')

  const indice = (letras) => [...letras].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
  return hojas.map((hoja) =>
    [...xml(hoja).getElementsByTagName('row')].map((row) => {
      const celdas = []
      for (const c of row.getElementsByTagName('c')) {
        const letras = c.getAttribute('r')?.match(/^[A-Z]+/)?.[0]
        const i = letras ? indice(letras) : celdas.length
        const tipo = c.getAttribute('t')
        const v = c.getElementsByTagName('v')[0]?.textContent
        if (tipo === 'inlineStr') celdas[i] = texto(c)
        else if (v == null) continue
        else if (tipo === 's') celdas[i] = compartidas[Number(v)]
        else if (tipo === 'str' || tipo === 'e' || tipo === 'b') celdas[i] = v
        else celdas[i] = Number(v)
      }
      return celdas
    }),
  )
}

/* Un CSV como tabla. El separador (; , o tabulación) se deduce de la primera
   línea con datos; respeta comillas. */
export function tablaDeCsv(texto) {
  const limpio = texto.replace(/^﻿/, '')
  const primera = limpio.split(/\r?\n/).find((l) => l.trim()) ?? ''
  const sep = [';', '\t', ','].map((s) => [s, primera.split(s).length]).sort((a, b) => b[1] - a[1])[0][0]
  const tabla = []
  let fila = []
  let campo = ''
  let comillas = false
  for (let i = 0; i < limpio.length; i++) {
    const ch = limpio[i]
    if (comillas) {
      if (ch !== '"') campo += ch
      else if (limpio[i + 1] === '"') {
        campo += '"'
        i++
      } else comillas = false
    } else if (ch === '"') comillas = true
    else if (ch === sep) {
      fila.push(campo)
      campo = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && limpio[i + 1] === '\n') i++
      fila.push(campo)
      tabla.push(fila)
      fila = []
      campo = ''
    } else campo += ch
  }
  if (campo || fila.length) {
    fila.push(campo)
    tabla.push(fila)
  }
  return tabla
}

/* Texto de un archivo: UTF-8 y, si no lo es, Windows-1252 (lo que guarda Excel). */
function decodificar(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

const aCsv = (tabla) =>
  tabla
    .filter((f) => f.some((c) => limpiar(c)))
    .map((f) => Array.from(f, (c) => limpiar(c).replaceAll(';', ',')).join(';'))
    .join('\n')

async function base64(buffer) {
  const url = await new Promise((ok, mal) => {
    const lector = new FileReader()
    lector.onload = () => ok(lector.result)
    lector.onerror = mal
    lector.readAsDataURL(new Blob([buffer]))
  })
  return url.slice(url.indexOf(',') + 1)
}

/* Le pide a la IA del servidor que lea la lista (un PDF o el texto de una
   planilla con títulos raros). */
async function leerConIA(cuerpo) {
  const r = await fetch('/api/lista', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  if (!r.ok) throw Object.assign(new Error(`lista ${r.status}`), { status: r.status })
  const { autos } = await r.json()
  const filas = []
  const sinPatente = []
  for (const a of autos) {
    const f = normalizarFila(a)
    if (f) filas.push(f)
    else if (limpiar(a.modelo)) sinPatente.push(limpiar(`${limpiar(a.marca)} ${limpiar(a.modelo)}`))
  }
  return { filas: codigosA0km(filas), sinPatente, conIA: true }
}

export const LISTA_PDF_MAX = 3_000_000 // bytes; el servidor no acepta más

/* Formatos de lista que se aceptan. Las extensiones viejas (.xls, .ods,
   .numbers) se reconocen sólo para explicar que hay que mandarlas de otra forma. */
export const esLista = (a) =>
  /\.(xlsx|xlsm|csv|txt|pdf|xls|ods|numbers)$/i.test(a.name) || a.type === 'application/pdf' || a.type === 'text/csv'

/* Lee la lista de stock, venga como venga: .xlsx (cualquier hoja, columnas en
   cualquier orden), CSV, o PDF (lo lee la IA). Si la planilla se puede abrir
   pero no se encuentran las columnas, también se la pasa a la IA. Devuelve
   { filas, sinPatente, conIA }; lanza un Error con `.motivo` para el mensaje. */
export async function leerLista(archivo) {
  const nombre = archivo.name.toLowerCase()
  const buffer = await archivo.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const motivo = (m) => Object.assign(new Error(m), { motivo: m })

  if (nombre.endsWith('.pdf') || archivo.type === 'application/pdf') {
    if (bytes.length > LISTA_PDF_MAX) throw motivo('pdf-grande')
    return leerConIA({ pdf: await base64(buffer) })
  }
  if (/\.(xls|ods|numbers)$/.test(nombre) || (bytes[0] === 0xd0 && bytes[1] === 0xcf)) throw motivo('formato')

  let tablas
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    try {
      tablas = tablasDeXlsx(buffer)
    } catch {
      throw motivo('formato')
    }
  } else tablas = [tablaDeCsv(decodificar(bytes))]

  for (const t of tablas) {
    const r = filasDeTabla(t)
    if (r.filas.length) return { ...r, conIA: false }
  }
  const csv = tablas.map(aCsv).filter(Boolean).join('\n\n')
  if (!csv) throw motivo('vacio')
  return leerConIA({ texto: csv.slice(0, 400_000) })
}

/* Lo de antes, para quien lo use con un .xlsx ya en memoria. */
export function leerExcel(buffer) {
  for (const t of tablasDeXlsx(buffer)) {
    const { filas } = filasDeTabla(t)
    if (filas.length) return filas
  }
  return []
}

/* El Excel no trae carrocería ni combustible: se deducen del modelo. Lo que no
   se reconoce queda como "Auto" / "Nafta" y se corrige en la base. */
const TIPOS = [
  [/hilux|amarok|ranger|s10|frontier|saveiro|strada|toro/i, 'Pick-up'],
  [/renegade|t-?cross|tracker|kicks|creta|duster|ecosport|hr-?v|compass|taos/i, 'SUV'],
  [/corolla|cronos|virtus|logan|sedan|vento|siena/i, 'Sedán'],
  [/yaris|208|onix|sandero|polo|argo|gol|clio/i, 'Hatchback'],
]
export function clasificar(modelo) {
  const tipo = TIPOS.find(([re]) => re.test(modelo))?.[1] ?? 'Auto'
  let combustible = 'Nafta'
  if (/hilux|amarok|ranger|s10|frontier|tdi/i.test(modelo)) combustible = 'Diésel'
  else if (/hev|hybrid|h[ií]brido/i.test(modelo)) combustible = 'Híbrido'
  return { tipo, combustible }
}

/* Colores que en la práctica son el mismo (el Excel dice «BORDO» y la IA «rojo»). */
const GRUPOS_COLOR = [
  ['rojo', 'bordo', 'granate', 'vino'],
  ['gris', 'plata', 'plateado', 'grafito'],
  ['blanco', 'perla'],
  ['negro'],
  ['azul', 'celeste'],
  ['verde'],
  ['amarillo'],
  ['naranja'],
  ['marron', 'cafe', 'beige', 'dorado'],
]
const grupoDeColor = (c) => {
  const t = (c ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const i = GRUPOS_COLOR.findIndex((g) => g.some((x) => t === x || t.startsWith(`${x} `)))
  return i >= 0 ? i : t || null
}

const palabras = (t) =>
  (t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/* Puntaje de cada auto del Excel contra lo que se vio en la foto:
   patente a una letra de distancia +4 (una letra mal leída), marca +1, la
   palabra base del modelo («Hilux») +2, cada palabra de versión que también se
   ve («SR», «Limited», «HV») +1 hasta +2, y color +1. Sólo se elige si el
   mejor llega a 3 y le gana al segundo: con dos Corolla iguales en color y sin
   versión a la vista, no se adivina. */
function puntuar(visto, libres) {
  const marca = norm(visto?.marca)
  const vistas = palabras(visto?.modelo).filter((w) => w !== marca.toLowerCase())
  const color = grupoDeColor(visto?.color)
  const patente = normPatente(visto?.patente)
  const puntaje = libres
    .map((f) => {
      /* Si el Excel escribió la marca dentro del modelo («Toyota Hilux»), no
         cuenta como parte del modelo. */
      const [base, ...version] = palabras(f.modelo).filter((w) => w !== palabras(f.marca)[0])
      let s = 0
      if (patente && distancia(normPatente(f.patente), patente) === 1) s += 4
      if (marca && marca === norm(f.marca)) s += 1
      if (base && vistas.some((w) => w === base || (base.length >= 5 && w.startsWith(base.slice(0, 5))))) {
        s += 2
        s += Math.min(2, version.filter((w) => vistas.includes(w)).length)
      }
      if (color && color === grupoDeColor(f.color)) s += 1
      return { f, s }
    })
    .sort((a, b) => b.s - a.s)
  return puntaje
}

/* Dos 0 km de la misma marca, modelo y color son intercambiables: da lo mismo
   cuál se lleva la foto. */
const mellizos = (a, b) =>
  esCodigo0km(a.patente) && esCodigo0km(b.patente) && ['marca', 'modelo', 'color'].every((k) => norm(a[k]) === norm(b[k]))

function porModeloYColor(visto, libres) {
  const puntaje = puntuar(visto, libres)
  if (!(puntaje[0]?.s >= 3)) return null
  const empatados = puntaje.filter((p) => p.s === puntaje[0].s)
  return empatados.every((p) => mellizos(p.f, puntaje[0].f)) ? puntaje[0].f : null
}

/* Por qué una foto no encontró auto, para el registro de la carga: el motivo en
   palabras y los tres candidatos más cercanos con su puntaje. `libres` son los
   autos que quedaron sin foto. */
export function explicarSinCruce(visto, libres) {
  if (!visto) return { motivo: 'No se pudo leer la foto (falló el servicio de reconocimiento)', candidatos: [] }
  const candidatos = puntuar(visto, libres)
    .filter((c) => c.s > 0)
    .slice(0, 3)
    .map(({ f, s }) => ({ patente: f.patente, auto: `${f.marca} ${f.modelo} ${f.color ?? ''}`.trim(), puntos: s }))
  let motivo
  if (!libres.length) motivo = 'Ya no quedaba ningún auto del Excel sin foto'
  else if (normPatente(visto.patente) && !(candidatos[0]?.puntos >= 3)) {
    motivo = `La patente leída (${visto.patente}) no está en el Excel ni difiere en una sola letra`
  } else if (!candidatos.length) motivo = 'Chapa no legible y ningún auto del Excel se parece al de la foto'
  else if (candidatos[0].puntos < 3) motivo = 'Chapa no legible y el parecido por modelo y color es muy bajo'
  else motivo = 'Chapa no legible y hay más de un auto del Excel igual de parecido (o dos fotos eligen el mismo)'
  return { motivo, candidatos }
}

/* Los autos ya cargados en el stock, con la forma de una fila del Excel. */
export const filaDeStock = (u) => ({
  marca: (u.brand ?? '').toUpperCase(),
  modelo: u.model ?? '',
  color: u.color ?? '',
  patente: u.patente,
})

const distancia = (a, b) => (a.length !== b.length ? 99 : [...a].filter((c, i) => c !== b[i]).length)

/* Cruza todas las fotos de la tanda con las filas del Excel, por pasadas: las
   decisiones seguras van primero, así lo que ya está claro no estorba a lo
   que no lo está (con el cruce foto por foto, una foto sin patente podía
   declarar «empate» entre dos autos parecidos aunque otra foto ya iba a
   quedarse con uno de ellos por su patente exacta).

     1. patente exacta;
     2. por puntaje, sobre los autos que quedaron libres: la patente a una
        letra de distancia (+4), marca, modelo, versión y color. Gana el que
        llega a 3 puntos y le saca ventaja al segundo, así que una letra mal
        leída se carga igual y, si hay dos autos con patentes casi iguales,
        deciden la marca, el modelo y el color. Si dos fotos
        eligen el mismo auto, ninguna se lo lleva. Se repite hasta que no
        quede nada más por resolver, porque cada foto resuelta deja menos
        candidatos a las demás.

   `entradas` es [{ id, visto }]; `usadas` son las patentes que ya tienen foto
   (las asignadas a mano). Devuelve { [id]: { fila, metodo } } sólo con las
   fotos que encontraron auto. */
export function cruzarTodos(entradas, filas, usadas = new Set()) {
  const out = {}
  const tomadas = new Set(usadas)
  const libres = () => filas.filter((f) => !tomadas.has(f.patente))
  const pendientes = () => entradas.filter((e) => e.visto && !out[e.id])
  const tomar = (id, fila, metodo) => {
    out[id] = { fila, metodo }
    tomadas.add(fila.patente)
  }

  for (const e of pendientes()) {
    const p = normPatente(e.visto.patente)
    const exacta = p && libres().find((f) => normPatente(f.patente) === p)
    if (exacta) tomar(e.id, exacta, 'patente')
  }

  let cambio = true
  while (cambio) {
    cambio = false
    const elegidas = pendientes()
      .map((e) => ({ e, f: porModeloYColor(e.visto, libres()) }))
      .filter((x) => x.f)
    const veces = new Map()
    for (const { f } of elegidas) veces.set(f.patente, (veces.get(f.patente) ?? 0) + 1)
    const repartidas = new Set()
    for (const { e, f } of elegidas) {
      /* Si dos fotos eligen el mismo auto, ninguna se lo lleva; salvo que sea
         un 0 km con mellizos libres: se lo lleva la primera y la otra vuelve
         a buscar en la próxima vuelta, donde el mellizo sigue libre. */
      if (veces.get(f.patente) !== 1) {
        const hayMellizo = libres().some((o) => o !== f && mellizos(o, f))
        if (!esCodigo0km(f.patente) || !hayMellizo || repartidas.has(f.patente)) continue
        repartidas.add(f.patente)
      }
      /* Una letra mal leída se carga igual. Si la foto trajo una patente que no
         se parece a la del auto elegido, el resultado es una sugerencia para
         revisar, no algo para cargar solo. */
      const p = normPatente(e.visto.patente)
      const metodo = !p
        ? 'modelo y color'
        : distancia(normPatente(f.patente), p) === 1
          ? 'patente aproximada'
          : 'modelo y color dudoso'
      tomar(e.id, f, metodo)
      cambio = true
    }
  }
  return out
}

/* Achica la foto antes de mandarla: una del celular pesa varios MB y para leer
   la chapa alcanzan 1600 px. */
export async function achicar(archivo, lado = 1600, formato = 'url') {
  const img = await createImageBitmap(archivo)
  const escala = Math.min(1, lado / Math.max(img.width, img.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(img.width * escala)
  lienzo.height = Math.round(img.height * escala)
  lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
  if (formato === 'blob') return new Promise((listo) => lienzo.toBlob(listo, 'image/jpeg', 0.85))
  return lienzo.toDataURL('image/jpeg', 0.85)
}

/* POST /api/reconocer: la función de servidor (api/reconocer.js) le pregunta al
   modelo de visión qué auto es y qué patente se lee. Falla si no está
   publicada o si le falta la key: la pantalla lo cuenta y deja elegir a mano. */
export async function reconocerFoto(archivo) {
  const imagen = await achicar(archivo)
  const r = await fetch('/api/reconocer', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imagen }),
  })
  if (!r.ok) throw new Error(`reconocer ${r.status}`)
  return r.json()
}

/* ── Fotos de adentro ──────────────────────────────────────────────────── */

/* Cuándo se sacó la foto: la fecha EXIF de la cámara (DateTimeOriginal) si es
   un JPG que la trae; si no, la fecha del archivo. Sirve para ordenar las
   fotos como se sacaron y saber de qué auto es cada foto de adentro. */
export async function fechaDeFoto(archivo) {
  try {
    const exif = leerFechaExif(new DataView(await archivo.slice(0, 256 * 1024).arrayBuffer()))
    if (exif) return exif
  } catch {
    /* sin EXIF legible */
  }
  return archivo.lastModified || 0
}

function leerFechaExif(v) {
  if (v.getUint16(0) !== 0xffd8) return null
  let o = 2
  while (o + 4 < v.byteLength) {
    const marca = v.getUint16(o)
    const largo = v.getUint16(o + 2)
    if (marca === 0xffe1 && v.getUint32(o + 4) === 0x45786966) return fechaDeTiff(v, o + 10)
    if ((marca & 0xff00) !== 0xff00) return null
    o += 2 + largo
  }
  return null
}

function fechaDeTiff(v, t) {
  const le = v.getUint16(t) === 0x4949
  const u16 = (p) => v.getUint16(t + p, le)
  const u32 = (p) => v.getUint32(t + p, le)
  const buscar = (ifd, etiqueta) => {
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12
      if (u16(e) === etiqueta) return e
    }
    return null
  }
  const texto = (e) => {
    const off = u32(e + 8)
    let s = ''
    for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(t + off + i))
    return s
  }
  const ifd0 = u32(4)
  const punteroExif = buscar(ifd0, 0x8769)
  let e = punteroExif != null ? buscar(u32(punteroExif + 8), 0x9003) : null
  e ??= buscar(ifd0, 0x0132)
  if (e == null) return null
  const m = texto(e).match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null
}

export const ES_DE_ADENTRO = ['interior', 'detalle', 'trasera']
const VENTANA = 30 * 60 * 1000 // las de adentro van con el auto fotografiado hasta media hora antes

/* Las fotos de adentro (interior, detalles, cola) van con el auto de la foto
   de afuera que se sacó justo antes: así sacan las fotos, auto por auto. Una
   foto de afuera sin auto (una segunda de frente del mismo auto, sin chapa a
   la vista) también se suma como extra si la marca no contradice.
   `fotos` es [{ id, fecha, nombre, visto }] y `anclas` es { id: fila } con
   las fotos de afuera que ya tienen auto. Devuelve { id: fila } para las
   fotos de adentro que encontraron auto. */
export function agruparFotosDeAdentro(fotos, anclas) {
  const orden = [...fotos].sort((a, b) => a.fecha - b.fecha || a.nombre.localeCompare(b.nombre, 'es', { numeric: true }))
  const out = {}
  let ultima = null
  for (const f of orden) {
    if (anclas[f.id]) {
      ultima = { fila: anclas[f.id], fecha: f.fecha }
      continue
    }
    if (!ultima || !f.visto || f.fecha - ultima.fecha > VENTANA) continue
    const deAdentro = ES_DE_ADENTRO.includes(f.visto.tipo)
    /* Otra de afuera sin chapa sólo si es claramente el mismo auto (mismo
       modelo y color): si no, puede ser el próximo auto (un 0 km). */
    const base = palabras(f.visto.modelo)[0]
    const otraDeAfuera =
      f.visto.tipo === 'exterior' &&
      !normPatente(f.visto.patente) &&
      base &&
      palabras(ultima.fila.modelo).includes(base) &&
      (!f.visto.color || !ultima.fila.color || grupoDeColor(f.visto.color) === grupoDeColor(ultima.fila.color))
    if (!deAdentro && !otraDeAfuera) continue
    /* Si en la foto se lee otra marca (el volante de un Fiat después de una
       Hilux), no se adivina: queda para elegir a mano. */
    if (f.visto.marca && norm(f.visto.marca).slice(0, 4) !== norm(ultima.fila.marca).slice(0, 4)) continue
    out[f.id] = ultima.fila
  }
  return out
}
