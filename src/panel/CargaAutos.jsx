import { useEffect, useMemo, useRef, useState } from 'react'
import BrandLogo from '../components/BrandLogos'
import { pesos } from './calculos'
import {
  ES_DE_ADENTRO,
  agruparFotosDeAdentro,
  cruzarTodos,
  esCodigo0km,
  explicarSinCruce,
  esLista,
  fechaDeFoto,
  filaDeStock,
  leerLista,
  mostrarPatente,
  normPatente,
  reconocerFoto,
} from './carga'
import { agregarFoto, registrarCarga } from './datos'
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
  'patente aproximada': { texto: 'Una letra de la patente se leyó distinta: reconocido por puntaje', revisar: false },
  'modelo y color': { texto: 'Sin patente legible: reconocido por modelo y color', revisar: false },
  'modelo y color dudoso': {
    texto: 'La patente de la foto no coincide con ningún auto del Excel: se sugiere por modelo y color',
    revisar: true,
  },
  manual: { texto: 'Asignado a mano', revisar: false },
}

/* Lo que la IA vio en la foto, para entender por qué quedó (o no) asignada. */
function enLaFoto(visto) {
  const partes = [
    visto?.patente ? visto.patente : 'chapa no legible',
    [visto?.marca, visto?.modelo].filter(Boolean).join(' '),
    visto?.color,
  ]
  return partes.filter(Boolean).join(' · ')
}

const esFoto = (a) => a.type.startsWith('image/')
const deAdentro = (i) => ES_DE_ADENTRO.includes(i.visto?.tipo)
const TIPO_FOTO = { interior: 'Interior', detalle: 'Detalle', trasera: 'Trasera', exterior: 'Otra de afuera' }
const nombreAuto = (f) => (esCodigo0km(f.patente) ? `0 km · ${f.modelo} ${f.color ?? ''}`.trim() : `${f.patente} · ${f.modelo}`)

/* Una foto de adentro (o una segunda de afuera): no crea un auto, se suma a
   las fotos del auto de la foto anterior. */
