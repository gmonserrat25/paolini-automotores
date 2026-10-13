/* Lo que comparten las funciones de /api (el guión bajo evita que Vercel
   publique este archivo como una función).

   Variables de entorno del proyecto de Vercel (nunca en el código):
   - DATABASE_URL           la base Neon Postgres (la pone la integración)
   - BLOB_READ_WRITE_TOKEN  el almacén de fotos de Vercel Blob (lo pone Vercel)
   - SESSION_SECRET         texto largo al azar para firmar las sesiones
   - ANTHROPIC_API_KEY      sólo para api/reconocer.js */

import { neon } from '@neondatabase/serverless'
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/* ── Base de datos ─────────────────────────────────────────────────────── */

let cliente
export const sql = (...args) => (cliente ??= neon(process.env.DATABASE_URL))(...args)

/* Crea las tablas la primera vez que una función las necesita. Es idempotente:
   si ya existen, no hace nada. */
let listo
export function esquema() {
  listo ??= (async () => {
    await sql`create table if not exists autos (
      id             uuid primary key default gen_random_uuid(),
      patente        text not null unique,
      marca          text not null,
      modelo         text not null,
      tipo           text not null default 'Auto',
      combustible    text not null default 'Nafta',
      color          text,
      anio           integer,
      km             integer,
      precio         bigint,
      estado         text not null default 'disponible'
                     check (estado in ('disponible', 'reservado', 'vendido')),
      foto_url       text,
      reconocido_por text,
      creado         timestamptz not null default now()
    )`
    /* La patente es única sin importar espacios ni mayúsculas ("AF 459 VG" y
       "af459vg" son el mismo auto). */
    await sql`create unique index if not exists autos_patente_norm
      on autos ((regexp_replace(upper(patente), '[^A-Z0-9]', '', 'g')))`
    await sql`create table if not exists usuarios (
      email      text primary key,
      clave_hash text not null,
      creado     timestamptz not null default now()
    )`
    await sql`create table if not exists intentos (
      email  text not null,
      cuando timestamptz not null default now()
    )`
  })().catch((e) => {
    listo = undefined
    throw e
  })
  return listo
}

/* ── Claves ────────────────────────────────────────────────────────────── */

/* scrypt con sal propia: en la base nunca queda la clave, sólo este resumen. */
export async function hashear(clave) {
  const sal = randomBytes(16)
  const h = await scryptAsync(clave, sal, 32)
  return `s1$${sal.toString('hex')}$${h.toString('hex')}`
}

export async function verificar(clave, guardado) {
  const [version, sal, h] = (guardado ?? '').split('$')
  if (version !== 's1' || !sal || !h) return false
  const calculado = await scryptAsync(clave, Buffer.from(sal, 'hex'), 32)
  const esperado = Buffer.from(h, 'hex')
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
}

/* ── Sesión ────────────────────────────────────────────────────────────── */

const COOKIE = 'paolini_sesion'
const DURACION = 12 * 60 * 60 // segundos

function secreto() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Falta SESSION_SECRET (32 caracteres o más)')
  return s
}

const firmar = (texto) => createHmac('sha256', secreto()).update(texto).digest('base64url')

const flagsCookie = 'Path=/; HttpOnly; Secure; SameSite=Strict'

/* El valor de Set-Cookie que inicia la sesión de ese mail. */
export function cookieDeSesion(email) {
  const carga = Buffer.from(JSON.stringify({ e: email, x: Math.floor(Date.now() / 1000) + DURACION })).toString('base64url')
  return `${COOKIE}=${carga}.${firmar(carga)}; ${flagsCookie}; Max-Age=${DURACION}`
}

export const cookieDeSalida = `${COOKIE}=; ${flagsCookie}; Max-Age=0`

/* El mail de quien tiene sesión válida, o null. */
export function usuarioDe(req) {
  const valor = (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  const [carga, firma] = (valor ?? '').split('.')
  if (!carga || !firma) return null
  const esperada = Buffer.from(firmar(carga))
  const recibida = Buffer.from(firma)
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null
  try {
    const { e, x } = JSON.parse(Buffer.from(carga, 'base64url').toString())
    return x > Date.now() / 1000 ? e : null
  } catch {
    return null
  }
}

/* Corta la función con 401 si no hay sesión. Devuelve el mail si la hay. */
export function exigirSesion(req, res) {
  const email = usuarioDe(req)
  if (!email) res.status(401).json({ error: 'Sin sesión' })
  return email
}
