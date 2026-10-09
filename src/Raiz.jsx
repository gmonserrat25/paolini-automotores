import { lazy, Suspense } from 'react'
import App from './App.jsx'

/* El panel interno vive en /panel y se baja aparte: quien entra al sitio
   público no carga una línea suya. */
const Panel = lazy(() => import('./panel/Panel.jsx'))

export default function Raiz() {
  if (!/^\/panel\/?$/.test(window.location.pathname)) return <App />

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#010101]" />}>
      <Panel />
    </Suspense>
  )
}
