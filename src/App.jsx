import Hero from './components/Hero'
import HeroVertex from './components/HeroVertex'
import Vehicles from './components/Vehicles'
import Showroom from './components/Showroom'
import Services from './components/Services'
import Contact from './components/Contact'
import Footer from './components/Footer'

/* El hero de la casa es el de la foto del salón (opción A) y es el que ve
   cualquiera que entre al sitio. La opción B —el arco 3D con el stock, estilo
   Vertex— queda detrás de ?hero=b para poder mostrarla sin cambiar la portada:
     sin nada  -> opción A, la foto del salón a pantalla completa
     ?hero=a   -> lo mismo, escrito explícito para la página de comparación
     ?hero=b   -> opción B, el arco 3D
   Cuando se decida, esto vuelve a ser un único import. */
const HEROES = { a: Hero, b: HeroVertex }

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
