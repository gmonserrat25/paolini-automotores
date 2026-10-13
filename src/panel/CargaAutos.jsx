import { useEffect, useMemo, useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { pesos } from './calculos'
import { agruparFotos, cruzar, leerExcel, normPatente, reconocerFoto } from './carga'
import ConfirmarEliminar from './ConfirmarEliminar'
import { IconoCarga } from './icons'
import { AccionesFila, BarraSeleccion, Casilla, useSeleccion } from './seleccion'

/* Pantalla aparte para cargar autos: se suben las fotos y el Excel juntos, el
   panel reconoce cada auto (por la patente de la foto o, si no se lee, por
   marca, modelo y color), lo cruza con el Excel y lo carga solo al stock. Lo
   que la IA duda (una patente leída que no coincide del todo) o no pudo cruzar
   queda en la lista para revisarlo a mano; nada se adivina. */

const METODO = {
  patente: { texto: 'Por patente', revisar: false },
  'patente dudosa': { texto: 'La patente de la foto no coincide del todo con el Excel', revisar: true },
  'modelo y color': { texto: 'Sin patente legible: reconocido por modelo y color', revisar: false },
  'modelo y color dudoso': {
    texto: 'La patente de la foto no coincide con ningún auto del Excel: se sugiere por modelo y color',
    revisar: true,
  },
  manual: { texto: 'Asignado a mano', revisar: false },
}

const MAX_MINIATURAS = 6

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

function FilaCarga({ grupo, libres, leyendoGrupo, onElegir, onQuitar }) {
  const { fila: asignado, metodo, items } = grupo
  const m = metodo && METODO[metodo]
  const portada = items[0]
  const vistas = items.map((i) => i.visto?.patente).filter(Boolean)
  const id = portada.id
  return (
    <li className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 rounded-2xl px-3 py-3 hover:bg-white/[0.03] md:grid-cols-[72px_1.3fr_2fr_auto]">
      <div className="relative">
        <img src={portada.url} alt="" className="h-14 w-[72px] rounded-lg object-cover" />
        {items.length > 1 && (
          <span className="absolute -bottom-1.5 -right-1.5 rounded-full border border-white/[0.15] bg-[#0B0B0C] px-1.5 text-[11px] tabular-nums text-white/80">
            {items.length}
          </span>
        )}
      </div>

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
          <p className="text-sm text-white/60">{leyendoGrupo ? 'Leyendo la foto…' : 'Sin asignar'}</p>
        )}
        <p className="mt-0.5 text-xs text-white/60">
          {items.length > 1 ? `${items.length} fotos · ` : ''}
          {vistas.length ? `En la foto: ${vistas[0]}` : leyendoGrupo ? '' : 'Chapa no legible'}
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
        <label className="sr-only" htmlFor={`sel-${id}`}>
          Elegir el auto del Excel para {items.length > 1 ? 'estas fotos' : 'esta foto'}
        </label>
        <select
          id={`sel-${id}`}
          value={asignado?.patente ?? ''}
          onChange={(e) => onElegir(items, e.target.value)}
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
        {items.length === 1 && (
          <button
            type="button"
            onClick={() => onQuitar([id])}
            className="rounded-full px-2.5 py-1 text-xs text-white/60 transition-colors hover:text-white"
          >
            Quitar
          </button>
        )}
      </div>

      {items.length > 1 && (
        <ul className="col-span-2 flex flex-wrap gap-2 md:col-span-4 md:pl-[88px]" aria-label="Fotos de este auto">
          {items.slice(0, MAX_MINIATURAS).map((i) => (
            <li key={i.id} className="group relative">
              <img src={i.url} alt="" className="h-10 w-14 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => onQuitar([i.id])}
                aria-label="Quitar esta foto"
                className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-[#0B0B0C] text-[11px] leading-none text-white/80 ring-1 ring-white/20 hover:text-white group-hover:flex focus-visible:flex"
              >
                ×
              </button>
            </li>
          ))}
          {items.length > MAX_MINIATURAS && (
            <li className="flex h-10 items-center px-2 text-xs text-white/60">+{items.length - MAX_MINIATURAS}</li>
          )}
          <li className="flex h-10 items-center pl-1">
            <button
              type="button"
              onClick={() => onQuitar(items.map((i) => i.id))}
              className="rounded-full px-2.5 py-1 text-xs text-white/60 transition-colors hover:text-white"
            >
              Quitar todas
            </button>
          </li>
        </ul>
      )}
    </li>
  )
}

