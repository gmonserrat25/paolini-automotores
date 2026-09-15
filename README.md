# Automotores Paolini

Sitio de [Automotores Paolini](https://www.instagram.com/paoliniautomotores/),
concesionaria multimarca de Av. España 601, La Falda, Córdoba.

Publicado en **https://gmonserrat25.github.io/paolini-automotores/**

## Correr en local

```bash
npm install
npm run dev
```

## Publicar

Cada push a `main` dispara el workflow de GitHub Pages
(`.github/workflows/deploy.yml`), que construye con `GITHUB_PAGES=true` para
que los assets cuelguen del subdirectorio del repo.

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
