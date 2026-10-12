import { useMemo, useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { pesos } from './calculos'
import { cruzar, leerExcel, normPatente, reconocerFoto } from './carga'
import { IconoCarga } from './icons'

/* Pantalla aparte para cargar autos: se suben las fotos y el Excel juntos, el
   panel reconoce cada auto (por la patente de la foto o, si no se ve, por
   marca, modelo y color), lo cruza con el Excel y recién al confirmar entra al
   stock. Lo dudoso queda marcado para revisar; nada se adivina. */

const METODO = {
  patente: { texto: 'Por patente', revisar: false },
  'patente dudosa': { texto: 'Patente con una letra distinta', revisar: true },
  'modelo y color': { texto: 'Por modelo y color', revisar: true },
  manual: { texto: 'Asignado a mano', revisar: false },
}

const esExcel = (a) => /\.xlsx$/i.test(a.name)
const esFoto = (a) => a.type.startsWith('image/')

function Boton({ children, onClick, primario, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primario
          ? 'bg-[#E0323F] text-white hover:bg-[#EA4350]'
          : 'border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.05]'
      }`}
    >
      {children}
    </button>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-white/60">{etiqueta}</p>
      <p className="truncate text-sm tabular-nums">{children}</p>
    </div>
  )
}

function FilaCarga({ item, asignado, metodo, libres, onElegir, onQuitar }) {
  const m = metodo && METODO[metodo]
  const leyendo = item.estado === 'leyendo'
  return (
    <li className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 rounded-2xl px-3 py-3 hover:bg-white/[0.03] md:grid-cols-[72px_1.3fr_2fr_auto]">
      <img src={item.url} alt="" className="h-14 w-[72px] rounded-lg object-cover" />

      <div className="min-w-0">
        {asignado ? (
          <>
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <BrandLogo marca={asignado.marca[0] + asignado.marca.slice(1).toLowerCase()} className="h-3.5 w-3.5" />
              {asignado.marca}
            </p>
            <p className="truncate text-sm font-medium">{asignado.modelo}</p>
          </>
        ) : (
          <p className="text-sm text-white/60">{leyendo ? 'Leyendo la foto…' : 'Sin asignar'}</p>
        )}
        <p className="mt-0.5 text-xs text-white/60">
          {item.visto?.patente ? `En la foto: ${item.visto.patente}` : leyendo ? '' : 'Chapa no legible'}
        </p>
      </div>

      {asignado ? (
        <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-4">
          <Dato etiqueta="Patente">{asignado.patente}</Dato>
          <Dato etiqueta="Año · km">
            {asignado.anio} · {asignado.km?.toLocaleString('es-AR')}
          </Dato>
          <Dato etiqueta="Color">{asignado.color}</Dato>
          <Dato etiqueta="Precio">{pesos(asignado.precio)}</Dato>
        </div>
      ) : (
        <div className="col-span-2 md:col-span-1" />
      )}

      <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:justify-end">
        {m && (
          <span
            className={`rounded-full border px-2.5 py-1 text-xs ${
              m.revisar ? 'border-[#E0323F]/60 text-[#FF6B76]' : 'border-white/[0.1] text-white/80'
            }`}
          >
            {m.revisar ? 'Revisar · ' : ''}
            {m.texto}
          </span>
        )}
        <label className="sr-only" htmlFor={`sel-${item.id}`}>
          Elegir el auto del Excel para esta foto
        </label>
        <select
          id={`sel-${item.id}`}
          value={asignado?.patente ?? ''}
          onChange={(e) => onElegir(item.id, e.target.value)}
          className="max-w-[180px] rounded-full border border-white/[0.1] bg-[#0B0B0C] px-3 py-1.5 text-xs text-white/80 focus:border-white/30 focus:outline-none"
        >
          <option value="">{asignado ? 'Quitar asignación' : 'Elegir del Excel…'}</option>
          {asignado && <option value={asignado.patente}>{asignado.patente}</option>}
          {libres.map((f) => (
            <option key={f.patente} value={f.patente}>
              {f.patente} · {f.modelo}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onQuitar(item.id)}
          className="rounded-full px-2.5 py-1 text-xs text-white/60 transition-colors hover:text-white"
        >
          Quitar
        </button>
      </div>
    </li>
  )
}

export default function CargaAutos({ stock, onAgregar }) {
  const entrada = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [filas, setFilas] = useState([])
  const [excelNombre, setExcelNombre] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [sinReconocimiento, setSinReconocimiento] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cargadas = useMemo(() => new Set(stock.filter((u) => u.patente).map((u) => normPatente(u.patente))), [stock])

  /* Cada foto con su auto del Excel. Primero se respeta lo que se eligió a
     mano; después se cruza el resto, sin repetir patentes. */
  const cruces = useMemo(() => {
    const usadas = new Set(items.filter((i) => i.manual).map((i) => i.manual))
    const out = {}
    for (const i of items) {
      if (i.manual) {
        out[i.id] = { fila: filas.find((f) => f.patente === i.manual) ?? null, metodo: 'manual' }
      }
    }
    for (const i of items) {
      if (i.manual || !filas.length || !i.visto) continue
      const c = cruzar(i.visto, filas, usadas)
      if (c.fila) usadas.add(c.fila.patente)
      out[i.id] = c
    }
    return out
  }, [items, filas])

  const asignadas = new Set(Object.values(cruces).flatMap((c) => (c.fila ? [c.fila.patente] : [])))
  const libres = filas.filter((f) => !asignadas.has(f.patente))
  const listas = items.filter((i) => cruces[i.id]?.fila && !cargadas.has(normPatente(cruces[i.id].fila.patente)))
  const yaCargadas = items.filter((i) => cruces[i.id]?.fila && cargadas.has(normPatente(cruces[i.id].fila.patente)))

  async function recibir(archivos) {
    setError(null)
    const lista = [...archivos]
    const excel = lista.find(esExcel)
    if (excel) {
      try {
        const leidas = leerExcel(await excel.arrayBuffer())
        if (!leidas.length) throw new Error('vacío')
        setFilas(leidas)
        setExcelNombre(excel.name)
      } catch {
        setError('No pude leer ese Excel. Tiene que ser .xlsx con las columnas marca, modelo, precio, año, patente, km y color.')
      }
    }
    const nuevas = lista.filter(esFoto).map((archivo, n) => ({
      id: `${Date.now()}-${n}`,
      url: URL.createObjectURL(archivo),
      archivo,
      estado: 'leyendo',
      visto: null,
      manual: null,
    }))
    if (lista.some((a) => !esExcel(a) && !esFoto(a))) setError('Sólo se aceptan fotos y un Excel (.xlsx).')
    if (!nuevas.length) return
    setItems((actuales) => [...actuales, ...nuevas])
    for (const n of nuevas) {
      let cambio
      try {
        cambio = { estado: 'listo', visto: await reconocerFoto(n.archivo) }
      } catch {
        setSinReconocimiento(true)
        cambio = { estado: 'sin-reconocer', visto: null }
      }
      setItems((actuales) => actuales.map((i) => (i.id === n.id ? { ...i, ...cambio } : i)))
    }
  }

  const elegir = (id, patente) =>
    setItems((a) => a.map((i) => (i.id === id ? { ...i, manual: patente || null, visto: i.visto ?? {} } : i)))
  const quitar = (id) => setItems((a) => a.filter((i) => i.id !== id))

  async function confirmar() {
    setGuardando(true)
    const ok = await onAgregar(
      listas.map((i) => ({ fila: cruces[i.id].fila, archivo: i.archivo, metodo: cruces[i.id].metodo })),
    )
    setGuardando(false)
    if (ok) setItems((a) => a.filter((i) => !listas.includes(i)))
  }

  const enStock = stock.filter((u) => u.patente)

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="carga-titulo"
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          recibir(e.dataTransfer.files)
        }}
        className={`p-card p-5 transition-colors ${arrastrando ? 'border-white/40' : ''}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 id="carga-titulo" className="font-jost text-xl font-medium">
              Carga de autos
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Subí las fotos y el Excel juntos. Cada foto se reconoce sola por la patente; si la chapa no se ve, se
              busca por marca, modelo y color. Lo dudoso queda marcado para que lo revises antes de confirmar.
            </p>
          </div>
          <Boton primario onClick={() => entrada.current?.click()}>
            <IconoCarga className="h-[18px] w-[18px]" />
            Cargar fotos y Excel
          </Boton>
          <input
            ref={entrada}
            type="file"
            multiple
            accept="image/*,.xlsx"
            className="sr-only"
            aria-label="Elegir fotos y Excel"
            onChange={(e) => {
              recibir(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <p className="mt-4 text-xs text-white/60">
          {excelNombre ? `Excel: ${excelNombre} · ${filas.length} autos leídos` : 'Todavía no cargaste el Excel.'}
          {' · '}También podés arrastrar los archivos acá.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#FF6B76]">
            {error}
          </p>
        )}
        {sinReconocimiento && (
          <p role="status" className="mt-3 rounded-xl border border-white/[0.1] px-4 py-3 text-sm text-white/80">
            El reconocimiento automático todavía no está activo en este panel (falta conectar la clave del servicio de
            visión). Las fotos se cargaron igual: elegí a mano qué auto del Excel es cada una.
          </p>
        )}
      </section>

      {items.length > 0 && (
        <section aria-label="Fotos para cargar" className="p-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-jost text-lg font-medium">
              Para revisar <span className="text-white/60">· {items.length}</span>
            </h3>
            <Boton primario disabled={!listas.length || guardando} onClick={confirmar}>
              {guardando ? 'Cargando…' : `Agregar ${listas.length} al stock`}
            </Boton>
          </div>
          <ul className="mt-3">
            {items.map((i) => (
              <FilaCarga
                key={i.id}
                item={i}
                asignado={cruces[i.id]?.fila}
                metodo={cruces[i.id]?.metodo}
                libres={libres}
                onElegir={elegir}
                onQuitar={quitar}
              />
            ))}
          </ul>
          {yaCargadas.length > 0 && (
            <p className="mt-3 text-xs text-white/60">
              {yaCargadas.length} de estas fotos ya están en el stock y no se vuelven a agregar.
            </p>
          )}
        </section>
      )}

      <section aria-label="Autos cargados" className="p-card p-5">
        <h3 className="font-jost text-lg font-medium">
          Autos cargados <span className="text-white/60">· {enStock.length}</span>
        </h3>
        <ul className="mt-3">
          {enStock.map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 rounded-2xl px-3 py-3 hover:bg-white/[0.03] md:grid-cols-[72px_1.3fr_2fr]"
            >
              <img src={u.image} alt="" loading="lazy" className="h-14 w-[72px] rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs text-white/60">
                  <BrandLogo marca={u.brand} className="h-3.5 w-3.5" />
                  {u.brand}
                </p>
                <p className="truncate text-sm font-medium">{u.model}</p>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-4">
                <Dato etiqueta="Patente">{u.patente}</Dato>
                <Dato etiqueta="Año · km">{u.tag.replace(' km', '')}</Dato>
                <Dato etiqueta="Color">{u.color}</Dato>
                <Dato etiqueta="Precio">{pesos(u.precioVenta)}</Dato>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
