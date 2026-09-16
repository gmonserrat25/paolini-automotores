import Hero from './components/Hero'
import Vehicles from './components/Vehicles'
import Showroom from './components/Showroom'
import Services from './components/Services'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <main className="min-h-screen bg-[#010101]">
      <Hero />
      <Vehicles />
      <Showroom />
      <Services />
      <Contact />
      <Footer />
    </main>
  )
}
