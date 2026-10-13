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
  const marca = norm(visto?.marca)
  const modelo = norm(visto?.modelo)
  const color = norm(visto?.color)
  const puntaje = libres
    .map((f) => {
      const fm = norm(f.modelo)
      let s = 0
      if (marca && marca === norm(f.marca)) s += 1
      if (modelo && (modelo.includes(fm) || fm.includes(modelo) || fm.slice(0, 5) === modelo.slice(0, 5))) s += 2
      if (color && color === norm(f.color)) s += 1
      return { f, s }
    })
    .sort((a, b) => b.s - a.s)
  if (puntaje[0]?.s >= 3 && (puntaje.length === 1 || puntaje[0].s > puntaje[1].s)) {
    return { fila: puntaje[0].f, metodo: 'modelo y color' }
  }
  return { fila: null, metodo: null }
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
