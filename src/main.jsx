import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Raiz from './Raiz.jsx'
import { contarVisita } from './lib/visita.js'

/* El panel no se cuenta: sólo las visitas al sitio público. */
if (!/^\/panel\/?$/.test(window.location.pathname)) contarVisita()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
)
