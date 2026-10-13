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
