import { useState } from 'react'
import TopNav from './components/TopNav'
import Hero from './components/Hero'
import BrandStrip from './components/BrandStrip'
import Vehicles from './components/Vehicles'
import Banner from './components/Banner'
import Companion from './components/Companion'
import Financiacion from './components/Financiacion'
import Buscador from './components/Buscador'
import Footer from './components/Footer'

/* El orden de las secciones es el mismo de la maqueta que copiamos: hero,
   tira de marcas, destacados, bloque a sangre, carrusel en abanico, la
   sección de financiación (en el original, la de la app) y el buscador.

   La marca elegida vive acá y no adentro de la tira porque el listado de
   vehículos es el que tiene que reaccionar: al tocar una marca, la tira la
   marca como activa y abajo quedan sólo los autos de esa marca. */
export default function App() {
  const [marca, setMarca] = useState(null)

  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main>
        <Hero />
        <BrandStrip marca={marca} onSelect={setMarca} />
        <Vehicles marca={marca} onLimpiar={() => setMarca(null)} />
        <Banner />
        <Companion />
        <Financiacion />
        <Buscador />
      </main>
      <Footer />
    </div>
  )
}
