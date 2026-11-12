import react from '@vitejs/plugin-react'
import { rename } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { armarPagina } from './api/_estatico.js'

/* La home para quien no corre JavaScript (api/_estatico.js).

   Al compilar se escribe el bloque en el index.html (sin autos: el stock lo
   pone api/inicio.js en cada visita) y después el archivo se renombra a
   `plantilla.html`. Sin un index.html en la salida, Vercel no tiene un archivo
   estático que gane en la raíz y manda `/` a esa función (ver vercel.json). */
function htmlEstatico() {
  let salida
  return {
    name: 'html-estatico',
    apply: 'build',
    configResolved(config) {
      salida = join(config.root, config.build.outDir)
    },
    transformIndexHtml: { order: 'post', handler: (html) => armarPagina(html, []) },
    async writeBundle() {
      await rename(join(salida, 'index.html'), join(salida, 'plantilla.html'))
    },
  }
}

/* Sólo para la demo local del panel (VITE_PANEL_DEMO=1, `npm run dev`): sirve
   /api/reconocer sin pasar por la base ni la sesión y con la ANTHROPIC_API_KEY del entorno
   (`key usar antrophic=ANTHROPIC_API_KEY -- npm run dev`). En producción esto no
   existe: ahí responde la función de Vercel, que exige sesión. */
function reconocerLocal(env) {
  return {
    name: 'reconocer-local',
    apply: 'serve',
    configureServer(server) {
      if (env.VITE_PANEL_DEMO !== '1') return
      server.middlewares.use('/api/reconocer', async (req, res) => {
        const responder = (estado, cuerpo) => {
          res.statusCode = estado
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(cuerpo))
        }
        if (req.method !== 'POST') return responder(405, { error: 'Usá POST' })
        let texto = ''
        for await (const trozo of req) texto += trozo
        try {
          const { reconocerAuto } = await server.ssrLoadModule('/api/_reconocer.js')
          responder(200, await reconocerAuto(JSON.parse(texto).imagen, process.env.ANTHROPIC_API_KEY))
        } catch (e) {
          responder(e.status ?? 502, { error: e.message })
        }
      })
    },
  }
}

// El sitio se publica en Vercel, en la raíz de https://paoliniautomotores.com/.
export default defineConfig(({ mode }) => ({
  plugins: [react(), htmlEstatico(), reconocerLocal(loadEnv(mode, process.cwd(), ''))],
  /* Con API_LOCAL=http://localhost:3001 el servidor de desarrollo manda /api a
     otro proceso que corre las funciones (en Vercel no hace falta). */
  server: process.env.API_LOCAL ? { proxy: { '/api': process.env.API_LOCAL } } : undefined,
}))
