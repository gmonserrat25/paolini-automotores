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
   sección de financiación (en el original, la de la app) y el buscador. */
export default function App() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main>
        <Hero />
        <BrandStrip />
        <Vehicles />
        <Banner />
        <Companion />
        <Financiacion />
        <Buscador />
      </main>
      <Footer />
    </div>
  )
}
