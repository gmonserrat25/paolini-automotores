import { unzipSync, strFromU8 } from 'fflate'

/* La parte de la carga que no es pantalla: leer el Excel, reconocer la foto y
   cruzar las dos cosas. El cruce es el mismo que hace
   `scripts/cargar-autos/cargar.py`: primero por patente (exacta o a una letra
   de distancia) y, si la chapa no se ve, por marca + modelo + color. */

const COLUMNAS = ['marca', 'modelo', 'precio', 'anio', 'patente', 'km', 'color']

export const normPatente = (p) => (p ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const limpiar = (s) => (s ?? '').replace(/\s+/g, ' ').trim()

/* Columnas del Excel, en este orden: marca, modelo, precio, año, patente, km,
   color. Sin fila de títulos (si la hubiera, se descarta sola porque no trae
   patente válida). */
export function leerExcel(buffer) {
  const zip = unzipSync(new Uint8Array(buffer))
  const xml = (ruta) => new DOMParser().parseFromString(strFromU8(zip[ruta]), 'application/xml')

  const compartidas = zip['xl/sharedStrings.xml']
    ? [...xml('xl/sharedStrings.xml').getElementsByTagName('si')].map((si) =>
        [...si.getElementsByTagName('t')].map((t) => t.textContent).join(''),
      )
    : []

  const filas = []
  for (const row of xml('xl/worksheets/sheet1.xml').getElementsByTagName('row')) {
    const celdas = {}
    for (const c of row.getElementsByTagName('c')) {
      const col = c.getAttribute('r').match(/^[A-Z]+/)[0]
      const v = c.getElementsByTagName('v')[0]
      if (!v) continue
      celdas[col] = c.getAttribute('t') === 's' ? compartidas[Number(v.textContent)] : Number(v.textContent)
    }
    const f = Object.fromEntries(COLUMNAS.map((k, i) => [k, celdas[String.fromCharCode(65 + i)]]))
    for (const k of ['marca', 'modelo', 'color', 'patente']) f[k] = limpiar(f[k])
    for (const k of ['precio', 'anio', 'km']) f[k] = f[k] == null ? null : Math.round(Number(f[k]))
    if (normPatente(f.patente).length >= 6) filas.push({ ...f, ...clasificar(f.modelo) })
  }
  return filas
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
   marca +1, la palabra base del modelo («Hilux») +2, cada palabra de versión
   que también se ve («SR», «Limited», «HV») +1 hasta +2, y color +1. Sólo se
   elige si el mejor llega a 3 y le gana al segundo: con dos Corolla iguales en
   color y sin versión a la vista, no se adivina. */
function porModeloYColor(visto, libres) {
  const marca = norm(visto?.marca)
  const vistas = palabras(visto?.modelo).filter((w) => w !== marca.toLowerCase())
  const color = grupoDeColor(visto?.color)
  const puntaje = libres
    .map((f) => {
      const [base, ...version] = palabras(f.modelo)
      let s = 0
      if (marca && marca === norm(f.marca)) s += 1
      if (base && vistas.some((w) => w === base || (base.length >= 5 && w.startsWith(base.slice(0, 5))))) {
        s += 2
        s += Math.min(2, version.filter((w) => vistas.includes(w)).length)
      }
      if (color && color === grupoDeColor(f.color)) s += 1
      return { f, s }
    })
    .sort((a, b) => b.s - a.s)
  return puntaje[0]?.s >= 3 && (puntaje.length === 1 || puntaje[0].s > puntaje[1].s) ? puntaje[0].f : null
}

const distancia = (a, b) => (a.length !== b.length ? 99 : [...a].filter((c, i) => c !== b[i]).length)

/* Devuelve { fila, metodo } con la fila del Excel que corresponde a lo que se
   vio en la foto, o fila: null si no hay forma segura de decidirlo. `usadas`
   son las patentes que ya tienen otra foto. */
export function cruzar(visto, filas, usadas) {
  const libres = filas.filter((f) => !usadas.has(f.patente))
  const p = normPatente(visto?.patente)
  if (p) {
    const exacta = libres.find((f) => normPatente(f.patente) === p)
    if (exacta) return { fila: exacta, metodo: 'patente' }
    const cerca = libres.filter((f) => distancia(normPatente(f.patente), p) === 1)
    if (cerca.length === 1) return { fila: cerca[0], metodo: 'patente dudosa' }
  }
  /* Sin patente que coincida: se busca por marca, modelo y color. Si la foto
     trajo una patente (que no coincidió con nada) el resultado queda como
     dudoso: es una sugerencia para revisar, no algo para cargar solo. */
  const elegida = porModeloYColor(visto, libres)
  if (elegida) return { fila: elegida, metodo: visto?.patente ? 'modelo y color dudoso' : 'modelo y color' }
  return { fila: null, metodo: null }
}

/* Qué tan buena es una foto como portada: el frente del auto primero, el
   interior y el motor al final. */
const PORTADA = { frente: 0, lateral: 1, trasera: 2, otra: 3, interior: 4, motor: 5 }
const rangoPortada = (visto) => PORTADA[visto?.vista] ?? 3

/* De más a menos seguro: el grupo toma el mejor método de sus fotos. */
const SEGURIDAD = ['manual', 'patente', 'modelo y color', 'patente dudosa', 'modelo y color dudoso']

/* Las fotos vienen mezcladas, de a una. Junta las de cada auto en un solo
   grupo: las que cruzaron con la misma fila del Excel (por patente, modelo y
   color, o porque se eligió a mano) van juntas. Las que no dicen nada del auto
   (un interior, el motor) se pegan por orden de captura —nombre de archivo y
   hora— sólo si la foto de antes y la de después son del mismo auto (o si
   están al principio o al final de la tanda y hay un solo vecino); si cambian
   de auto justo ahí, no se adivina y quedan sueltas para asignar a mano.

   `cruces` es { [item.id]: { fila, metodo } }. Devuelve [{ clave, fila,
   metodo, items }] con las fotos de cada grupo ya ordenadas (portada primero) y
   las sueltas como grupos de una foto con fila null. */
export function agruparFotos(items, cruces) {
  const orden = [...items].sort(
    (a, b) =>
      (a.archivo?.lastModified ?? 0) - (b.archivo?.lastModified ?? 0) ||
      (a.archivo?.name ?? '').localeCompare(b.archivo?.name ?? '', undefined, { numeric: true }),
  )
  const directa = (i) => cruces[i.id]?.fila?.patente ?? null
  const patenteDe = {}
  orden.forEach((i, n) => {
    patenteDe[i.id] = directa(i)
    if (patenteDe[i.id] || i.estado !== 'listo' || i.visto?.patente) return
    const antes = orden.slice(0, n).reverse().find(directa)
    const despues = orden.slice(n + 1).find(directa)
    if (antes && despues ? directa(antes) === directa(despues) : antes || despues) {
      patenteDe[i.id] = directa(antes ?? despues)
    }
  })

  const grupos = new Map()
  for (const [n, i] of orden.entries()) {
    const patente = patenteDe[i.id]
    const clave = patente ?? `suelta-${i.id}`
    if (!grupos.has(clave)) grupos.set(clave, { clave, fila: null, metodo: null, items: [] })
    const g = grupos.get(clave)
    g.items.push({ ...i, orden: n })
    if (patente) {
      const c = directa(i) ? cruces[i.id] : null
      if (c) {
        g.fila ??= c.fila
        if (g.metodo == null || SEGURIDAD.indexOf(c.metodo) < SEGURIDAD.indexOf(g.metodo)) g.metodo = c.metodo
      }
    }
  }
  for (const g of grupos.values()) {
    g.items.sort((a, b) => rangoPortada(a.visto) - rangoPortada(b.visto) || a.orden - b.orden)
  }
  return [...grupos.values()]
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
