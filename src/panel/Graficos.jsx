import { useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import LineChart from './LineChart'
import Numero from './Numero'

const RANGOS = [
  { id: 'mensual', etiqueta: 'Mensual', detalle: 'Últimas 12 semanas' },
  { id: 'anual', etiqueta: 'Anual', detalle: 'Promedio semanal de cada mes, último año' },
]

/* Gráfico principal: consultas por semana. */
export function ConsultasPorSemana({ series }) {
  const [rango, setRango] = useState('mensual')
  const actual = RANGOS.find((r) => r.id === rango)

  return (
    <section className="p-card p-entra p-5 lg:col-span-2" style={{ '--i': 4 }}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-jost text-lg font-medium">Consultas por semana</h2>
          <p className="mt-0.5 text-[13px] text-white/60">{actual.detalle}</p>
        </div>
        <div role="group" aria-label="Rango" className="flex rounded-full border border-white/[0.08] p-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              aria-pressed={rango === r.id}
              className={`rounded-full px-3.5 py-1 text-[13px] transition-colors ${
                rango === r.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {r.etiqueta}
            </button>
          ))}
        </div>
      </header>
      <LineChart key={rango} puntos={series[rango]} />
    </section>
  )
}

/* Gráfico secundario: unidades en stock por marca. Tocar una marca filtra la
   tabla de abajo. */
export function StockPorMarca({ stock, marca, onMarca }) {
  const marcas = [...new Set(stock.map((v) => v.brand))]
    .map((nombre) => ({
      nombre,
      cantidad: stock.filter((v) => v.brand === nombre && v.estado !== 'vendido').length,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
  const max = Math.max(1, ...marcas.map((m) => m.cantidad))

  return (
    <section className="p-card p-entra p-5" style={{ '--i': 5 }}>
      <h2 className="font-jost text-lg font-medium">Stock por marca</h2>
      <p className="mt-0.5 text-[13px] text-white/60">Unidades sin vender</p>
      <ul className="mt-5 space-y-1">
        {marcas.map((m, i) => (
          <li key={m.nombre}>
            <button
              type="button"
              onClick={() => onMarca(marca === m.nombre ? null : m.nombre)}
              aria-pressed={marca === m.nombre}
              className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                marca === m.nombre
                  ? 'border-white/[0.14] bg-white/[0.04]'
                  : 'border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BrandLogo marca={m.nombre} className="h-5 w-5 shrink-0 text-white/60" />
                <span className="flex-1 text-sm">{m.nombre}</span>
                <Numero valor={m.cantidad} className="font-saira text-sm font-semibold" />
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className="p-barra block h-full rounded-full"
                  style={{
                    '--i': i,
                    width: `${(m.cantidad / max) * 100}%`,
                    background: i === 0 && m.cantidad > 0 ? '#E0323F' : 'rgb(255 255 255 / 0.55)',
                  }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function GraficosEsqueleto() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="p-card h-[352px] p-5 lg:col-span-2">
        <div className="p-esqueleto h-5 w-48" />
        <div className="p-esqueleto mt-3 h-3.5 w-32" />
        <div className="p-esqueleto mt-8 h-[220px] w-full" />
      </div>
      <div className="p-card h-[352px] p-5">
        <div className="p-esqueleto h-5 w-36" />
        <div className="mt-8 space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="p-esqueleto h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
