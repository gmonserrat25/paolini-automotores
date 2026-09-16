import { useEffect, useRef } from "react";
import { VEHICLES } from "../data/vehicles";
import "./VehicleArc.css";

/* Carrusel 3D de vehículos, al estilo del "Vertex" de MotionSites: las fichas
   están repartidas sobre un cilindro imaginario y el cilindro gira solo, así
   que el stock desfila en un arco y no en una fila plana.

   A diferencia del blob del hero anterior, esto NO depende del cursor: gira
   igual en el celular y en la compu, y con prefers-reduced-motion se queda
   quieto en una pose linda en vez de apagarse. */

/* El stock se repite una vez para llenar el cilindro: con 6 fichas solo se ven
   tres de frente y el arco queda angosto. Las copias caen a 180°, o sea que
   cuando una está de frente su gemela está atrás, fuera de vista. */
const CARDS = [...VEHICLES, ...VEHICLES];
const STEP = 360 / CARDS.length;
// Grados por milisegundo. Una vuelta completa tarda ~48 s.
const SPEED = 360 / 48000;

export default function VehicleArc({ className = "" }) {
  const stageRef = useRef(null);
  const cylinderRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // El radio sale del ancho de la ficha: así las fichas quedan separadas
    // por un hueco parejo en vez de encimarse en pantallas chicas.
    let radius = 420;
    const measure = () => {
      const w = stage.clientWidth;
      const cardW = cardRefs.current[0]?.offsetWidth || 280;
      // R = (ancho/2) / tan(paso/2) es el radio donde las fichas se tocarían;
      // el 1.12 las abre apenas, en abanico, como en Vertex.
      // El cilindro puede ser más ancho que el escenario: lo que sobra queda
      // fuera de cuadro y el degradado de los costados lo disimula. Sin ese
      // margen, en el celular las fichas se encimaban unas con otras.
      radius = Math.max(
        200,
        Math.min((cardW / 2 / Math.tan((STEP / 2) * (Math.PI / 180))) * 1.12, w * 1.6),
      );
      // Sin este retroceso la ficha de adelante queda a z = +radio y la
      // perspectiva la agranda un 40%: se come la pantalla. Corriendo todo el
      // cilindro hacia atrás, la de adelante cae en z = 0 (tamaño real) y las
      // de los costados son las que se alejan.
      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateX(-7deg) translateZ(${-radius.toFixed(0)}px)`;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    let raf = 0;
    const start = performance.now();

    const frame = (t) => {
      const spin = reduced ? -18 : ((t - start) * SPEED) % 360;
      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const angle = i * STEP + spin;
        const rad = angle * (Math.PI / 180);
        // cos(angle) vale 1 cuando la ficha mira de frente y -1 cuando está
        // del otro lado del cilindro: sirve de golpe para el brillo, la
        // opacidad y para esconder las de atrás.
        const facing = Math.cos(rad);
        el.style.transform = `rotateY(${angle.toFixed(2)}deg) translateZ(${radius.toFixed(0)}px)`;
        const vis = Math.max(0, (facing + 0.25) / 1.25);
        el.style.opacity = (0.08 + vis * 0.92).toFixed(3);
        el.style.filter = `brightness(${(0.45 + vis * 0.55).toFixed(3)})`;
        // Las de atrás no deben robar clics ni foco.
        el.style.pointerEvents = facing > 0.35 ? "auto" : "none";
        el.style.zIndex = String(Math.round(facing * 100) + 100);
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={`pa-arc ${className}`.trim()}
      aria-label="Vehículos disponibles en Automotores Paolini"
    >
      <div className="pa-arc__cylinder" ref={cylinderRef}>
        {CARDS.map((v, i) => (
          <a
            key={`${v.id}-${i}`}
            href="#vehiculos"
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="pa-arc__card group"
          >
            <img src={v.image} alt={`${v.brand} ${v.model}`} loading="lazy" />
            <span className="pa-arc__tag">{v.tag}</span>
            <span className="pa-arc__meta">
              <span className="pa-arc__brand">{v.brand}</span>
              <span className="pa-arc__model">{v.model}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
