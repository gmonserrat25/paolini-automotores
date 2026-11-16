import { lazy, Suspense } from 'react'
import App from './App.jsx'

/* El panel interno vive en /panel y se baja aparte: quien entra al sitio
   público no carga una línea suya. */
const Panel = lazy(() => import('./panel/PanelProtegido.jsx'))
const PaginaAuto = lazy(() => import('./PaginaAuto.jsx'))
const ListadoAutos = lazy(() => import('./ListadoAutos.jsx'))

export default function Raiz() {
  if (/^\/autos\/?$/.test(window.location.pathname)) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
        <ListadoAutos />
      </Suspense>
    )
  }
  const auto = window.location.pathname.match(/^\/autos\/([^/]+)\/?$/)
  if (auto) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
        <PaginaAuto id={auto[1]} />
      </Suspense>
    )
  }
  if (!/^\/panel\/?$/.test(window.location.pathname)) return <App />

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#010101]" />}>
      <Panel />
    </Suspense>
  )
}