function FilaExtra({ item, ancla, opciones, onElegir, onQuitar }) {
  return (
    <li className="grid grid-cols-[72px_1fr] items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-3 hover:bg-white/[0.03] md:grid-cols-[72px_1fr_auto]">
      <img src={item.url} alt="" className="h-14 w-[72px] rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="text-xs text-white/60">{TIPO_FOTO[item.visto?.tipo] ?? 'Foto extra'}</p>
        <p className="truncate text-sm">
          {ancla ? (
            <>
              Va con <span className="font-medium">{ancla.marca} {ancla.modelo}</span>
              <span className="text-white/60"> · {mostrarPatente(ancla.patente)}</span>
            </>
          ) : (
            <span className="text-white/60">No sé de qué auto es: elegilo</span>
          )}
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:justify-end">
        <label className="sr-only" htmlFor={`extra-${item.id}`}>
          De qué auto es esta foto
        </label>
        <select
          id={`extra-${item.id}`}
          value={ancla?.patente ?? ''}
          onChange={(e) => onElegir(item.id, e.target.value)}
          className="max-w-[200px] rounded-full border border-white/[0.1] bg-[#0B0B0C] px-3 py-1.5 text-xs text-white/80 focus:border-white/30 focus:outline-none"
        >
          <option value="">Elegir auto…</option>
          {opciones.map((f) => (
            <option key={f.patente} value={f.patente}>
              {nombreAuto(f)}
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

const MOTIVOS = {
  formato: 'Ese formato no lo puedo abrir. Mandá la lista como Excel (.xlsx), PDF o CSV: desde Google Sheets o Numbers, «Compartir» → «Descargar» o «Exportar».',
  'pdf-grande': 'Ese PDF es muy pesado (más de 3 MB). Probá exportarlo de nuevo sólo con la hoja del stock.',
  vacio: 'La lista está vacía.',
}

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
          {leyendo ? '' : `En la foto: ${enLaFoto(item.visto)}`}
        </p>
      </div>

      {asignado ? (
        <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-4">
          <Dato etiqueta="Patente">{mostrarPatente(asignado.patente)}</Dato>
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
          {asignado && <option value={asignado.patente}>{mostrarPatente(asignado.patente)}</option>}
          {libres.map((f) => (
            <option key={f.patente} value={f.patente}>
              {esCodigo0km(f.patente) ? `0 km · ${f.modelo} ${f.color ?? ''}`.trim() : `${f.patente} · ${f.modelo}`}
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

export default function CargaAutos({ stock, onAgregar, onVer, onEditar, onEliminar, onEstados, onFotos }) {
  const entrada = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [filas, setFilas] = useState([])
  const [excelNombre, setExcelNombre] = useState(null)
  const [sinPatente, setSinPatente] = useState([])
  const [leyendoLista, setLeyendoLista] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [sinReconocimiento, setSinReconocimiento] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargadasSolas, setCargadasSolas] = useState(0)
  const [repetidas, setRepetidas] = useState(0)
  const [extrasSubidas, setExtrasSubidas] = useState(0)
  const [subiendoExtras, setSubiendoExtras] = useState(false)
  const sel = useSeleccion()
  const [porEliminar, setPorEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  /* Fotos que ya se mandaron a cargar solas: si una falla se queda en la lista
     y se reintenta con el botón, no en bucle. */
  const intentadas = useRef(new Set())
  /* Sube cada vez que se limpia la lista: las lecturas de fotos que quedaron
     a medias dejan de pedirse. */
  const generacion = useRef(0)
  /* Fotos que ya quedaron anotadas en el registro de la carga (una vez cada una). */
  const registradas = useRef(new Set())

  const cargadas = useMemo(() => new Set(stock.filter((u) => u.patente).map((u) => normPatente(u.patente))), [stock])

  /* Contra qué se cruza cada foto: las filas del Excel más los autos que ya
     están cargados y no vienen en este Excel. Así la foto de un auto ya
     cargado se queda con ése y no le roba la fila a otro parecido (dos
     Corolla, por ejemplo). */
  const pool = useMemo(() => {
    const delExcel = new Set(filas.map((f) => normPatente(f.patente)))
    const deStock = stock.filter((u) => u.patente && !delExcel.has(normPatente(u.patente))).map(filaDeStock)
    return [...filas, ...deStock]
  }, [filas, stock])

  /* Cada foto de afuera con su auto del Excel, y cada foto de adentro con el
     auto de la foto de afuera anterior. Primero se respeta lo que se eligió a
     mano; después, por pasadas:
       1. las fotos de afuera con la chapa a la vista (patente);
       2. las de adentro (y las segundas de afuera del mismo auto) van con la
          foto de afuera anterior;
       3. las de afuera sin chapa que quedan (los 0 km) por modelo y color;
       4. las de adentro de esos autos.
     Así una segunda foto de frente de un Corolla no le roba la fila a otro
     Corolla del Excel. */
  const { cruces, extras } = useMemo(() => {
    const usadas = new Set(items.filter((i) => i.manual).map((i) => i.manual))
    const out = {}
    for (const i of items) {
      if (i.manual) {
        out[i.id] = { fila: filas.find((f) => f.patente === i.manual) ?? null, metodo: 'manual' }
      }
    }
    if (!filas.length) return { cruces: out, extras: {} }
    const libresDeAncla = items.filter((i) => !i.manual && !i.ancla && i.visto)
    const deAfuera = libresDeAncla.filter((i) => !deAdentro(i))
    const tomar = (lista) => {
      const tomadas = new Set([...usadas, ...Object.values(out).flatMap((c) => (c.fila ? [c.fila.patente] : []))])
      Object.assign(out, cruzarTodos(lista.map((i) => ({ id: i.id, visto: i.visto })), pool, tomadas))
    }
    const anclas = () => Object.fromEntries(Object.entries(out).flatMap(([id, c]) => (c.fila ? [[id, c.fila]] : [])))
    const fotos = items.filter((i) => i.visto).map((i) => ({ id: i.id, fecha: i.fecha, nombre: i.archivo.name, visto: i.visto }))

    tomar(deAfuera.filter((i) => normPatente(i.visto.patente)))
    let ex = agruparFotosDeAdentro(fotos, anclas())
    tomar(deAfuera.filter((i) => !out[i.id] && !ex[i.id]))
    ex = agruparFotosDeAdentro(fotos, anclas())
    for (const id of Object.keys(ex)) delete out[id]
    return { cruces: out, extras: ex }
  }, [items, filas, pool])

  const asignadas = new Set(Object.values(cruces).flatMap((c) => (c.fila ? [c.fila.patente] : [])))
  const libres = filas.filter((f) => !asignadas.has(f.patente))
  const listas = useMemo(
    () => items.filter((i) => cruces[i.id]?.fila && !cargadas.has(normPatente(cruces[i.id].fila.patente))),
    [items, cruces, cargadas],
  )
  /* Se carga sola la foto cuya patente coincide exacto con el Excel o, si la
     chapa no se lee, la que cruza sin dudas por modelo y color. Si la IA dudó
     (una letra distinta, una patente que no coincide con nada), queda en la
     lista para que alguien la revise: así se nota cuando algo no cuadra. */
  const segura = (i) => ['patente', 'patente aproximada', 'modelo y color'].includes(cruces[i.id]?.metodo)
  const dudosas = items.filter((i) => cruces[i.id]?.fila && !segura(i) && cruces[i.id].metodo !== 'manual')
  const yaCargadas = items.filter((i) => cruces[i.id]?.fila && cargadas.has(normPatente(cruces[i.id].fila.patente)))

  const leyendo = items.some((i) => i.estado === 'leyendo')

  /* Cuando ya se leyeron todas, cada foto de adentro queda atada a su auto
     (por patente): así no se pierde cuando la foto de afuera se carga y sale
     de la lista. */
  useEffect(() => {
    if (leyendo) return
    const nuevas = Object.entries(extras).filter(([id]) => !items.find((i) => i.id === id)?.ancla)
    if (!nuevas.length) return
    const porId = Object.fromEntries(nuevas.map(([id, f]) => [id, f.patente]))
    setItems((a) => a.map((i) => (porId[i.id] ? { ...i, ancla: porId[i.id] } : i)))
  }, [leyendo, extras, items])

  /* Las fotos de adentro cuyo auto ya está en el stock se suben a sus fotos
     (con el tipo que leyó la IA al reconocerla) y salen de la lista. */
  useEffect(() => {
    if (leyendo || subiendoExtras) return
    const porPatente = new Map(stock.filter((u) => u.patente).map((u) => [normPatente(u.patente), u]))
    const listas = items.filter((i) => i.ancla && porPatente.has(normPatente(i.ancla)) && !intentadas.current.has(i.id))
    if (!listas.length) return
    listas.forEach((i) => intentadas.current.add(i.id))
    setSubiendoExtras(true)
    ;(async () => {
      const hechas = []
      for (const i of listas) {
        const u = porPatente.get(normPatente(i.ancla))
        try {
          const fotos = await agregarFoto(u.id, i.archivo, i.visto?.tipo === 'exterior' ? 'exterior' : i.visto?.tipo)
          onFotos?.(u.id, fotos)
          hechas.push(i.id)
        } catch (e) {
          setError(`${u.brand} ${u.model}: ${e.message}`)
        }
      }
      setExtrasSubidas((n) => n + hechas.length)
      setItems((a) => a.filter((i) => !hechas.includes(i.id)))
      setSubiendoExtras(false)
    })()
  }, [leyendo, subiendoExtras, items, stock, onFotos])

  /* Las fotos de autos que ya están en el stock no tienen nada para revisar:
     se sacan de la lista y queda el aviso. */
  useEffect(() => {
    if (leyendo || !yaCargadas.length) return
    setRepetidas((n) => n + yaCargadas.length)
    setItems((a) => a.filter((i) => !yaCargadas.includes(i)))
  }, [leyendo, yaCargadas])

  /* Cada foto que no pudo reconocerse (o que quedó dudosa) se anota en el
     registro, con lo que vio la IA, el motivo y los candidatos más cercanos.
     Se anota cuando ya se leyeron todas y hay Excel, o si la lectura falló;
     una sola vez por foto. Las fotos de autos ya cargados no cuentan: eso no
     es un fallo. */
  useEffect(() => {
    if (leyendo) return
    const renglones = []
    for (const i of items) {
      if (registradas.current.has(i.id)) continue
      if (i.ancla || extras[i.id] || deAdentro(i)) continue
      const c = cruces[i.id]
      if (c?.fila && cargadas.has(normPatente(c.fila.patente))) continue
      let r
      if (i.estado === 'sin-reconocer') {
        r = { resultado: 'sin reconocer', ...explicarSinCruce(null, []), visto: null }
      } else if (!filas.length || i.manual) {
        continue
      } else if (!c?.fila) {
        r = { resultado: 'sin reconocer', ...explicarSinCruce(i.visto, libres), visto: i.visto }
      } else if (!segura(i) && c.metodo !== 'manual') {
        r = { resultado: 'dudosa', motivo: METODO[c.metodo].texto, visto: i.visto, asignado: c.fila.patente }
      } else {
        continue
      }
      registradas.current.add(i.id)
      renglones.push({ archivo: i.archivo.name, excel: excelNombre, ...r })
    }
    registrarCarga(renglones)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leyendo, items, cruces, extras, filas, cargadas])

  /* Cuando ya se leyeron todas las fotos y hay Excel, lo que cruzó con
     seguridad se carga sin pedir nada. */
  useEffect(() => {
    if (leyendo || guardando || !filas.length) return
    const aCargar = listas.filter((i) => segura(i) && !intentadas.current.has(i.id))
    if (!aCargar.length) return
    aCargar.forEach((i) => intentadas.current.add(i.id))
    setGuardando(true)
    onAgregar(aCargar.map((i) => ({ fila: cruces[i.id].fila, archivo: i.archivo, metodo: cruces[i.id].metodo }))).then(
      (ok) => {
        setGuardando(false)
        if (!ok) return
        setCargadasSolas((n) => n + aCargar.length)
        setItems((a) => a.filter((i) => !aCargar.includes(i)))
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leyendo, guardando, filas, listas, cruces, onAgregar])

  /* Vacía la pantalla (fotos, Excel y avisos) para arrancar otra tanda. No toca
     los autos que ya están en el stock. */
  function limpiar() {
    generacion.current += 1
    intentadas.current = new Set()
    registradas.current = new Set()
    items.forEach((i) => URL.revokeObjectURL(i.url))
    setItems([])
    setFilas([])
    setExcelNombre(null)
    setSinPatente([])
    setLeyendoLista(null)
    setError(null)
    setSinReconocimiento(false)
    setCargadasSolas(0)
    setRepetidas(0)
    setExtrasSubidas(0)
  }

  async function recibir(archivos) {
    const g = generacion.current
    setError(null)
    const lista = [...archivos]
    /* La lista se lee aparte, sin frenar las fotos: un PDF lo lee la IA y
       tarda unos segundos. Cuando llega, el cruce se rehace solo. */
    const excel = lista.find((a) => esLista(a) && !esFoto(a))
    if (excel) {
      setLeyendoLista(excel.name)
      leerLista(excel)
        .then(({ filas: leidas, sinPatente: afuera }) => {
          if (generacion.current !== g) return
          if (!leidas.length) {
            setError(
              afuera.length
                ? `Leí la lista pero ningún auto tiene patente (${afuera.length} sin patente). Si son 0 km, poné «0KM» en la columna de la patente.`
                : 'No encontré autos en esa lista. Fijate que tenga marca, modelo y patente (o dominio).',
            )
            return
          }
          setFilas(leidas)
          setSinPatente(afuera)
          setExcelNombre(excel.name)
        })
        .catch((e) => {
          if (generacion.current !== g) return
          setError(
            MOTIVOS[e.motivo] ??
              (e.status === 401
                ? 'Se venció la sesión: volvé a entrar al panel y subí la lista de nuevo.'
                : 'No pude leer esa lista. Probá de nuevo; si sigue fallando, mandala como Excel (.xlsx) o PDF.'),
          )
        })
        .finally(() => generacion.current === g && setLeyendoLista(null))
    }
    const soloFotos = lista.filter(esFoto)
    const fechas = await Promise.all(soloFotos.map(fechaDeFoto))
    const nuevas = soloFotos.map((archivo, n) => ({
      id: `${Date.now()}-${n}`,
      url: URL.createObjectURL(archivo),
      archivo,
      fecha: fechas[n],
      estado: 'leyendo',
      visto: null,
      manual: null,
      ancla: null,
    }))
    if (lista.some((a) => !esLista(a) && !esFoto(a))) setError('Sólo se aceptan fotos y la lista de stock (Excel, PDF o CSV).')
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

  const elegir = (id, patente) =>
    setItems((a) => a.map((i) => (i.id === id ? { ...i, manual: patente || null, visto: i.visto ?? {} } : i)))
  const elegirAncla = (id, patente) => setItems((a) => a.map((i) => (i.id === id ? { ...i, ancla: patente || null } : i)))
  const esExtra = (i) => i.ancla || extras[i.id] || (deAdentro(i) && !cruces[i.id])
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
        <Dato etiqueta="Patente">{mostrarPatente(u.patente)}</Dato>
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
              Subí las fotos y la lista de stock juntas (Excel, PDF o CSV, como venga): cada foto se reconoce sola por la patente y, si coincide exacto con
              el Excel, el auto entra al stock sin que hagas nada. Si la chapa no se lee, se busca por modelo y
              color. Si una sola letra de la patente se lee distinta, también entra sola. Si la IA tiene otra duda
              (una patente que no se parece a ninguna del Excel), la foto queda marcada para que la revises vos
              antes de cargarla.
            </p>
            <p className="mt-2 text-sm text-white/60">
              Las fotos de adentro (tablero, asientos, detalles) subilas junto con las demás: cada una se suma sola al
              auto de la foto de afuera que sacaste justo antes. Sacalas auto por auto: primero la de afuera, con la
              patente a la vista, y después las de adentro. Si llegan por WhatsApp también sirve, siempre que las
              manden en ese mismo orden.
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
              Cargar fotos y lista
            </Boton>
          </div>
          <input
            ref={entrada}
            type="file"
            multiple
            accept="image/*,.xlsx,.xlsm,.csv,.pdf,.xls,.ods,.numbers,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label="Elegir fotos y lista de stock"
            onChange={(e) => {
              recibir(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <p className="mt-4 text-xs text-white/60">
          {leyendoLista
            ? `Leyendo ${leyendoLista}…`
            : excelNombre
              ? `Lista: ${excelNombre} · ${filas.length} autos leídos${
                  filas.some((f) => esCodigo0km(f.patente))
                    ? ` (${filas.filter((f) => esCodigo0km(f.patente)).length} son 0 km sin patente)`
                    : ''
                }`
              : 'Todavía no cargaste la lista.'}
          {!leyendoLista && sinPatente.length > 0 &&
            ` · ${sinPatente.length} sin patente quedaron afuera (${sinPatente.join(', ')}). Si son 0 km, poné «0KM» en la patente`}
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
            {cargadasSolas} {cargadasSolas === 1 ? 'auto cargado' : 'autos cargados'} solos al stock.
          </p>
        )}
        {extrasSubidas > 0 && (
          <p role="status" className="mt-3 text-sm text-white/80">
            {extrasSubidas} {extrasSubidas === 1 ? 'foto de adentro se sumó' : 'fotos de adentro se sumaron'} a su auto.
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
              {dudosas.length === 1 ? 'Hay 1 foto' : `Hay ${dudosas.length} fotos`} que la IA no pudo confirmar.
              Revisá que la foto y el auto del Excel sean los correctos: si lo son, tocá «Agregar»; si no, elegí
              otro auto del Excel o quitá la foto.
            </p>
          )}
          <ul className="mt-3">
            {items.map((i) =>
              esExtra(i) ? (
                <FilaExtra
                  key={i.id}
                  item={i}
                  ancla={pool.find((f) => f.patente === (i.ancla ?? extras[i.id]?.patente)) ?? extras[i.id] ?? null}
                  opciones={pool}
                  onElegir={elegirAncla}
                  onQuitar={quitar}
                />
              ) : (
              <FilaCarga
                key={i.id}
                item={i}
                asignado={cruces[i.id]?.fila}
                metodo={cruces[i.id]?.metodo}
                libres={libres}
                onElegir={elegir}
                onQuitar={quitar}
              />
              ),
            )}
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
