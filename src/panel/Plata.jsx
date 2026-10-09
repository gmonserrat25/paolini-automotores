import { COSTO_TOTAL, capitalInmovilizado, enStock, pesosCorto, resumenVentas, viejas } from './calculos'
import { DIAS_ALERTA } from './mock'
import Numero from './Numero'

function Cifra({ etiqueta, valor, nota, indice, className = '' }) {
  return (
    <article className={`p-card p-entra flex flex-col justify-between gap-5 p-5 ${className}`} style={{ '--i': indice }}>
      <h3 className="text-[13px] text-white/60">{etiqueta}</h3>
      <div>
        <p className="font-saira text-[32px] font-semibold leading-none tabular-nums">{valor}</p>
        <p className="mt-2 text-xs text-white/60">{nota}</p>
      </div>
    </article>
  )
}

/* La plata del negocio: lo vendido en el mes contra el objetivo, lo que está
   parado en stock y el margen de lo que ya se vendió. */
export default function Plata({ datos }) {
  const { stock, objetivoVentas, mesAnterior } = datos
  const v = resumenVentas(datos)
  const avance = Math.min(1, v.unidades / objetivoVentas)
  const parados = viejas(stock).reduce((t, u) => t + COSTO_TOTAL(u), 0)
  const margenPct = v.pesos ? (v.margen / v.pesos) * 100 : 0

  return (
    <section aria-label="Plata" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="p-card p-entra flex flex-col justify-between gap-5 p-5 sm:col-span-2" style={{ '--i': 3 }}>
        <h3 className="text-[13px] text-white/60">Ventas del mes</h3>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="font-saira leading-none">
              <Numero valor={v.unidades} className="text-[42px] font-semibold" />
              <span className="ml-2 text-lg text-white/60">de {objetivoVentas} del objetivo</span>
            </p>
            <p className="mt-2 text-xs text-white/60">
              Mes anterior: {mesAnterior.unidades} unidades · {pesosCorto(mesAnterior.pesos)}
            </p>
          </div>
          <p className="font-saira text-[26px] font-semibold leading-none tabular-nums">{pesosCorto(v.pesos)}</p>
        </div>
        <span
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={objetivoVentas}
          aria-valuenow={v.unidades}
          aria-label="Avance contra el objetivo del mes"
          className="block h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        >
          <span
            key={v.unidades}
            className="p-barra block h-full rounded-full bg-[#E0323F]"
            style={{ '--i': 0, width: `${avance * 100}%` }}
          />
        </span>
      </article>

      <Cifra
        indice={4}
        etiqueta="Capital en stock"
        valor={pesosCorto(capitalInmovilizado(stock))}
        nota={`${enStock(stock).length} unidades sin vender · ${pesosCorto(parados)} con más de ${DIAS_ALERTA} días`}
      />
      <Cifra
        indice={5}
        etiqueta="Margen del mes"
        valor={pesosCorto(v.margen)}
        nota={`${margenPct.toFixed(1).replace('.', ',')}% de lo vendido, ya descontada la preparación`}
      />
    </section>
  )
}
