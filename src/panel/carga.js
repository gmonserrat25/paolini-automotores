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
   patente a una letra de distancia +4 (una letra mal leída), marca +1, la
   palabra base del modelo («Hilux») +2, cada palabra de versión que también se
   ve («SR», «Limited», «HV») +1 hasta +2, y color +1. Sólo se elige si el
   mejor llega a 3 y le gana al segundo: con dos Corolla iguales en color y sin
   versión a la vista, no se adivina.

   Cada candidato trae además `m` (los puntos sin contar la patente), `max` (lo
   más que podía sumar ese auto, según las palabras de su modelo) y `confianza`
   = m / max: 1 es que todo lo que dice el Excel de ese auto se ve en la foto. */
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
      if (marca && marca === norm(f.marca)) s += 1
      if (base && vistas.some((w) => w === base || (base.length >= 5 && w.startsWith(base.slice(0, 5))))) {
        s += 2
        s += Math.min(2, version.filter((w) => vistas.includes(w)).length)
      }
      if (color && color === grupoDeColor(f.color)) s += 1
      const max = 1 + 2 + Math.min(2, version.length) + 1
      const m = s
      if (patente && distancia(normPatente(f.patente), patente) === 1) s += 4
      return { f, s, m, max, confianza: m / max }
    })
    .sort((a, b) => b.s - a.s)
  return puntaje
}

/* A partir de esta confianza, un auto elegido por marca, modelo y color se carga
   solo aunque la patente leída en la foto no se parezca a la suya (la IA puede
   leer mal una chapa, pero no se equivoca en todo lo demás). */
export const CONFIANZA_ALTA = 0.8

function porModeloYColor(visto, libres) {
  const puntaje = puntuar(visto, libres)
  return puntaje[0]?.s >= 3 && (puntaje.length === 1 || puntaje[0].s > puntaje[1].s) ? puntaje[0] : null
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
      .map((e) => ({ e, ...porModeloYColor(e.visto, libres()) }))
      .filter((x) => x.f)
    const veces = new Map()
    for (const { f } of elegidas) veces.set(f.patente, (veces.get(f.patente) ?? 0) + 1)
    for (const { e, f, confianza } of elegidas) {
      if (veces.get(f.patente) !== 1) continue
      /* Una letra mal leída se carga igual. Si la foto trajo una patente que no
         se parece a la del auto elegido, se carga sola sólo con confianza alta
         (marca, modelo y color coinciden); si no, es una sugerencia para
         revisar. */
      const p = normPatente(e.visto.patente)
      const metodo = !p
        ? 'modelo y color'
        : distancia(normPatente(f.patente), p) === 1
          ? 'patente aproximada'
          : confianza >= CONFIANZA_ALTA
            ? 'modelo y color con otra patente'
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
