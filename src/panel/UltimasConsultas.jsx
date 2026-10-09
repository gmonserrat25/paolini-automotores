import { WhatsAppIcon } from '../components/Icons'
import { IconoConsultas } from './icons'

const hhmm = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
const diaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })

function mismoDia(a, b) {
  return a.toDateString() === b.toDateString()
}

/* "hace 14 min" mientras es reciente; después, el momento exacto. */
function cuando(fecha) {
  const ahora = new Date()
  const min = Math.round((ahora - fecha) / 60_000)
  if (min < 60) return `hace ${Math.max(min, 1)} min`
  if (mismoDia(fecha, ahora)) return `Hoy ${hhmm.format(fecha)}`
  const ayer = new Date(ahora)
  ayer.setDate(ayer.getDate() - 1)
  if (mismoDia(fecha, ayer)) return `Ayer ${hhmm.format(fecha)}`
  const dia = diaSemana.format(fecha).replace('.', '')
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${hhmm.format(fecha)}`
}

function iniciales(nombre) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
}

function enlaceWhatsApp(c) {
  const texto = `Hola ${c.nombre.split(' ')[0]}, te escribimos de Automotores Paolini por tu consulta del ${c.vehiculo}.`
  return `https://wa.me/${c.telefono}?text=${encodeURIComponent(texto)}`
}

export default function UltimasConsultas({ consultas }) {
  return (
    <section id="consultas" className="p-card p-entra scroll-mt-24 p-5" style={{ '--i': 7 }}>
      <header className="flex items-baseline justify-between">
        <h2 className="font-jost text-lg font-medium">Últimas consultas</h2>
        <span className="text-[13px] text-white/60">{consultas.length} recientes</span>
      </header>

      {consultas.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center">
          <IconoConsultas className="h-6 w-6 text-white/60" />
          <p className="mt-3 text-sm">Todavía no entraron consultas</p>
          <p className="mt-1 text-[13px] text-white/60">Las que lleguen por la web aparecen acá.</p>
        </div>
      ) : (
        <ul className="mt-3">
          {consultas.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] font-saira text-[13px] font-semibold text-white/80"
              >
                {iniciales(c.nombre)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nombre}</p>
                <p className="truncate text-[13px] text-white/60">{c.vehiculo}</p>
                <p className="text-xs text-white/60">{cuando(c.fecha)}</p>
              </div>
              <a
                href={enlaceWhatsApp(c)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Escribir a ${c.nombre} por WhatsApp`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ConsultasEsqueleto() {
  return (
    <div className="p-card p-5">
      <div className="p-esqueleto h-5 w-40" />
      <div className="mt-5 space-y-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="p-esqueleto h-10 w-10 !rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="p-esqueleto h-3.5 w-32" />
              <div className="p-esqueleto h-3 w-24" />
            </div>
            <div className="p-esqueleto h-10 w-10 !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
