/* Sesión del panel. GET dice quién está adentro, POST inicia sesión con mail
   y contraseña, DELETE la cierra. Las cuentas están en la tabla `usuarios`
   (se crean con scripts/panel/crear-usuario.mjs): no hay registro. */

import { cookieDeSalida, cookieDeSesion, esquema, sql, usuarioDe, verificar } from './_comun.js'

const MAX_FALLOS = 8 // por mail, en 10 minutos

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    const email = usuarioDe(req)
    return email ? res.status(200).json({ email }) : res.status(401).json({ error: 'Sin sesión' })
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', cookieDeSalida)
    return res.status(204).end()
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, clave } = req.body ?? {}
  if (typeof email !== 'string' || typeof clave !== 'string' || !email || !clave || clave.length > 200) {
    return res.status(400).json({ error: 'Faltan el mail o la contraseña' })
  }
  const mail = email.trim().toLowerCase()

  await esquema()
  const [{ fallos }] = await sql`
    select count(*)::int as fallos from intentos
    where email = ${mail} and cuando > now() - interval '10 minutes'`
  if (fallos >= MAX_FALLOS) return res.status(429).json({ error: 'Demasiados intentos' })

  const [usuario] = await sql`select clave_hash from usuarios where email = ${mail}`
  /* Se verifica siempre (aunque el mail no exista) para que no se note por el
     tiempo de respuesta si la cuenta existe. */
  const valida = await verificar(clave, usuario?.clave_hash ?? 's1$00$00')
  if (!usuario || !valida) {
    await sql`insert into intentos (email) values (${mail})`
    return res.status(401).json({ error: 'Mail o contraseña incorrectos' })
  }

  await sql`delete from intentos where email = ${mail}`
  res.setHeader('Set-Cookie', cookieDeSesion(mail))
  return res.status(200).json({ email: mail })
}
