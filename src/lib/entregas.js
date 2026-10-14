/* Una entrega es la foto con quien se llevó el auto. El texto no se carga a
   mano: sale del nombre y del vehículo, así todas dicen lo mismo. `plural` es
   para una familia o una pareja ("su compra", "que disfruten"). */
export function frase({ cliente, plural, vehiculo }) {
  return plural
    ? `Gracias ${cliente} por su compra, que disfruten su ${vehiculo}.`
    : `Gracias ${cliente} por tu compra, que disfrutes tu ${vehiculo}.`
}
