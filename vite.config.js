import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

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
      /* Igual para /api/lista (la lista de stock en PDF). */
      server.middlewares.use('/api/lista', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Usá POST' }))
        }
        let texto = ''
        for await (const trozo of req) texto += trozo
        try {
          const { leerListaConIA } = await server.ssrLoadModule('/api/_lista.js')
          res.end(JSON.stringify(await leerListaConIA(JSON.parse(texto), process.env.ANTHROPIC_API_KEY)))
        } catch (e) {
          res.statusCode = e.status ?? 502
          res.end(JSON.stringify({ error: e.message }))
        }
      })
      /* Igual para /api/asistente (el asistente de posts). */
      server.middlewares.use('/api/asistente', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Usá POST' }))
        }
        let texto = ''
        for await (const trozo of req) texto += trozo
        try {
          const { pedirPiezas } = await server.ssrLoadModule('/api/_asistente.js')
          res.end(JSON.stringify(await pedirPiezas(JSON.parse(texto), process.env.ANTHROPIC_API_KEY)))
        } catch (e) {
          res.statusCode = e.status ?? 502
          res.end(JSON.stringify({ error: e.message }))
        }
      })
      /* Las fotos de demo-datos/fotos, para la demo con stock
         (VITE_PANEL_DEMO_STOCK=1 npm run demo). */
      server.middlewares.use('/demo-fotos', (req, res, siguiente) => {
        const nombre = decodeURIComponent(req.url.slice(1).split('?')[0])
        if (!/^[a-z0-9]+\.jpg$/.test(nombre)) return siguiente()
        const ruta = path.join(process.cwd(), 'demo-datos/fotos', nombre)
        if (!fs.existsSync(ruta)) return siguiente()
        res.setHeader('Content-Type', 'image/jpeg')
        fs.createReadStream(ruta).pipe(res)
      })
    },
  }
}

// El sitio se publica en Vercel, en la raíz de https://paoliniautomotores.com/.
export default defineConfig(({ mode }) => ({
  plugins: [react(), reconocerLocal(loadEnv(mode, process.cwd(), ''))],
  /* Con API_LOCAL=http://localhost:3001 el servidor de desarrollo manda /api a
     otro proceso que corre las funciones (en Vercel no hace falta). */
  server: process.env.API_LOCAL ? { proxy: { '/api': process.env.API_LOCAL } } : undefined,
}))
