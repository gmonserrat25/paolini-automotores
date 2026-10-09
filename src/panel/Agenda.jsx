import { TIPO_AGENDA } from './mock'

const hhmm = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

/* Lo que pasa hoy en el salón: visitas, pruebas de manejo y entregas. Lo que
   ya pasó queda apagado y la próxima lleva el rojo. */
export default function Agenda({ agenda }) {
  const ahora = new Date()
  const proxima = agenda.find((a) => a.cuando > ahora)

  return (
    <section id="agenda" className="p-card p-entra scroll-mt-24 p-5" style={{ '--i': 6 }}>
      <header className="flex items-baseline justify-between">
        <h2 className="font-jost text-lg font-medium">Hoy en el salón</h2>
        <span className="text-[13px] text-white/60">
          {agenda.length} {agenda.length === 1 ? 'turno' : 'turnos'}
        </span>
      </header>

      {agenda.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/[0.1] px-6 py-8 text-center text-sm text-white/60">
          No hay visitas ni entregas agendadas para hoy.
        </p>
      ) : (
        <ul className="mt-3">
          {agenda.map((a) => {
            const paso = a.cuando <= ahora
            return (
              <li key={a.id} className="flex gap-4 rounded-2xl px-2 py-3">
                <span
                  className={`w-12 shrink-0 pt-px font-saira text-sm font-semibold tabular-nums ${
                    paso ? 'text-white/60' : a === proxima ? 'text-[#FF6B76]' : ''
                  }`}
                >
                  {hhmm.format(a.cuando)}
                </span>
                <div className={`min-w-0 flex-1 ${paso ? 'text-white/60' : ''}`}>
                  <p className="truncate text-sm font-medium">{a.cliente}</p>
                  <p className="truncate text-[13px] text-white/60">
                    {TIPO_AGENDA[a.tipo]} · {a.vehiculo}
                  </p>
                </div>
                {a === proxima && <span className="shrink-0 text-xs text-[#FF6B76]">Próxima</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
