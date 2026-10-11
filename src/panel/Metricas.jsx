import Numero from './Numero'
import Sparkline from './Sparkline'

function Tarjeta({ etiqueta, valor, serie, nota, indice }) {
  return (
    <article className="p-card p-entra flex flex-col justify-between gap-5 p-5" style={{ '--i': indice }}>
      <h3 className="text-[13px] text-white/60">{etiqueta}</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Numero valor={valor} className="font-saira text-[42px] font-semibold leading-none" />
          {nota && <p className="mt-2 text-xs text-white/60">{nota}</p>}
        </div>
        <Sparkline valores={serie} className="shrink-0" />
      </div>
    </article>
  )
}

export function MetricasEsqueleto() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-card flex h-[142px] flex-col justify-between p-5">
          <div className="p-esqueleto h-3.5 w-28" />
          <div className="flex items-end justify-between">
            <div className="p-esqueleto h-10 w-14" />
            <div className="p-esqueleto h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* Las cuatro tarjetas de arriba. El último punto de cada minigráfico es el
   valor de hoy, así que la forma y el número siempre coinciden. */
export default function Metricas({ stock, historial, semanal }) {
  const enStock = stock.filter((v) => v.estado !== 'vendido')
  const cero = enStock.filter((v) => v.condicion === '0km').length
  const usados = enStock.filter((v) => v.condicion === 'usado').length
  const ultimas = semanal.slice(-8).map((p) => p.valor)
  const [anterior, actual] = [ultimas.at(-2), ultimas.at(-1)]
  const variacion = Math.round(((actual - anterior) / anterior) * 100)

  const conHoy = (serie, hoy) => [...serie.slice(0, -1), hoy]

  return (
    <section aria-label="Métricas" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Tarjeta
        indice={0}
        etiqueta="Unidades en stock"
        valor={enStock.length}
        serie={conHoy(historial.stock, enStock.length)}
        nota={`${stock.length - enStock.length} vendida${stock.length - enStock.length === 1 ? '' : 's'}`}
      />
      <Tarjeta indice={1} etiqueta="0km" valor={cero} serie={conHoy(historial.cerokm, cero)} />
      <Tarjeta indice={2} etiqueta="Usados" valor={usados} serie={conHoy(historial.usados, usados)} />
      <Tarjeta
        indice={3}
        etiqueta="Consultas de la semana"
        valor={actual}
        serie={ultimas}
        nota={`${variacion >= 0 ? '+' : ''}${variacion}% vs. la anterior`}
      />
    </section>
  )
}
