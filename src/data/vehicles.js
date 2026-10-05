import { asset } from '../lib/asset'

/* Los datos del catálogo. `specs` es combustible y caja; `pos` es el
   `object-position` de la foto en la tarjeta, para que quede el auto entero
   aunque las fotos tengan encuadres distintos. */
export const VEHICLES = [
  {
    id: 'tcross',
    brand: 'Volkswagen',
    model: 'T-Cross Extreme',
    type: 'SUV',
    tag: '0 km',
    specs: ['Nafta', 'Automática'],
    image: asset('/ig/tcross.webp'),
    pos: '50% 60%',
  },
  {
    id: 'peugeot-208-gt',
    brand: 'Peugeot',
    model: '208 GT',
    type: 'Hatchback',
    tag: '0 km',
    specs: ['Nafta', 'Automática'],
    image: asset('/ig/peugeot208gt.webp'),
    pos: '50% 60%',
  },
  {
    id: 'amarok',
    brand: 'Volkswagen',
    model: 'Amarok',
    type: 'Pick-up',
    tag: 'Entrega inmediata',
    specs: ['Diésel', 'Manual'],
    image: asset('/ig/amarok.webp'),
    pos: '50% 55%',
  },
  {
    id: 'byd-atto2',
    brand: 'BYD',
    model: 'Atto 2',
    type: 'SUV',
    tag: '100% eléctrico',
    specs: ['Eléctrico', 'Automática'],
    image: asset('/ig/byd-atto2.webp'),
    pos: '50% 40%',
  },
  {
    id: 'peugeot-208',
    brand: 'Peugeot',
    model: '208',
    type: 'Hatchback',
    tag: 'Entrega inmediata',
    specs: ['Nafta', 'Manual'],
    image: asset('/ig/peugeot208-trasera.webp'),
    pos: '50% 28%',
  },
  {
    id: 'hibrido',
    brand: 'BYD',
    model: 'Híbrido enchufable',
    type: 'SUV',
    tag: '1.100 km de autonomía',
    specs: ['Híbrido', 'Automática'],
    image: asset('/ig/hibrido.webp'),
    pos: '50% 42%',
  },
]

/* Sólo las marcas que tienen algo publicado: una marca en la tira que al
   tocarla dice "no tenemos ninguno" es una promesa vacía. */
export const BRANDS = [...new Set(VEHICLES.map((v) => v.brand))]

export const CONTACT = {
  phone: '3548 468411',
  whatsapp: '5493548468411',
  address: 'Av. España 601, La Falda, Córdoba',
  email: 'paoliniautomotores@yahoo.com.ar',
  instagram: 'https://www.instagram.com/paoliniautomotores/',
  hours: [
    ['Lunes a viernes', '9:00 – 13:00 · 17:00 – 21:00'],
    ['Sábados', '9:00 – 13:00'],
    ['Domingos', 'Cerrado'],
  ],
}

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}`

/* Los mismos horarios en minutos desde las 0:00, por día de la semana
   (0 = domingo), para poder decir si el local está abierto ahora. */
const MAÑANA_Y_TARDE = [
  [540, 780],
  [1020, 1260],
]
const TURNOS = {
  0: [],
  1: MAÑANA_Y_TARDE,
  2: MAÑANA_Y_TARDE,
  3: MAÑANA_Y_TARDE,
  4: MAÑANA_Y_TARDE,
  5: MAÑANA_Y_TARDE,
  6: [[540, 780]],
}

const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/* Estado del local en hora de Córdoba, no en la del aparato de quien mira. */
export function estadoDelLocal(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Cordoba',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(ahora)
  const dato = (tipo) => partes.find((p) => p.type === tipo)?.value
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dato('weekday'))
  const min = (Number(dato('hour')) % 24) * 60 + Number(dato('minute'))

  const turno = TURNOS[dia].find(([desde, hasta]) => min >= desde && min < hasta)
  if (turno) return { abierto: true, texto: `hasta las ${hhmm(turno[1])}` }

  const hoy = TURNOS[dia].find(([desde]) => min < desde)
  if (hoy) return { abierto: false, texto: `abre hoy a las ${hhmm(hoy[0])}` }

  for (let i = 1; i <= 7; i++) {
    const siguiente = TURNOS[(dia + i) % 7]
    if (siguiente.length) {
      return {
        abierto: false,
        texto: `abre ${i === 1 ? 'mañana' : 'el próximo día hábil'} a las ${hhmm(siguiente[0][0])}`,
      }
    }
  }
  return { abierto: false, texto: 'Cerrado' }
}

/* Los enlaces de la barra de arriba. Viven acá y no en el componente porque
   el pie de página y el menú del celular usan la misma lista, y si la
   exportara la barra los tres archivos se importarían en círculo. */
export const NAV_LINKS = [
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Stock', href: '#vehiculos' },
  { label: 'Financiación', href: '#financiacion' },
  { label: 'Contacto', href: '#contacto' },
]
