import { useEffect, useRef } from 'react'

/* Confirmación antes de borrar uno o varios autos. Es un <dialog> nativo:
   atrapa el foco, se cierra con Esc y no deja tocar nada de atrás. El foco
   arranca en "Cancelar" (la opción segura). */
export default function ConfirmarEliminar({ unidades, eliminando, onCancelar, onConfirmar }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => d?.close()
  }, [])

  const varias = unidades.length > 1
  const unidad = unidades[0]
  const algunaSinVender = unidades.some((u) => u.estado !== 'vendido')
  const boton = 'rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        if (!eliminando) onCancelar()
      }}
      aria-labelledby="eliminar-titulo"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/[0.1] bg-[#0B0B0C] p-6 text-white backdrop:bg-black/70"
    >
      <h2 id="eliminar-titulo" className="font-jost text-lg font-medium">
        {varias ? `¿Eliminar ${unidades.length} autos?` : `¿Eliminar ${unidad.brand} ${unidad.model}?`}
      </h2>
      {varias ? (
        <ul className="mt-3 space-y-1 text-sm text-white/80">
          {unidades.slice(0, 6).map((u) => (
            <li key={u.id} className="truncate">
              {u.brand} {u.model} · {u.patente}
            </li>
          ))}
          {unidades.length > 6 && <li className="text-white/60">y {unidades.length - 6} más</li>}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-white/60">Patente {unidad.patente}.</p>
      )}
      <p className="mt-3 text-sm text-white/60">
        Se {varias ? 'borran' : 'borra'} de la base junto con {varias ? 'sus fotos' : 'su foto'} y no se puede
        deshacer.
        {algunaSinVender &&
          ` Si ${varias ? 'se vendieron' : 'se vendió'}, es mejor marcar${varias ? 'los' : 'lo'} como «Vendido» para que cuente en las ventas.`}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={eliminando}
          className={`${boton} border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.05]`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={eliminando}
          className={`${boton} bg-[#E0323F] hover:bg-[#EA4350]`}
        >
          {eliminando ? 'Eliminando…' : varias ? `Eliminar ${unidades.length}` : 'Eliminar'}
        </button>
      </div>
    </dialog>
  )
}
