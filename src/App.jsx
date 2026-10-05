import { useState } from 'react'
import TopNav from './components/TopNav'
import Hero from './components/Hero'
import DatosLocal from './components/DatosLocal'
import Vehicles from './components/Vehicles'
import Nosotros from './components/Nosotros'
import Financiacion from './components/Financiacion'
import Footer from './components/Footer'

/* Hero, datos del local, stock con filtro por marca, nosotros,
   financiación y pie. */
export default function App() {
  const [marca, setMarca] = useState(null)

  return (
    <div className="min-h-screen bg-[#050505]">
      <TopNav />
      <main>
        <Hero />
        <DatosLocal />
        <Vehicles marca={marca} onMarca={setMarca} />
        <Nosotros />
        <Financiacion />
      </main>
      <Footer />
    </div>
  )
}
