import { asset } from '../lib/asset'

/* Los datos del catálogo. `specs` es la tira de tres datos que cada tarjeta
   muestra debajo de la foto (combustible, caja, plazas), igual que la
   referencia de diseño. */
export const VEHICLES = [
  {
    id: 'tcross',
    brand: 'Volkswagen',
    model: 'T-Cross Extreme',
    type: 'SUV',
    tag: '0km',
    detail: 'SUV · Automática',
    price: 'A consultar',
    specs: ['Nafta', 'Automática', '5 plazas'],
    image: asset('/ig/car-tcross.jpg'),
  },
  {
    id: 'peugeot-208-gt',
    brand: 'Peugeot',
    model: '208 GT',
    type: 'Hatchback',
    tag: '0km',
    detail: 'Hatchback · Full',
    price: 'A consultar',
    specs: ['Nafta', 'Automática', '5 plazas'],
    image: asset('/ig/car-peugeot208gt.jpg'),
  },
  {
    id: 'amarok',
    brand: 'Volkswagen',
    model: 'Amarok',
    type: 'Pick-up',
    tag: 'Entrega inmediata',
    detail: 'Pick-up 4x4 · Diésel',
    price: 'A consultar',
    specs: ['Diésel', 'Manual', '5 plazas'],
    image: asset('/ig/car-amarok.jpg'),
  },
  {
    id: 'byd-atto2',
    brand: 'BYD',
    model: 'Atto 2',
    type: 'SUV',
    tag: 'Eléctrico',
    detail: 'SUV · 100% eléctrico',
    price: 'A consultar',
    specs: ['Eléctrico', 'Automática', '5 plazas'],
    image: asset('/ig/car-byd-atto2.jpg'),
  },
  {
    id: 'peugeot-208',
    brand: 'Peugeot',
    model: '208',
    type: 'Hatchback',
    tag: 'Entrega inmediata',
    detail: 'Hatchback · Nafta',
    price: 'A consultar',
    specs: ['Nafta', 'Manual', '5 plazas'],
    image: asset('/ig/car-peugeot208.jpg'),
  },
  {
    id: 'hibrido',
    brand: 'BYD',
    model: 'Híbrido enchufable',
    type: 'SUV',
    tag: 'Novedad',
    detail: '1.100 km de autonomía',
    price: 'A consultar',
    specs: ['Híbrido', 'Automática', '5 plazas'],
    image: asset('/ig/car-hibrido.jpg'),
  },
]

/* Las marcas que pasan por el salón. La tira las muestra en gris y la activa
   en rojo, como la referencia hace con Tesla. */
export const BRANDS = [
  'Volkswagen',
  'Peugeot',
  'BYD',
  'Toyota',
  'Renault',
  'Ford',
  'Chevrolet',
  'Fiat',
]

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

/* Los enlaces de la barra de arriba. Viven acá y no en el componente porque
   el pie de página y el menú del celular usan la misma lista, y si la
   exportara la barra los tres archivos se importarían en círculo. */
export const NAV_LINKS = [
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Vehículos', href: '#vehiculos' },
  { label: 'Financiación', href: '#financiacion' },
  { label: 'Contacto', href: '#contacto' },
]
