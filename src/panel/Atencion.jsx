import { COSTO_TOTAL, pesosCorto, sinResponder, viejas } from './calculos'
import { DIAS_ALERTA } from './mock'
import Numero from './Numero'

function Pendiente({ etiqueta, valor, detalle, alDia, onClick, indice }) {
  const hay = valor > 0
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-card p-entra flex flex-col justify-between gap-3 p-4 text-left sm:gap-5 sm:p-5 transition-colors hover:border-white/20 hover:bg-white/[0.02]"
      style={{ '--i': indice }}
    >
      <span className="text-[13px] text-white/60">{etiqueta}</span>
      <span className="flex items-end justify-between gap-3">
        <span>
          <Numero valor={valor} className={`font-saira text-[34px] font-semibold leading-none sm:text-[42px] ${hay ? 'text-[#FF6B76]' : ''}`} />
          <span className="mt-2 block text-xs text-white/60">{hay ? detalle : alDia}</span>
        </span>
        {hay && <span className="pb-1 text-[13px] text-white/80">Ver</span>}
      </span>
    </button>
  )
}

/* Lo que pide una acción hoy. Cada tarjeta lleva a la lista que la explica,
   ya filtrada. */
export default function Atencion({ stock, consultas, tasaciones, onVerConsultas, onVerStock, onVerTasaciones }) {
  const atrasadas = sinResponder(consultas).length
  const paradas = viejas(stock)
  const sinLlamar = tasaciones.filter((t) => !t.contactada).length

  return (
    <section aria-label="Pendientes" className="grid gap-4 sm:grid-cols-3">
      <Pendiente
        indice={0}
        etiqueta="Consultas sin responder"
        valor={atrasadas}
        detalle="Esperan hace más de 2 horas"
        alDia="Todas respondidas"
        onClick={onVerConsultas}
      />
      <Pendiente
        indice={1}
        etiqueta={`Unidades con más de ${DIAS_ALERTA} días`}
        valor={paradas.length}
        detalle={`${pesosCorto(paradas.reduce((t, v) => t + COSTO_TOTAL(v), 0))} parados`}
        alDia="Ninguna pasada de fecha"
        onClick={onVerStock}
      />
      <Pendiente
        indice={2}
        etiqueta="Tasaciones sin contactar"
        valor={sinLlamar}
        detalle="Pidieron un rango y nadie los llamó"
        alDia="Todas contactadas"
        onClick={onVerTasaciones}
      />
    </section>
  )
}
