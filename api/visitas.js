/* El contador de visitas del sitio.

   POST   público: lo manda el sitio (navigator.sendBeacon) cada vez que se abre
          una página. Anota una visita por persona por día.
   GET    con sesión: lo que muestra el panel (hoy, 7 y 30 días, la serie
          diaria de los últimos 30 días y el total desde que se cuenta).

   Sin cookies ni datos personales: a cada persona la identifica una huella
   (resumen de su IP + navegador + el día, con SESSION_SECRET como sal) que
   cambia todos los días y no se puede revertir. No cuentan los bots, las
   vistas previas de WhatsApp/Facebook ni los dueños con sesión del panel. */

import { createHash } from 'node:crypto'
import { esquema, exigirSesion, sql, usuarioDe } from './_comun.js'

const ZONA = 'America/Argentina/Cordoba'
const DIAS = 30
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pagespeed|curl|wget|python|node-fetch|axios|vercel/i

/* La fecha de hoy en La Falda, "2026-11-25". */
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date())

function huella(req, dia) {
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
  const navegador = String(req.headers['user-agent'] ?? '')
  return createHash('sha256')
    .update(`${process.env.SESSION_SECRET}|${dia}|${ip}|${navegador}`)
    .digest('base64url')
    .slice(0, 22)
}

/* Sólo cuenta lo que viene del propio sitio: si el navegador manda Origin,
   tiene que ser el mismo dominio. */
function delSitio(req) {
  const origen = req.headers.origin
  if (!origen) return true
  try {
    return new URL(origen).host === req.headers.host
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Cache-Control', 'no-store')
    const navegador = String(req.headers['user-agent'] ?? '')
    if (!navegador || BOT.test(navegador) || !delSitio(req) || usuarioDe(req)) return res.status(204).end()
    await esquema()
    const dia = hoy()
    await sql`
      insert into visitas (dia, visitante) values (${dia}, ${huella(req, dia)})
      on conflict (dia, visitante) do update set vistas = least(visitas.vistas + 1, 500)`
    return res.status(204).end()
  }

  if (req.method === 'GET') {
    if (!exigirSesion(req, res)) return
    res.setHeader('Cache-Control', 'no-store')
    await esquema()
    const dia = hoy()
    const [filas, [total]] = await Promise.all([
      sql`
        select to_char(dia, 'YYYY-MM-DD') as dia, count(*)::int as personas, sum(vistas)::int as vistas
        from visitas where dia > ${dia}::date - ${DIAS}::int
        group by dia`,
      sql`select count(*)::int as visitas, to_char(min(dia), 'YYYY-MM-DD') as desde from visitas`,
    ])
    /* La serie completa, con 0 en los días sin visitas. */
    const porDia = Object.fromEntries(filas.map((f) => [f.dia, f]))
    const serie = Array.from({ length: DIAS }, (_, i) => {
      const d = new Date(`${dia}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() - (DIAS - 1 - i))
      const clave = d.toISOString().slice(0, 10)
      return { dia: clave, personas: porDia[clave]?.personas ?? 0, vistas: porDia[clave]?.vistas ?? 0 }
    })
    return res.status(200).json({ hoy: dia, serie, total: total.visitas, desde: total.desde })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
