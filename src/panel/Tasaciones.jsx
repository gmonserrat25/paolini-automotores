import { WhatsAppIcon } from '../components/Icons'
import { cuotasPorUnidad, pesos, pesosCorto } from './calculos'
import { IconoCheck } from './icons'

const enlace = (t) =>
  `https://wa.me/${t.telefono}?text=${encodeURIComponent(
    `Hola ${t.nombre.split(' ')[0]}, te escribimos de Automotores Paolini por la tasación de tu ${t.auto}.`,
  )}`

const km = new Intl.NumberFormat('es-AR')

function hace(fecha) {
  const min = Math.round((new Date() - fecha) / 60_000)
  if (min < 60) return `hace ${Math.max(min, 1)} min`
  if (min < 1440) return `hace ${Math.round(min / 60)} h`
  return `hace ${Math.round(min / 1440)} d`
}

/* Los autos que la gente quiere entregar. La IA devuelve un rango; el número
   que cierra lo pone el vendedor, por eso cada fila pide llamar. */
export function Tasaciones({ tasaciones, onMarcar }) {
  const sinLlamar = tasaciones.filter((t) => !t.contactada).length

  return (
    <section id="tasaciones" className="p-card p-entra scroll-mt-24 p-5" style={{ '--i': 11 }}>
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-jost text-lg font-medium">Tasaciones recibidas</h2>
        <span className="text-[13px] text-white/60">{sinLlamar} sin contactar</span>
      </header>

      {tasaciones.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/[0.1] px-6 py-10 text-center text-sm text-white/60">
          Todavía nadie pidió una tasación.
        </p>
      ) : (
        <ul className="mt-3">
          {tasaciones.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.03]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.auto} <span className="font-normal text-white/60">· {km.format(t.km)} km</span>
                </p>
                <p className="text-[13px] tabular-nums text-white/80">
                  {pesosCorto(t.desde)} a {pesosCorto(t.hasta)}
                </p>
                <p className="truncate text-xs text-white/60">
                  {t.nombre} · {hace(t.fecha)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onMarcar(t.id, !t.contactada)}
                aria-pressed={t.contactada}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  t.contactada
                    ? 'border-white/25 bg-white/10 text-white'
                    : 'border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                {t.contactada && <IconoCheck className="h-4 w-4" />}
                {t.contactada ? 'Contactada' : 'Sin contactar'}
              </button>
              <a
                href={enlace(t)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => !t.contactada && onMarcar(t.id, true)}
                aria-label={`Escribir a ${t.nombre} por WhatsApp`}
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

/* Qué unidades despiertan interés financiado: cuántas veces se simuló la
   cuota de cada una y con qué anticipo y plazo. */
export function CuotasSimuladas({ simulaciones, stock }) {
  const filas = cuotasPorUnidad(simulaciones, stock)
  const max = Math.max(1, ...filas.map((f) => f.cantidad))

  return (
    <section className="p-card p-entra p-5" style={{ '--i': 12 }}>
      <h2 className="font-jost text-lg font-medium">Cuotas simuladas</h2>
      <p className="mt-0.5 text-[13px] text-white/60">Por unidad, últimos 30 días</p>

      <ul className="mt-5 space-y-4">
        {filas.map((f, i) => (
          <li key={f.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{f.unidad}</span>
              <span className="font-saira font-semibold tabular-nums">{f.cantidad}</span>
            </div>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="p-barra block h-full rounded-full"
                style={{
                  '--i': i,
                  width: `${(f.cantidad / max) * 100}%`,
                  background: i === 0 ? '#E0323F' : 'rgb(255 255 255 / 0.55)',
                }}
              />
            </span>
            <p className="mt-1.5 text-xs text-white/60">
              Anticipo promedio {pesos(Math.round(f.anticipo / 100_000) * 100_000)} · lo más elegido, {f.cuotas} cuotas
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
