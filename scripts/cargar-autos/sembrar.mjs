/* Pasa los autos de supabase/seed (inventario.json + fotos) a la base y al
   bucket de Supabase. Se corre una sola vez, después de supabase/001_autos.sql.

   Usa la clave "service_role" (administrador): sólo desde tu Mac, nunca en el
   código ni en Vercel.

     key usar supabase-url=SUPABASE_URL supabase-service=SUPABASE_SERVICE_ROLE_KEY -- \
       node scripts/cargar-autos/sembrar.mjs

   Se puede repetir: la patente es única y se actualiza en vez de duplicarse. */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (usá `key usar ... --`).')
  process.exit(1)
}

const semilla = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'seed')
const { autos } = JSON.parse(readFileSync(join(semilla, 'inventario.json'), 'utf8'))
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

for (const a of autos) {
  const archivo = a.foto.split('/').pop()
  const { error: errFoto } = await supabase.storage
    .from('autos')
    .upload(archivo, readFileSync(join(semilla, 'fotos', archivo)), { upsert: true, contentType: 'image/jpeg' })
  if (errFoto) throw new Error(`Foto ${archivo}: ${errFoto.message}`)

  const { error } = await supabase.from('autos').upsert(
    {
      patente: a.patente,
      marca: a.marca,
      modelo: a.modelo,
      tipo: a.tipo,
      combustible: a.combustible,
      color: a.color,
      anio: a.anio,
      km: a.km,
      precio: a.precio,
      foto_path: archivo,
      reconocido_por: a.reconocido_por,
    },
    { onConflict: 'patente' },
  )
  if (error) throw new Error(`Auto ${a.patente}: ${error.message}`)
  console.log(`ok  ${a.patente}  ${a.marca} ${a.modelo}`)
}
console.log(`${autos.length} autos cargados.`)
