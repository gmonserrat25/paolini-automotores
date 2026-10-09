/* Convierte puntos [x, y] en una curva suave (Catmull-Rom pasada a Bézier).
   La tensión baja evita que la línea se pase por encima de los picos. */
export function trazoSuave(puntos, tension = 0.18) {
  if (puntos.length < 2) return ''
  let d = `M${puntos[0][0]},${puntos[0][1]}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) * tension
    const c1y = p1[1] + (p2[1] - p0[1]) * tension
    const c2x = p2[0] - (p3[0] - p1[0]) * tension
    const c2y = p2[1] - (p3[1] - p1[1]) * tension
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/* Techo "redondo" para el eje: 56 → 60, 51 → 60, 82 → 100. */
export function techo(max) {
  const paso = max <= 60 ? 20 : 50
  return Math.ceil(max / paso) * paso
}
