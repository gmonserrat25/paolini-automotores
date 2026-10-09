import { useEffect, useState } from 'react'
import './panel.css'
import { ConsultasPorSemana, GraficosEsqueleto, StockPorMarca } from './Graficos'
import { IconoAlerta } from './icons'
import Metricas, { MetricasEsqueleto } from './Metricas'
import Navegacion, { Topbar } from './Navegacion'
import TablaStock, { TablaEsqueleto } from './TablaStock'
import UltimasConsultas, { ConsultasEsqueleto } from './UltimasConsultas'
import { usePanel } from './hooks'

const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

/* El panel es interno: que no lo indexe ningún buscador, y que la pestaña lo
   diga. Al salir se restaura el título del sitio. */
function useFichaInterna() {
  useEffect(() => {
    const titulo = document.title
    document.title = 'Panel · Automotores Paolini'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.title = titulo
      meta.remove()
    }
  }, [])
}

function Encabezado() {
  const hoy = fechaLarga.format(new Date())
  return (
    <div id="resumen" className="scroll-mt-24 pt-1">
      <h1 className="font-jost text-[28px] font-medium leading-tight md:text-[34px]">Buen día, Paolini</h1>
      <p className="mt-1 text-sm text-white/60 first-letter:uppercase">{hoy}</p>
    </div>
  )
}

function ErrorPanel({ onReintentar }) {
  return (
    <div className="p-card mt-6 flex flex-col items-center px-6 py-16 text-center">
      <IconoAlerta className="h-7 w-7 text-[#E0323F]" />
      <p className="mt-4 text-base">No pudimos cargar el panel</p>
      <p className="mt-1 text-sm text-white/60">Revisá la conexión y probá de nuevo.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 rounded-full border border-white/[0.12] px-5 py-2 text-sm transition-colors hover:border-white/30 hover:bg-white/[0.05]"
      >
        Reintentar
      </button>
    </div>
  )
}

export default function Panel() {
  useFichaInterna()
  const { estado, datos, aviso, recargar, cambiarEstado } = usePanel()
  const [busqueda, setBusqueda] = useState('')
  const [marca, setMarca] = useState(null)

  const listo = estado === 'listo'

  return (
    <div className="panel min-h-screen bg-[#010101] text-white">
      <Navegacion />
      <div className="pb-24 md:pb-8 md:pl-[72px]">
        <Topbar busqueda={busqueda} onBusqueda={setBusqueda} />

        <main className="grid gap-5 px-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <Encabezado />

            {estado === 'error' && <ErrorPanel onReintentar={recargar} />}

            {estado === 'cargando' && (
              <>
                <MetricasEsqueleto />
                <GraficosEsqueleto />
                <TablaEsqueleto />
              </>
            )}

            {listo && (
              <>
                <Metricas stock={datos.stock} historial={datos.historial} semanal={datos.series.mensual} />
                <div className="grid gap-4 lg:grid-cols-3">
                  <ConsultasPorSemana series={datos.series} />
                  <StockPorMarca stock={datos.stock} marca={marca} onMarca={setMarca} />
                </div>
                <TablaStock
                  stock={datos.stock}
                  busqueda={busqueda}
                  marca={marca}
                  onMarca={setMarca}
                  onCambiar={cambiarEstado}
                  onLimpiarBusqueda={() => setBusqueda('')}
                />
              </>
            )}
          </div>

          {estado !== 'error' && (
            <aside className="xl:sticky xl:top-[76px] xl:self-start">
              {listo ? <UltimasConsultas consultas={datos.consultas} /> : <ConsultasEsqueleto />}
            </aside>
          )}
        </main>
      </div>

      {aviso && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/[0.1] bg-[#151516] px-5 py-2.5 text-sm md:bottom-8"
        >
          {aviso}
        </p>
      )}
    </div>
  )
}
