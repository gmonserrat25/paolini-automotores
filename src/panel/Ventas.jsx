import { demanda, resumenVentas } from './calculos'
import { ORIGENES, ORIGEN_LABEL } from './mock'

const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0)

/* El embudo del mes: de cuántos consultaron a cuántos compraron, y el mismo
   recorrido separado por el lugar de donde vino cada cliente. */
export function EmbudoMes({ datos }) {
  const { embudo } = datos
  const { ventas, unidades } = resumenVentas(datos)

  const filas = ORIGENES.map((o) => ({
    origen: o,
    consultas: embudo.origen[o].consultas,
    visitas: embudo.origen[o].visitas,
    ventas: ventas.filter((v) => v.origen === o).length,
  })).sort((a, b) => b.consultas - a.consultas)

  const consultas = filas.reduce((t, f) => t + f.consultas, 0)
  const visitas = filas.reduce((t, f) => t + f.visitas, 0)
  const pasos = [
    { id: 'consultas', etiqueta: 'Consultas', n: consultas },
    { id: 'visitas', etiqueta: 'Visitas al salón', n: visitas },
    { id: 'presupuestos', etiqueta: 'Presupuestos', n: embudo.presupuestos },
    { id: 'ventas', etiqueta: 'Ventas', n: unidades },
  ]

  return (
    <section className="p-card p-entra p-5 lg:col-span-2" style={{ '--i': 8 }}>
      <h2 className="font-jost text-lg font-medium">Embudo del mes</h2>
      <p className="mt-0.5 text-[13px] text-white/60">De la consulta a la venta, y de dónde viene cada cliente</p>

      <ol className="mt-5 space-y-3.5">
        {pasos.map((p, i) => (
          <li key={p.id}>
            <div className="flex items-baseline gap-3 text-sm">
              <span className="flex-1">{p.etiqueta}</span>
              {i > 0 && (
                <span className="text-xs text-white/60">{porcentaje(p.n, pasos[i - 1].n)}% del paso anterior</span>
              )}
              <span className="w-10 text-right font-saira font-semibold tabular-nums">{p.n}</span>
            </div>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="p-barra block h-full rounded-full"
                style={{
                  '--i': i,
                  width: `${Math.max(1.5, porcentaje(p.n, consultas))}%`,
                  background: p.id === 'ventas' ? '#E0323F' : 'rgb(255 255 255 / 0.55)',
                }}
              />
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">Consultas, visitas y ventas por origen</caption>
          <thead>
            <tr className="border-b border-white/[0.08] text-left text-xs font-normal text-white/60">
              <th scope="col" className="pb-2.5 font-normal">Origen</th>
              <th scope="col" className="pb-2.5 text-right font-normal">Consultas</th>
              <th scope="col" className="pb-2.5 text-right font-normal">Visitas</th>
              <th scope="col" className="pb-2.5 text-right font-normal">Ventas</th>
              <th scope="col" className="pb-2.5 text-right font-normal">Consulta a venta</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.origen} className="border-b border-white/[0.05] last:border-0">
                <th scope="row" className="py-3 text-left font-normal">{ORIGEN_LABEL[f.origen]}</th>
                <td className="py-3 text-right tabular-nums">{f.consultas}</td>
                <td className="py-3 text-right tabular-nums">{f.visitas}</td>
                <td className="py-3 text-right tabular-nums">{f.ventas}</td>
                <td className="py-3 text-right tabular-nums text-white/80">
                  {porcentaje(f.ventas, f.consultas)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* Lo que escribió la gente en el buscador de la web, contra lo que hay
   disponible hoy para responderle. */
export function QuePidenYQueHay({ busquedas, stock }) {
  const filas = demanda(busquedas, stock)
  const max = Math.max(1, ...filas.map((f) => f.cantidad))

  return (
    <section className="p-card p-entra p-5" style={{ '--i': 9 }}>
      <h2 className="font-jost text-lg font-medium">Qué piden y qué hay</h2>
      <p className="mt-0.5 text-[13px] text-white/60">Búsquedas en la web, últimos 30 días</p>

      <ul className="mt-5 space-y-4">
        {filas.map((f, i) => {
          const corto = f.unidades === 0 || f.cantidad / f.unidades >= 10
          return (
            <li key={f.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{f.etiqueta}</span>
                <span className="font-saira font-semibold tabular-nums">{f.cantidad}</span>
              </div>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className="p-barra block h-full rounded-full bg-white/[0.55]"
                  style={{ '--i': i, width: `${(f.cantidad / max) * 100}%` }}
                />
              </span>
              <p className={`mt-1.5 text-xs ${corto ? 'text-[#FF6B76]' : 'text-white/60'}`}>
                {f.unidades === 0
                  ? 'Sin unidades disponibles'
                  : `${f.unidades} ${f.unidades === 1 ? 'disponible' : 'disponibles'}${corto ? ': son pocas para esta demanda' : ''}`}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
