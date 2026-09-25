"""Arma public/ig/logo-paolini.svg a partir de las medidas de `parametros.json`.

El logo de Paolini no existe en alta en ningún lado: sólo aparece chico en el
encabezado de los flyers de Instagram ("PAOLINI" mide unos 34px de alto y
"AUTOMOTORES" unos 12px). El SVG anterior salía de trazar un PNG que era una
ampliación de eso, y heredaba los bordes ondulados y las letras deformes.

Acá no se traza nada: cada letra se construye con geometría (palos, rectángulos
de esquinas redondeadas, diagonales) al estilo de la Eurostile Extended que usa
la marca, y las medidas — inclinación, alto, grosores, radios, posición y
ancho de cada letra — salen de ajustar ese modelo contra la mediana de tres
flyers (post00, post03 y post07 de assets-src/instagram): se rasteriza, se
reduce a la grilla del flyer y se minimiza la diferencia de píxeles. Después
se corrigió a mano con un juez que comparaba original y candidato a la misma
escala, hasta que no quedó diferencia de forma visible.

Las coordenadas están en píxeles de ese flyer de 1350px; el SVG las multiplica
por 10.

Uso: python3 scripts/logo/construir.py [salida.svg]
Necesita shapely (pip install --user shapely).
"""
import json
import os
import sys

from shapely.ops import unary_union

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from letras import word, to_image_space, rrect

AQUI = os.path.dirname(os.path.abspath(__file__))
K = 10


def palabra(texto, q):
    xs = [q['x%d' % i] for i in range(len(texto))]
    ws = [q.get('w%d' % i, q['sw']) for i in range(len(texto))]
    return to_image_space(word(texto, xs, ws, q), q['t'], q['base'])


def trazado(geom, ox, oy):
    d = []
    for p in getattr(geom, 'geoms', [geom]):
        for anillo in [p.exterior, *p.interiors]:
            cs = list(anillo.coords)[:-1]
            d.append('M' + ' '.join('%.1f,%.1f' % ((x - ox) * K, (y - oy) * K) for x, y in cs) + 'Z')
    return ''.join(d)


def main():
    dst = sys.argv[1] if len(sys.argv) > 1 else 'public/ig/logo-paolini.svg'
    P = json.load(open(os.path.join(AQUI, 'parametros.json')))
    letras = unary_union([palabra('PAOLINI', P['paolini']), palabra('AUTOMOTORES', P['automotores'])])
    x0, y0, x1, y1 = P['barra']
    barra = rrect(x0, y0, x1, y1, [(y1 - y0) / 2] * 4)
    bx0, by0, bx1, by1 = unary_union([letras, barra]).bounds
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-label="Automotores Paolini">'
           '<path fill="#FFFFFF" fill-rule="evenodd" d="%s"/><path fill="%s" d="%s"/></svg>\n') % (
        round((bx1 - bx0) * K), round((by1 - by0) * K),
        trazado(letras, bx0, by0), P['rojo'], trazado(barra, bx0, by0))
    open(dst, 'w').write(svg)
    print('%s  %d bytes' % (dst, len(svg)))


main()
