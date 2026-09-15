/* Las fotos viven en public/, así que sus rutas no pasan por el bundler y
   quedan tal cual se escriben. En GitHub Pages el sitio cuelga de
   /paolini-automotores/, de modo que una ruta absoluta como /ig/foo.jpg
   apuntaría fuera del sitio: hay que anteponerle la base de publicación. */
export function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`
}
