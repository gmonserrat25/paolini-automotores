/* Historia de Instagram/WhatsApp (1080×1920) de un auto, con su foto real y
   los datos del panel. La IA no dibuja nada: la foto es la que subieron.

   Uso: node scripts/historias/historia.mjs <patente|número> [salida.png]
   Lee demo-datos/inventario.json (mismo formato que el panel). */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const RAIZ = resolve(import.meta.dirname, '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const NEGOCIO = { whatsapp: '3548 468411', direccion: 'Av. España 601, La Falda' }

const [clave = '0', salida = 'historia.png'] = process.argv.slice(2)
const { autos } = JSON.parse(readFileSync(join(RAIZ, 'demo-datos/inventario.json'), 'utf8'))
const auto = autos.find((a) => a.patente.replace(/\s/g, '') === clave.replace(/\s/g, '').toUpperCase()) ?? autos[Number(clave)]
if (!auto) throw new Error(`No encuentro el auto "${clave}"`)

const palabra = (p) => (p.length <= 3 || /\d/.test(p) ? p : p[0] + p.slice(1).toLowerCase())
const titulo = (s) => s.split(' ').map(palabra).join(' ')
const miles = (n) => n.toLocaleString('es-AR')
const foto = join(RAIZ, 'demo-datos/fotos', auto.foto.split('/').pop())
const logo = join(RAIZ, 'public/ig/logo-paolini.svg')

const datos = [auto.anio, `${miles(auto.km)} km`, auto.combustible, auto.tipo].filter(Boolean)

const html = `<!doctype html><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Saira:ital,wght@1,700;1,800&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:#010101;color:#fff;font-family:'Archivo',sans-serif;position:relative;overflow:hidden}
.logo{position:absolute;left:72px;top:262px;width:430px}
.foto{position:absolute;left:0;top:340px;width:1080px;height:1090px;object-fit:cover;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 66%,transparent 96%)}
.txt{position:absolute;left:72px;right:72px;top:1340px}
.marca{font-size:34px;font-weight:600;color:#E0323F}
h1{font-family:'Saira',sans-serif;font-style:italic;font-weight:800;font-size:92px;line-height:1;margin-top:10px}
.datos{font-size:35px;font-weight:500;color:#c9c9c9;margin-top:26px}
.precio{font-size:74px;font-weight:700;margin-top:34px}
.pie{position:absolute;left:72px;right:72px;top:1672px;border-top:2px solid #A8162A;padding-top:30px;
  display:flex;justify-content:space-between;font-size:31px;color:#c9c9c9}
.pie b{color:#fff;font-weight:600;display:flex;align-items:center;gap:14px}
svg{width:34px;height:34px;fill:#fff}
</style>
<img class="logo" src="file://${logo}">
<img class="foto" src="file://${foto}">
<div class="txt">
  <div class="marca">${titulo(auto.marca)}</div>
  <h1>${titulo(auto.modelo)}</h1>
  <div class="datos">${datos.join(' · ')}</div>
  <div class="precio">$ ${miles(auto.precio)}</div>
</div>
<div class="pie">
  <b><svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35ZM12.04 2a9.93 9.93 0 0 0-8.5 15.05L2 22l5.07-1.33A9.93 9.93 0 1 0 12.04 2Zm0 1.67a8.26 8.26 0 1 1-4.2 15.37l-.3-.18-3 .79.8-2.93-.2-.31A8.26 8.26 0 0 1 12.04 3.67Z"/></svg>${NEGOCIO.whatsapp}</b>
  <span>${NEGOCIO.direccion}</span>
</div>`

const dir = mkdtempSync(join(tmpdir(), 'historia-'))
const archivo = join(dir, 'historia.html')
writeFileSync(archivo, html)
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
  '--window-size=1080,1920', '--virtual-time-budget=8000', `--screenshot=${resolve(salida)}`, `file://${archivo}`], { stdio: 'ignore' })
console.log(resolve(salida))
