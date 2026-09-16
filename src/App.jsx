import Hero from './components/Hero'
import HeroSalon from './components/HeroSalon'
import HeroVertex from './components/HeroVertex'
import Vehicles from './components/Vehicles'
import Showroom from './components/Showroom'
import Services from './components/Services'
import Contact from './components/Contact'
import Footer from './components/Footer'

/* Mientras se elige el hero definitivo conviven los tres:
     ?hero=a  -> opción A, foto del salón a pantalla completa
     ?hero=b  -> opción B, arco 3D con el stock (estilo Vertex)
     sin nada -> el hero actual, el del blob que sigue al cursor
   Cuando se decida, esto vuelve a ser un único import. */
const HEROES = { a: HeroSalon, b: HeroVertex }

function pickHero() {
  if (typeof window === 'undefined') return Hero
  const key = new URLSearchParams(window.location.search).get('hero')
  return HEROES[key] || Hero
}

const SelectedHero = pickHero()

export default function App() {
  return (
    <main className="min-h-screen bg-[#010101]">
      <SelectedHero />
      <Vehicles />
      <Showroom />
      <Services />
      <Contact />
      <Footer />
    </main>
  )
}
