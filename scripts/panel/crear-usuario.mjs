/* Crea una cuenta del panel, o cambia la contraseña si el mail ya existe.
   La contraseña va por entorno (no por argumento, para que no quede en el
   historial de la terminal) y en la base se guarda sólo su resumen scrypt.

     PANEL_EMAIL=dueño@paolini.com PANEL_CLAVE='una-clave-larga' \
       DATABASE_URL=... node scripts/panel/crear-usuario.mjs

   DATABASE_URL es la de Vercel: `vercel env pull` la baja a un archivo. */

import { esquema, hashear, sql } from '../../api/_comun.js'

const email = process.env.PANEL_EMAIL?.trim().toLowerCase()
const clave = process.env.PANEL_CLAVE
if (!email || !clave || !process.env.DATABASE_URL) {
  console.error('Faltan PANEL_EMAIL, PANEL_CLAVE o DATABASE_URL.')
  process.exit(1)
}
if (clave.length < 8) {
  console.error('La contraseña tiene que tener al menos 8 caracteres.')
  process.exit(1)
}

await esquema()
await sql`
  insert into usuarios (email, clave_hash) values (${email}, ${await hashear(clave)})
  on conflict (email) do update set clave_hash = excluded.clave_hash`
console.log(`Cuenta lista: ${email}`)
