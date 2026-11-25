/* Avisa al contador (api/visitas.js) que se abrió una página del sitio. No
   espera respuesta ni frena nada: si falla, el sitio sigue igual. En
   desarrollo no cuenta. */
export function contarVisita() {
  if (import.meta.env.DEV) return
  try {
    navigator.sendBeacon?.('/api/visitas')
  } catch {
    /* sin contador, nada más */
  }
}