export default function CargaAutos({ stock, onAgregar, onVer, onEditar, onEliminar, onEstados }) {
  const entrada = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [filas, setFilas] = useState([])
  const [excelNombre, setExcelNombre] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [sinReconocimiento, setSinReconocimiento] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargadasSolas, setCargadasSolas] = useState(0)
  const [repetidas, setRepetidas] = useState(0)
  const sel = useSeleccion()
  const [porEliminar, setPorEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  /* Fotos que ya se mandaron a cargar solas: si una falla se queda en la lista
     y se reintenta con el botón, no en bucle. */
  const intentadas = useRef(new Set())
  /* Sube cada vez que se limpia la lista: las lecturas de fotos que quedaron
     a medias dejan de pedirse. */
  const generacion = useRef(0)

  const cargadas = useMemo(() => new Set(stock.filter((u) => u.patente).map((u) => normPatente(u.patente))), [stock])

  /* Cada foto con su auto del Excel: lo que se eligió a mano manda y el resto
     se cruza foto por foto. Las fotos de un mismo auto cruzan con la misma
     fila: después se juntan en un solo grupo. */
  const cruces = useMemo(() => {
    const out = {}
    for (const i of items) {
      if (i.manual) {
        out[i.id] = { fila: filas.find((f) => f.patente === i.manual) ?? null, metodo: 'manual' }
      } else if (filas.length && i.visto) {
        out[i.id] = cruzar(i.visto, filas, new Set())
      }
    }
    return out
  }, [items, filas])

  /* Un grupo por auto, con todas sus fotos (la portada primero). */
  const grupos = useMemo(() => agruparFotos(items, cruces), [items, cruces])

  const asignadas = new Set(grupos.flatMap((g) => (g.fila ? [g.fila.patente] : [])))
  const libres = filas.filter((f) => !asignadas.has(f.patente))
  const yaEstaCargado = (g) => g.fila && cargadas.has(normPatente(g.fila.patente))
  const listas = grupos.filter((g) => g.fila && !yaEstaCargado(g))
  /* Se carga solo el auto cuya patente coincide exacto con el Excel o, si la
     chapa no se lee, el que cruza sin dudas por modelo y color. Si la IA dudó
     (una letra distinta, una patente que no coincide con nada), queda en la
     lista para que alguien la revise: así se nota cuando algo no cuadra. */
  const segura = (g) => ['patente', 'modelo y color', 'manual'].includes(g.metodo)
  const dudosas = listas.filter((g) => !segura(g))
  const yaCargadas = useMemo(
    () =>
      grupos
        .filter((g) => g.fila && cargadas.has(normPatente(g.fila.patente)))
        .flatMap((g) => g.items.map((i) => i.id)),
    [grupos, cargadas],
  )
  const claveDe = (g) => `${g.fila.patente}:${g.items.map((i) => i.id).join(',')}`
  const pedido = (g) => ({ fila: g.fila, archivos: g.items.map((i) => i.archivo), metodo: g.metodo })

  const leyendo = items.some((i) => i.estado === 'leyendo')

  /* Las fotos de autos que ya están en el stock no tienen nada para revisar:
     se sacan de la lista y queda el aviso. */
  useEffect(() => {
    if (leyendo || !yaCargadas.length) return
    setRepetidas((n) => n + yaCargadas.length)
    setItems((a) => a.filter((i) => !yaCargadas.includes(i.id)))
  }, [leyendo, yaCargadas])

  /* Cuando ya se leyeron todas las fotos y hay Excel, lo que cruzó con
     seguridad se carga sin pedir nada. */
  useEffect(() => {
    if (leyendo || guardando || !filas.length) return
    const aCargar = listas.filter((g) => segura(g) && !intentadas.current.has(claveDe(g)))
    if (!aCargar.length) return
    aCargar.forEach((g) => intentadas.current.add(claveDe(g)))
    setGuardando(true)
    onAgregar(aCargar.map(pedido)).then((ok) => {
      setGuardando(false)
      if (!ok) return
      const idas = new Set(aCargar.flatMap((g) => g.items.map((i) => i.id)))
      setCargadasSolas((n) => n + aCargar.length)
      setItems((a) => a.filter((i) => !idas.has(i.id)))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leyendo, guardando, filas, listas, onAgregar])

  /* Vacía la pantalla (fotos, Excel y avisos) para arrancar otra tanda. No toca
     los autos que ya están en el stock. */
  function limpiar() {
    generacion.current += 1
    intentadas.current = new Set()
    items.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([])
    setFilas([])
    setExcelNombre(null)
    setError(null)
    setSinReconocimiento(false)
    setCargadasSolas(0)
    setRepetidas(0)
  }

  async function recibir(archivos) {
    const g = generacion.current
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
      if (generacion.current !== g) return
      let cambio
      try {
        cambio = { estado: 'listo', visto: await reconocerFoto(n.archivo) }
      } catch {
        setSinReconocimiento(true)
        cambio = { estado: 'sin-reconocer', visto: null }
      }
      if (generacion.current !== g) return
      setItems((actuales) => actuales.map((i) => (i.id === n.id ? { ...i, ...cambio } : i)))
    }
  }

  /* Elegir el auto del Excel vale para todas las fotos del grupo. */
  const elegir = (fotos, patente) => {
    const ids = new Set(fotos.map((i) => i.id))
    setItems((a) => a.map((i) => (ids.has(i.id) ? { ...i, manual: patente || null, visto: i.visto ?? {} } : i)))
  }
  const quitar = (ids) => setItems((a) => a.filter((i) => !ids.includes(i.id)))

  async function confirmar() {
    setGuardando(true)
    const ok = await onAgregar(listas.map(pedido))
    setGuardando(false)
    if (ok) {
      const idas = new Set(listas.flatMap((g) => g.items.map((i) => i.id)))
      setItems((a) => a.filter((i) => !idas.has(i.id)))
    }
  }

  const enStock = stock.filter((u) => u.patente)
  const elegidas = enStock.filter((u) => sel.ids.has(u.id))

  /* Los reservados salen de la lista principal y van aparte, bajo su título. */
  const reservadasCargadas = enStock.filter((u) => u.estado === 'reservado')
  const principalesCargadas = enStock.filter((u) => u.estado !== 'reservado')

  const filaCargada = (u) => (
    <li
      key={u.id}
      className={`relative grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-3 rounded-2xl py-3 pl-11 pr-3 hover:bg-white/[0.03] md:grid-cols-[72px_1.3fr_2fr_auto] ${
        sel.ids.has(u.id) ? 'bg-white/[0.05]' : ''
      }`}
    >
      <Casilla
        marcada={sel.ids.has(u.id)}
        onChange={() => sel.alternar(u.id)}
        etiqueta={`Elegir ${u.brand} ${u.model}`}
        className="absolute left-3 top-1/2 -translate-y-1/2"
      />
      <img src={u.image} alt="" loading="lazy" className="h-14 w-[72px] rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs text-white/60">
          <BrandLogo marca={u.brand} className="h-3.5 w-3.5" />
          {u.brand}
        </p>
        {u.ficha ? (
          <button
            type="button"
            onClick={() => onVer(u.id)}
            aria-label={`Ver la ficha de ${u.brand} ${u.model}`}
            className="block max-w-full truncate text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:underline"
          >
            {u.model}
          </button>
        ) : (
          <p className="truncate text-sm font-medium">{u.model}</p>
        )}
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-4">
        <Dato etiqueta="Patente">{u.patente}</Dato>
        <Dato etiqueta="Año · km">{u.tag.replace(' km', '')}</Dato>
        <Dato etiqueta="Color">{u.color}</Dato>
        <Dato etiqueta="Precio">{pesos(u.precioVenta)}</Dato>
      </div>
      {u.ficha && (
        <div className="col-span-2 md:col-span-1 md:justify-self-end">
          <AccionesFila unidad={u} onEditar={onEditar} onEliminar={(x) => setPorEliminar([x])} />
        </div>
      )}
    </li>
  )

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
              Subí las fotos y el Excel juntos, sin ordenar por carpeta: cada foto se reconoce sola por la patente y
              las de un mismo auto se juntan en una sola publicación. Si coincide exacto con el Excel, el auto entra
              al stock sin que hagas nada. Si la chapa no se lee, se busca por modelo y
              color. Si la IA tiene alguna duda (una letra de la patente distinta), la foto queda marcada para que la
              revises vos antes de cargarla.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(items.length > 0 || filas.length > 0) && (
              <Boton onClick={limpiar} disabled={guardando}>
                Limpiar lista
              </Boton>
            )}
            <Boton primario onClick={() => entrada.current?.click()}>
              <IconoCarga className="h-[18px] w-[18px]" />
              Cargar fotos y Excel
            </Boton>
          </div>
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
          {' · '}También podés arrastrar los archivos acá. Podés cargar varias tandas: los autos que ya están en el
          stock no se vuelven a agregar.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#FF6B76]">
            {error}
          </p>
        )}
        {cargadasSolas > 0 && (
          <p role="status" className="mt-3 text-sm text-white/80">
            {cargadasSolas} {cargadasSolas === 1 ? 'auto cargado' : 'autos cargados'} solos al stock, cada uno con todas sus fotos.
          </p>
        )}
        {repetidas > 0 && (
          <p role="status" className="mt-3 text-sm text-white/80">
            {repetidas} {repetidas === 1 ? 'foto es de un auto' : 'fotos son de autos'} que ya {repetidas === 1 ? 'estaba' : 'estaban'} en
            el stock: no se {repetidas === 1 ? 'agregó' : 'agregaron'} de nuevo.
          </p>
        )}
        {sinReconocimiento && (
          <p role="status" className="mt-3 rounded-xl border border-white/[0.1] px-4 py-3 text-sm text-white/80">
            No se pudo reconocer alguna foto automáticamente. Elegí a mano qué auto del Excel es cada una.
          </p>
        )}
      </section>

      {items.length > 0 && (
        <section aria-label="Fotos para cargar" className="p-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-jost text-lg font-medium">
              {leyendo ? 'Reconociendo fotos…' : 'Para revisar'}{' '}
              <span className="text-white/60">· {items.length}</span>
            </h3>
            <Boton primario disabled={!listas.length || guardando} onClick={confirmar}>
              {guardando ? 'Cargando…' : `Agregar ${listas.length} al stock`}
            </Boton>
          </div>
          {!leyendo && dudosas.length > 0 && (
            <p role="status" className="mt-3 rounded-xl border border-[#E0323F]/40 px-4 py-3 text-sm text-white/80">
              {dudosas.length === 1 ? 'Hay 1 auto' : `Hay ${dudosas.length} autos`} que la IA no pudo confirmar.
              Revisá que la foto y el auto del Excel sean los correctos: si lo son, tocá «Agregar»; si no, elegí
              otro auto del Excel o quitá la foto.
            </p>
          )}
          <ul className="mt-3">
            {grupos.map((g) => (
              <FilaCarga
                key={g.clave}
                grupo={g}
                leyendoGrupo={g.items.some((i) => i.estado === 'leyendo')}
                libres={libres}
                onElegir={elegir}
                onQuitar={quitar}
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Autos cargados" className="p-card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="font-jost text-lg font-medium">
            Autos cargados <span className="text-white/60">· {enStock.length}</span>
          </h3>
          {enStock.length > 0 && (
            <button
              type="button"
              onClick={() => sel.poner(enStock.map((u) => u.id))}
              className="text-[13px] text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Elegir todos
            </button>
          )}
        </div>
        <BarraSeleccion
          cantidad={elegidas.length}
          onEliminar={() => setPorEliminar(elegidas)}
          onEstado={async (nuevo) => {
            if (await onEstados(elegidas.map((u) => u.id), nuevo)) sel.limpiar()
          }}
          onQuitar={sel.limpiar}
        />
        <ul className="mt-3">{principalesCargadas.map(filaCargada)}</ul>
        {reservadasCargadas.length > 0 && (
          <div className="mt-6">
            <h4 className="flex items-baseline gap-2 border-b border-white/[0.08] px-3 pb-2.5 font-jost text-base font-medium">
              Reservados <span className="text-sm text-white/60">· {reservadasCargadas.length}</span>
            </h4>
            <ul className="mt-3">{reservadasCargadas.map(filaCargada)}</ul>
          </div>
        )}
      </section>

      {porEliminar && (
        <ConfirmarEliminar
          unidades={porEliminar}
          eliminando={eliminando}
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={async () => {
            setEliminando(true)
            const ok = await onEliminar(porEliminar)
            setEliminando(false)
            if (ok) {
              setPorEliminar(null)
              sel.limpiar()
            }
          }}
        />
      )}
    </div>
  )
}
