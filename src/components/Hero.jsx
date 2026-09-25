import { asset } from '../lib/asset'
import { CONTACT, WHATSAPP_URL } from '../data/vehicles'
import { InstagramIcon, WhatsAppIcon, PhoneIcon } from './Icons'
import { Cta } from './Ui'

/* Hero de la referencia: la palabra gigante en vertical pegada al borde
   izquierdo, las franjas diagonales cruzando el fondo, el titular en dos
   renglones a la izquierda y la foto del salón detrás. La cuña de la esquina
   inferior derecha lleva las redes.

   La foto va entera, sin recortar: el bloque toma la proporción del original
   (1080x533) en lugar de un alto fijo, así el `object-cover` no tiene nada
   que sacar. En escritorio el texto se superpone; en el celular la franja
   quedaría de 200px de alto y no entraría nada encima, así que ahí la foto es
   una banda y el texto baja al negro. */
export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate w-full overflow-hidden bg-[#0B0B0B]"
    >
      {/* Logo fantasma del borde izquierdo. Va el logo de la marca y no un
          texto: el nombre tiene su propio lettering y escribirlo con una
          fuente parecida es una imitación. Es decorativo — el nombre ya lo
          dan la barra de arriba y el titular —, así que va con `alt` vacío
          para que el lector de pantalla no lo lea tres veces.

          Acá se nota que el logo sea un vector limpio: es el lugar donde
          más se agranda, y cualquier imprecisión del contorno salta a la
          vista. */}
      <div className="pa-vertical pointer-events-none absolute inset-y-0 left-0 hidden w-[132px] select-none overflow-hidden bg-[#141414] lg:block">
        <img
          src={asset('/ig/logo-paolini.svg')}
          alt=""
          aria-hidden="true"
          className="opacity-[0.15]"
        />
      </div>

      <div className="relative lg:ml-[132px] lg:aspect-[1080/533]">
        <div className="relative aspect-[1080/533] w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <img
            src={asset('/ig/car-amarok.jpg')}
            alt="Volkswagen Amarok en el salón de Automotores Paolini, La Falda"
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          {/* La Amarok es clara y ocupa todo el cuadro, así que el velo tiene
              que ser más cargado que con la foto anterior: sin esto el titular
              blanco se pierde contra la chapa beige. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/55 to-[#0B0B0B]/20 lg:bg-gradient-to-r lg:from-[#0B0B0B] lg:via-[#0B0B0B]/80 lg:to-[#0B0B0B]/15" />
        </div>

        {/* Franjas diagonales. Las oscuras son las de la izquierda; la roja es
            la que en el diseño original va en amarillo. Van después de la foto
            en el marcado porque la diagonal tiene que cruzar por delante de
            ella, como en la maqueta.

            Las oscuras se pintan con negro translúcido y no con un gris
            fijo: sobre la foto, un gris casi negro no se distingue del fondo
            y las tres franjas desaparecían: quedaba sólo la roja y el hero
            perdía la textura que tiene la maqueta. Oscureciendo la foto, en
            cambio, se ven igual de bien sobre la parte clara y sobre la
            oscura.

            Debajo de lg no van: ahí el texto ocupa todo el ancho y la
            diagonal le cruzaba el titular y el botón por la mitad. */}
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <div className="absolute -inset-y-[40%] left-[4%] w-[15%] -skew-x-[38deg] bg-black/45" />
          <div className="absolute -inset-y-[40%] left-[21%] w-[2.5%] -skew-x-[38deg] bg-black/35" />
          <div className="absolute -inset-y-[40%] left-[25%] w-[1%] -skew-x-[38deg] bg-black/35" />
          <div className="absolute -inset-y-[40%] left-[30%] w-[0.6%] -skew-x-[38deg] bg-white/10" />
          <div className="absolute -inset-y-[40%] left-[41%] w-[3.4%] -skew-x-[38deg] bg-[#E0323F]" />
        </div>

        <div className="relative mx-auto flex max-w-[1308px] flex-col justify-center px-5 pb-16 pt-10 sm:px-8 lg:absolute lg:inset-0 lg:px-14 lg:py-10">
          <h1 className="max-w-[680px] font-display text-[34px] font-semibold uppercase leading-[1.06] tracking-[-0.01em] text-white sm:text-[46px] lg:text-[44px] xl:text-[56px]">
            Te acercamos
            <br />
            al auto que buscás
          </h1>

          <p className="mt-6 max-w-[440px] font-sans text-[14px] leading-[24px] text-white/70 sm:text-[15px] sm:leading-[26px]">
            Ya sea que vengas a comprar tu primer 0km, a ver los usados
            certificados o a que te asesoremos con la financiación, en Paolini
            está todo en un mismo lugar. Multimarca, en el centro de La Falda,
            desde hace más de treinta años.
          </p>

          <div className="mt-8">
            <Cta href="#vehiculos">Ver vehículos</Cta>
          </div>
        </div>

        {/* Cuña inferior derecha con las redes. */}
        <div className="pointer-events-none absolute bottom-0 right-0 hidden h-[42%] w-[16%] bg-[#E0323F] [clip-path:polygon(100%_0,100%_100%,0_100%)] lg:block" />
        <div className="absolute bottom-7 right-7 hidden flex-col items-center gap-3 lg:flex">
          <span aria-hidden="true" className="h-8 w-px bg-black/40" />
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-[#0B0B0B] transition-opacity hover:opacity-70"
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">Instagram de Paolini Automotores</span>
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[#0B0B0B] transition-opacity hover:opacity-70"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">WhatsApp de Paolini Automotores</span>
          </a>
          <a
            href={`tel:+${CONTACT.whatsapp}`}
            className="text-[#0B0B0B] transition-opacity hover:opacity-70"
          >
            <PhoneIcon className="h-[18px] w-[18px]" />
            <span className="sr-only">Llamar a Paolini Automotores</span>
          </a>
        </div>
      </div>
    </section>
  )
}
