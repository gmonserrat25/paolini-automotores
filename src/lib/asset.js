/* Las fotos viven en public/, así que sus rutas no pasan por el bundler y
   quedan tal cual se escriben. Hoy el sitio se sirve desde la raíz, pero
   pasar las rutas por acá les antepone la base de Vite si algún día cambia. */
export function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`
}
