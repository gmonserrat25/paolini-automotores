import { createClient } from '@supabase/supabase-js'

/* El acceso al panel. Las cuentas viven en Supabase (Authentication → Users);
   desde acá sólo se inicia y se cierra sesión: no hay registro, así que nadie
   se puede dar de alta solo (en Supabase hay que apagar "Allow new users to
   sign up").

   La URL y la clave "anon" son públicas por diseño: lo que protege los datos
   son las reglas de la base, no esconder estos dos valores. Si faltan, el panel
   no se abre (falla cerrado). */

const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configurado = Boolean(url && clave)

const supabase = configurado ? createClient(url, clave) : null

/* Sesión actual (o null). */
export async function sesionActual() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

/* Avisa cada vez que alguien entra o sale. Devuelve la función para dejar de
   escuchar. */
export function alCambiarSesion(avisar) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => avisar(sesion))
  return () => data.subscription.unsubscribe()
}

/* Devuelve un texto de error listo para mostrar, o null si salió bien. */
export async function entrar(email, contrasena) {
  if (!supabase) return 'El acceso todavía no está configurado.'
  const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena })
  if (!error) return null
  if (error.status === 400) return 'El mail o la contraseña no son correctos.'
  if (error.status === 429) return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'
  return 'No pudimos iniciar sesión. Revisá la conexión y probá de nuevo.'
}

export async function salir() {
  await supabase?.auth.signOut()
}
