import { useEffect, useState } from 'react'
import { listarVisitas } from './datos'
import LineChart from './LineChart'
import Numero from './Numero'

/* Cuánta gente entra al sitio. Una persona cuenta una vez por día aunque abra
   varias páginas; no cuentan los bots ni quien tiene abierto el panel (ver
   api/visitas.js). Se carga aparte del resto del panel: si falla, el panel
   sigue igual. */

const diaCorto = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const diaLargo = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const diaMes = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const fecha = (iso) => new Date(`${iso}T12:00:00Z`)
const sinPunto = (t) => t.replace('.', '')
const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const suma = (dias) => dias.reduce((s, d) => s + d.personas, 0)

function Cifra({ etiqueta, valor, nota }) {
  return (
    <div>
      <p className="text-[13px] text-white/60">{etiqueta}</p>
      <Numero valor={valor} className="mt-1 block font-saira text-[34px] font-semibold leading-none" />
      {nota && <p className="mt-1.5 text-xs text-white/60">{nota}</p>}
    </div>
  )
}

export default function Visitas() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true
    listarVisitas()
      .then((d) => vigente && setDatos(d))
      .catch(() => vigente && setError(true))
    return () => {
      vigente = false
    }
  }, [])

  if (error) return null

  if (!datos) {
    return (
      <section className="p-card p-5">
        <div className="p-esqueleto h-4 w-40" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-esqueleto h-10 w-16" />
          ))}
        </div>
        <div className="p-esqueleto mt-6 h-[250px] w-full" />
      </section>
    )
  }

  const { serie, desde } = datos
  const semana = suma(serie.slice(-7))
  const anterior = suma(serie.slice(-14, -7))
  const variacion = anterior ? Math.round(((semana - anterior) / anterior) * 100) : null
  const puntos = serie.map((d) => ({
    etiqueta: sinPunto(diaCorto.format(fecha(d.dia))),
    titulo: `${mayuscula(diaLargo.format(fecha(d.dia)))} · ${d.vistas} página${d.vistas === 1 ? '' : 's'} vista${d.vistas === 1 ? '' : 's'}`,
    valor: d.personas,
  }))

  return (
    <section id="visitas" aria-label="Visitas a la página" className="p-card p-entra scroll-mt-24 p-5" style={{ '--i': 4 }}>
      <header>
        <h2 className="font-jost text-lg font-medium">Visitas a la página</h2>
        <p className="mt-0.5 text-[13px] text-white/60">Personas por día que entraron a paoliniautomotores.com</p>
      </header>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Cifra etiqueta="Hoy" valor={serie.at(-1).personas} />
        <Cifra
          etiqueta="Últimos 7 días"
          valor={semana}
          nota={variacion === null ? null : `${variacion >= 0 ? '+' : ''}${variacion}% vs. la semana anterior`}
        />
        <Cifra etiqueta="Últimos 30 días" valor={suma(serie)} />
      </div>

      <div className="mt-6">
        <LineChart puntos={puntos} nombre="Visitas por día" />
      </div>

      {desde && (
        <p className="mt-3 text-xs text-white/60">
          Se cuenta desde el {diaMes.format(fecha(desde))}. No suman los buscadores ni las visitas desde el panel.
        </p>
      )}
    </section>
  )
}
