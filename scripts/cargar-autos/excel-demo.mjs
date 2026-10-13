/* Arma supabase/seed/inventario-demo.xlsx con los autos de inventario.json, en
   el formato que lee la pantalla Carga (sin fila de títulos): marca, modelo,
   precio, año, patente, km, color. Sirve para probar y mostrar la carga.

     node scripts/cargar-autos/excel-demo.mjs */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strToU8, zipSync } from 'fflate'

const semilla = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'seed')
const { autos } = JSON.parse(readFileSync(join(semilla, 'inventario.json'), 'utf8'))

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const LETRAS = 'ABCDEFG'
const compartidas = []
const indice = (t) => {
  let i = compartidas.indexOf(t)
  if (i < 0) i = compartidas.push(t) - 1
  return i
}
const filas = autos
  .map((a, r) => {
    const celdas = [a.marca, a.modelo, a.precio, a.anio, a.patente, a.km, a.color].map((v, c) => {
      const ref = `${LETRAS[c]}${r + 1}`
      return typeof v === 'number'
        ? `<c r="${ref}"><v>${v}</v></c>`
        : `<c r="${ref}" t="s"><v>${indice(String(v))}</v></c>`
    })
    return `<row r="${r + 1}">${celdas.join('')}</row>`
  })
  .join('')

const textos = compartidas.map((t) => `<si><t>${esc(t)}</t></si>`).join('')
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const xlsx = zipSync({
  '[Content_Types].xml': strToU8(
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
  ),
  '_rels/.rels': strToU8(
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  ),
  'xl/workbook.xml': strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Autos" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  ),
  'xl/_rels/workbook.xml.rels': strToU8(
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>',
  ),
  'xl/sharedStrings.xml': strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="${NS}" count="${compartidas.length}" uniqueCount="${compartidas.length}">${textos}</sst>`,
  ),
  'xl/worksheets/sheet1.xml': strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}"><sheetData>${filas}</sheetData></worksheet>`,
  ),
})

writeFileSync(join(semilla, 'inventario-demo.xlsx'), xlsx)
console.log(`inventario-demo.xlsx: ${autos.length} autos`)
