import { useCallback, useEffect, useRef, useState } from 'react'
import { cargarPanel, guardarEstado, guardarEstadoConsulta, guardarTasacion } from './api'

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Cuenta de 0 al valor (o del valor anterior al nuevo, cuando cambia). Con
   "reducir movimiento" activado salta directo. */
export function useCountUp(valor, duracion = 900) {
  const [n, setN] = useState(0)
  const desde = useRef(0)
  const quieto = reduceMotion()

  useEffect(() => {
    if (quieto) return undefined
    const inicio = desde.current
    const t0 = performance.now()
    let raf
    const paso = (t) => {
      const p = Math.min((t - t0) / duracion, 1)
      const suave = 1 - Math.pow(1 - p, 3)
      desde.current = inicio + (valor - inicio) * suave
      setN(desde.current)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor, duracion, quieto])

  return Math.round(quieto ? valor : n)
}

/* Ancho en píxeles de un elemento, para dibujar el gráfico a tamaño real en
   vez de estirar un SVG (que deformaría los textos). */
export function useAncho() {
  const ref = useRef(null)
  const [ancho, setAncho] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setAncho(el.clientWidth)
    const obs = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, ancho]
}

/* Carga el panel y expone el cambio de estado de una unidad. El cambio se ve
   al instante y, si el guardado falla, vuelve atrás y avisa. */
export function usePanel() {
  const [estado, setEstado] = useState('cargando')
  const [datos, setDatos] = useState(null)
  const [aviso, setAviso] = useState(null)

  const [intento, setIntento] = useState(0)

  /* Arranca en "cargando", así que el primer pedido no necesita marcarlo. */
  useEffect(() => {
    let vigente = true
    cargarPanel()
      .then((d) => {
        if (!vigente) return
        setDatos(d)
        setEstado('listo')
      })
      .catch(() => vigente && setEstado('error'))
    return () => {
      vigente = false
    }
  }, [intento])

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((i) => i + 1)
  }, [])

  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])

  /* Cambia una fila de una lista del panel al instante y la devuelve a como
     estaba si el guardado falla. `lista` es la clave de `datos` donde vive. */
  const cambiar = useCallback((lista, id, cambio, guardar) => {
    let anterior
    setDatos((d) => {
      anterior = d[lista].find((f) => f.id === id)
      return { ...d, [lista]: d[lista].map((f) => (f.id === id ? { ...f, ...cambio } : f)) }
    })
    guardar().catch(() => {
      setDatos((d) => ({ ...d, [lista]: d[lista].map((f) => (f.id === id ? anterior : f)) }))
      setAviso('No se pudo guardar el cambio. Volvió al estado anterior.')
    })
  }, [])

  /* Una unidad que pasa a "Vendido" entra en las ventas de hoy. */
  const cambiarEstado = useCallback(
    (id, nuevo) =>
      cambiar('stock', id, { estado: nuevo, vendidoHaceDias: nuevo === 'vendido' ? 0 : undefined }, () =>
        guardarEstado(id, nuevo),
      ),
    [cambiar],
  )

  const cambiarEstadoConsulta = useCallback(
    (id, nuevo) => cambiar('consultas', id, { estado: nuevo }, () => guardarEstadoConsulta(id, nuevo)),
    [cambiar],
  )

  const marcarTasacion = useCallback(
    (id, contactada) => cambiar('tasaciones', id, { contactada }, () => guardarTasacion(id, contactada)),
    [cambiar],
  )

  return { estado, datos, aviso, recargar, cambiarEstado, cambiarEstadoConsulta, marcarTasacion }
}
