import { CONTACT } from '../data/vehicles'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#010101] px-5 py-10 sm:px-8 lg:px-[80px]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <img
          src="/ig/logo-paolini.png"
          alt="Automotores Paolini"
          className="h-6 w-auto"
        />
        <p className="font-inter text-[14px] text-[#7A7C88]">
          © {new Date().getFullYear()} Automotores Paolini · La Falda, Córdoba
        </p>
        <a
          href={CONTACT.instagram}
          target="_blank"
          rel="noreferrer"
          className="font-inter text-[14px] text-[#EEEFF2] hover:opacity-70"
        >
          @paoliniautomotores
        </a>
      </div>
    </footer>
  )
}
