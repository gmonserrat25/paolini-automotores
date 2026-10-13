# Automotores Paolini

Sitio de [Automotores Paolini](https://www.instagram.com/paoliniautomotores/),
concesionaria multimarca de Av. España 601, La Falda, Córdoba.

Publicado en **https://paoliniautomotores.com/** (Vercel).

## Correr en local

```bash
npm install
npm run dev
```

## Publicar

El proyecto de Vercel (`paolini-automotores`) no está conectado al repo, así
que se publica a mano desde `main` con la CLI de Vercel:

```bash
npm run deploy   # vercel --prod
```

El DNS del dominio está en Cloudflare: `A @ 76.76.21.21` y
`CNAME www cname.vercel-dns.com`, sin proxy. Vercel redirige `www` a la raíz.

## Cómo está armado

- **Vite + React + Tailwind.** Sin router: es una sola página con anclas.
- **Hero con blob cursor** (`src/components/BlobRevealHero.jsx`). La foto de
  fondo va oscura y casi monocroma; una máscara SVG con filtro gooey sigue al
  puntero y devuelve color y luz sobre el mismo encuadre. Los elementos con
  `data-pa-ink` se invierten cuando el blob les pasa por debajo y los
  `data-depth` acompañan el parallax. A ancho de teléfono las dos capas cambian
  a un recorte vertical del mismo auto.
- **Las fotos salen del Instagram de la concesionaria.** Los recortes que sirve
  el sitio están en `public/ig/`; los originales sin tocar, en
  `assets-src/instagram/`.
- **El wordmark del hero y el logo del navbar** se reconstruyeron apilando 24
  apariciones del logo en sus posteos: se localizan por la línea roja bajo
  "AUTOMOTORES", se alinean por correlación cruzada y se combinan por mediana,
  lo que cancela el ruido de compresión de cada JPEG. El original en vectorial
  no lo tenemos.
- **Tipografías:** Jost para títulos, Archivo para texto.

## Demo del panel (sin Supabase)

Para mostrar el panel de `/panel` en una compu, sin cuenta de Supabase:

```bash
git checkout worktree-paolini-cargar-autos
npm install
OPENAI_API_KEY=sk-... npm run demo     # abre http://localhost:5173/panel
```

- Entrar con `demo@paolini.com` / `demo1234` (cuenta ficticia, sólo existe en este modo).
- Arranca sin autos. En **Carga**, arrastrar `supabase/seed/inventario-demo.xlsx` junto con las
  fotos de `supabase/seed/fotos`: la IA reconoce cada foto y carga los autos sola.
- Sin `OPENAI_API_KEY` la demo anda igual, pero las fotos hay que asignarlas a mano.
- Los autos viven en memoria: al recargar la página desaparecen. Nada se publica.
- La key de OpenAI nunca se commitea: se pasa por el entorno.
