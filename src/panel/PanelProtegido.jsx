import { useEffect, useState } from 'react'
import './panel.css'
import { alCambiarSesion, configurado, entrar, salir, sesionActual } from './acceso'
import Panel from './Panel'

/* La puerta del panel: sin sesión se ve el login y nada más. Panel.jsx se baja
   igual (es un chunk aparte del sitio público), pero no se dibuja ni pide nada
   hasta que hay un dueño con sesión iniciada. */

function Login() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const falla = await entrar(email.trim(), contrasena)
    if (falla) {
      setError(falla)
      setContrasena('')
    }
    setEnviando(false)
  }

  const campo =
    'mt-1.5 w-full rounded-xl border border-white/[0.1] bg-[#0B0B0C] px-4 py-3 text-sm text-white placeholder:text-white/40 transition-colors hover:border-white/20 focus:border-white/40 focus:outline-none'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#010101] px-4 py-10 text-white">
      <div className="w-full max-w-sm">
        <span
          aria-hidden="true"
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#E0323F]/60 font-jost text-xl font-semibold text-[#E0323F]"
        >
          P
        </span>
        <h1 className="text-center font-jost text-2xl font-medium">Panel de Paolini</h1>
        <p className="mt-1 text-center text-sm text-white/60">Acceso sólo para el equipo de la agencia.</p>

        {configurado ? (
          <form onSubmit={enviar} className="p-card mt-6 space-y-4 p-5">
            <label className="block text-sm">
              Mail
              <input
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campo}
              />
            </label>
            <label className="block text-sm">
              Contraseña
              <input
                type="password"
                required
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className={campo}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-[#FF6B76]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-[#E0323F] py-3 text-sm font-medium transition-colors hover:bg-[#EA4350] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="text-center text-xs text-white/60">
              ¿Perdiste la contraseña? Pedísela a quien administra el panel.
            </p>
          </form>
        ) : (
          <p role="alert" className="p-card mt-6 p-5 text-sm text-white/80">
            El acceso todavía no está configurado. Faltan las claves de Supabase en el proyecto.
          </p>
        )}
      </div>
    </main>
  )
}

export default function PanelProtegido() {
  /* undefined = todavía no sabemos; null = sin sesión. */
  const [sesion, setSesion] = useState(undefined)

  useEffect(() => {
    let vigente = true
    sesionActual().then((s) => vigente && setSesion(s))
    const dejar = alCambiarSesion((s) => vigente && setSesion(s))
    return () => {
      vigente = false
      dejar()
    }
  }, [])

  useEffect(() => {
    const titulo = document.title
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = 'Acceso · Automotores Paolini'
    return () => {
      document.title = titulo
      meta.remove()
    }
  }, [])

  if (sesion === undefined) return <div className="min-h-screen bg-[#010101]" />
  if (!sesion) return <Login />
  return <Panel onSalir={salir} />
}
