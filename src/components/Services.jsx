const SERVICES = [
  {
    n: '01',
    title: 'Financiación',
    body: 'Créditos Bancor y planes en cuotas que se gestionan acá mismo, sin vueltas ni trámites por tu cuenta.',
  },
  {
    n: '02',
    title: 'Tomamos tu usado',
    body: 'Tasamos tu vehículo en el día y lo tomamos como parte de pago del que te vas a llevar.',
  },
  {
    n: '03',
    title: 'Gestoría propia',
    body: 'Transferencias, formularios y patentamiento. Te entregamos el auto con todos los papeles en regla.',
  },
  {
    n: '04',
    title: 'Autos, aviones y embarcaciones',
    body: 'Más de tres décadas en La Falda comprando y vendiendo todo tipo de vehículos.',
  },
]

export default function Services() {
  return (
    <section id="servicios" className="bg-[#08080A] px-5 py-24 sm:px-8 lg:px-[80px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
          <div>
            <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-[#E0323F]">
              Por qué Paolini
            </p>
            <h2 className="mt-3 font-display text-[30px] font-medium uppercase leading-[1.1] tracking-[0.04em] text-white sm:text-[38px] lg:text-[46px]">
              Comprar tu auto, simple de verdad
            </h2>
            <p className="mt-6 max-w-[414px] font-sans text-[17px] leading-[27px] text-[#9A9CA8]">
              Somos una concesionaria de familia en el corazón de La Falda.
              Te acompañamos desde la primera consulta hasta que salís
              manejando.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <div key={s.n} className="bg-[#08080A] p-8">
                <span className="font-display text-[20px] font-medium tracking-[0.08em] text-[#E0323F]">
                  {s.n}
                </span>
                <h3 className="mt-3 font-sans text-[19px] font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 font-sans text-[15px] leading-[24px] text-[#9A9CA8]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
