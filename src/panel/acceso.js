/* El acceso al panel. La sesión vive en una cookie que pone /api/sesion (del
   servidor, HttpOnly: desde acá no se lee). Las cuentas están en la tabla
   `usuarios` de la base; no hay registro, así que nadie se puede dar de alta
   solo. */

/* Demo local (ver demo.js): sin base y con una cuenta ficticia. Sólo en
   `npm run dev` con VITE_PANEL_DEMO=1; en producción la condición es falsa. */
export const DEMO = import.meta.env.DEV && import.meta.env.VITE_PANEL_DEMO === '1'
const CUENTA_DEMO = { email: 'demo@paolini.com', contrasena: 'demo1234' }
const SESION_DEMO = { email: CUENTA_DEMO.email }
const enDemo = () => sessionStorage.getItem('panel-demo') === '1'

export const configurado = true

/* Quienes quieren enterarse cuando alguien entra o sale. */
const oyentes = new Set()
const avisar = (sesion) => oyentes.forEach((f) => f(sesion))

/* Sesión actual ({ email }) o null. */
export async function sesionActual() {
  if (DEMO) return enDemo() ? SESION_DEMO : null
  try {
    const r = await fetch('/api/sesion', { credentials: 'same-origin' })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export function alCambiarSesion(f) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

/* Devuelve un texto de error listo para mostrar, o null si salió bien. */
export async function entrar(email, contrasena) {
  if (DEMO) {
    if (email !== CUENTA_DEMO.email || contrasena !== CUENTA_DEMO.contrasena) {
      return 'El mail o la contraseña no son correctos.'
    }
    sessionStorage.setItem('panel-demo', '1')
    avisar(SESION_DEMO)
    return null
  }
  try {
    const r = await fetch('/api/sesion', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, clave: contrasena }),
    })
    if (r.ok) {
      avisar(await r.json())
      return null
    }
    if (r.status === 401) return 'El mail o la contraseña no son correctos.'
    if (r.status === 429) return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'
  } catch {
    /* sin conexión: cae al mensaje de abajo */
  }
  return 'No pudimos iniciar sesión. Revisá la conexión y probá de nuevo.'
}

export async function salir() {
  if (DEMO) sessionStorage.removeItem('panel-demo')
  else await fetch('/api/sesion', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {})
  avisar(null)
}
