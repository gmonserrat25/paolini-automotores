import { useCallback, useEffect, useRef, useState } from 'react'
import { cargarPanel, guardarEstado } from './api'

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

  const cambiarEstado = useCallback((id, nuevo) => {
    let anterior
    setDatos((d) => {
      anterior = d.stock.find((v) => v.id === id).estado
      return { ...d, stock: d.stock.map((v) => (v.id === id ? { ...v, estado: nuevo } : v)) }
    })
    guardarEstado(id, nuevo).catch(() => {
      setDatos((d) => ({
        ...d,
        stock: d.stock.map((v) => (v.id === id ? { ...v, estado: anterior } : v)),
      }))
      setAviso('No se pudo guardar el cambio. Volvió al estado anterior.')
    })
  }, [])

  return { estado, datos, aviso, recargar, cambiarEstado }
}
