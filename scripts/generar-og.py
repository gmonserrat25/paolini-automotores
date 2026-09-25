"""Arma la imagen de vista previa para WhatsApp y redes (og:image).

Es la tarjeta que aparece cuando se pega el link en un chat, así que tiene
que decir de quién es el sitio de un vistazo: fondo de marca, la diagonal
roja del hero y el logo en el medio. El logo se rasteriza desde el mismo
SVG que usa la página (public/ig/logo-paolini.svg), así que sale nítido.

1200x630 es la medida que piden Facebook y WhatsApp para la tarjeta grande.

Uso: python3 scripts/generar-og.py [salida.png]
"""
import math
import os
import re
import struct
import sys
import zlib

W, H = 1200, 630
FONDO = (11, 11, 11)
ROJO = (224, 50, 63)
LOGO_SVG = 'public/ig/logo-paolini.svg'
SS = 4          # submuestreo vertical, para que los bordes no queden dentados
SESGO = math.tan(math.radians(38))   # el mismo ángulo que las franjas del hero


def banda(cx, ancho):
    """Un paralelogramo vertical inclinado, como las franjas del hero."""
    k = SESGO * H / 2
    return [(cx + ancho / 2 + k, 0), (cx - ancho / 2 + k, 0),
            (cx - ancho / 2 - k, H), (cx + ancho / 2 - k, H)]


def rellenar(buf, poligonos, color, alpha=1.0):
    """Scanline con cobertura parcial en los bordes."""
    bordes = []
    for pol in poligonos:
        n = len(pol)
        for i in range(n):
            x1, y1 = pol[i]
            x2, y2 = pol[(i + 1) % n]
            if y1 != y2:
                bordes.append((y1, y2, x1, x2))
    if not bordes:
        return

    cov = {}
    for sy in range(H * SS):
        y = (sy + 0.5) / SS
        xs = []
        for y1, y2, x1, x2 in bordes:
            if (y1 <= y < y2) or (y2 <= y < y1):
                xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        if not xs:
            continue
        xs.sort()
        fila = sy // SS
        for i in range(0, len(xs) - 1, 2):
            a, b = xs[i], xs[i + 1]
            a, b = max(0.0, a), min(float(W), b)
            if b <= a:
                continue
            ia, ib = int(a), int(b)
            if ia == ib:
                cov[(fila, ia)] = cov.get((fila, ia), 0.0) + (b - a)
                continue
            cov[(fila, ia)] = cov.get((fila, ia), 0.0) + (ia + 1 - a)
            for x in range(ia + 1, ib):
                cov[(fila, x)] = cov.get((fila, x), 0.0) + 1.0
            if ib < W:
                cov[(fila, ib)] = cov.get((fila, ib), 0.0) + (b - ib)

    cr, cg, cb = color
    for (fila, x), c in cov.items():
        a = min(1.0, c / SS) * alpha
        i = (fila * W + x) * 3
        buf[i] = int(buf[i] + (cr - buf[i]) * a)
        buf[i + 1] = int(buf[i + 1] + (cg - buf[i + 1]) * a)
        buf[i + 2] = int(buf[i + 2] + (cb - buf[i + 2]) * a)


def leer_logo(path):
    """(ancho, alto, [(color, bucles)]) del SVG del logo. Sus trazados son
    sólo polígonos (M x,y x,y ... Z), así que alcanza con leer los números."""
    svg = open(path).read()
    _, _, lw, lh = map(float, re.search(r'viewBox="([^"]+)"', svg).group(1).split())
    capas = []
    for color, d in re.findall(r'<path fill="#([0-9A-Fa-f]{6})"[^>]* d="([^"]+)"', svg):
        rgb = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
        bucles = [[tuple(map(float, par.split(','))) for par in b.split()]
                  for b in re.findall(r'M([^Z]+)Z', d)]
        capas.append((rgb, bucles))
    return lw, lh, capas


def escalar(loops, k, dx, dy):
    return [[(x * k + dx, y * k + dy) for x, y in pol] for pol in loops]


def write_png(path, buf):
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        raw += buf[y * W * 3:(y + 1) * W * 3]

    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF)

    out = b'\x89PNG\r\n\x1a\n'
    out += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
    out += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    out += chunk(b'IEND', b'')
    open(path, 'wb').write(out)


def main():
    dst = sys.argv[1] if len(sys.argv) > 1 else 'public/og-paolini.png'

    lw, lh, capas = leer_logo(LOGO_SVG)

    buf = bytearray()
    for _ in range(W * H):
        buf += bytes(FONDO)

    # Franjas oscuras de la izquierda, como en el hero.
    rellenar(buf, [banda(150, 190)], (0, 0, 0), 0.5)
    rellenar(buf, [banda(285, 26)], (0, 0, 0), 0.4)
    rellenar(buf, [banda(330, 12)], (255, 255, 255), 0.05)
    # La diagonal roja, corrida al borde para que sea un acento y no un muro.
    rellenar(buf, [banda(1120, 78)], ROJO)

    # El logo, centrado y a lo ancho de dos tercios de la tarjeta.
    ancho = 780
    k = ancho / lw
    dx = (W - ancho) / 2
    dy = (H - lh * k) / 2
    for color, bucles in capas:
        rellenar(buf, escalar(bucles, k, dx, dy), color)

    write_png(dst, buf)
    print('%s  %dx%d  %d bytes' % (dst, W, H, os.path.getsize(dst)))


main()
