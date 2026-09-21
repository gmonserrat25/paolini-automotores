"""Vectoriza el logo de Paolini: PNG -> SVG, sin dependencias.

El PNG tiene 2827x206 pero es la ampliación de un original mucho más chico:
tiene píxeles de sobra y nada de definición, así que los bordes de las letras
salen ondulados y las curvas con bultos. Agrandarlo no arregla eso — de hecho
Higgsfield ni siquiera lo acepta, porque la tira es de 13.7:1 y fija la
resolución sobre el lado corto. Lo que sirve es trazar el contorno y
enderezarlo, y de paso el logotipo pasa a escalar sin límite.

Uso: python3 logotrace.py entrada.png salida.svg [tolerancia]
"""
import math
import struct
import sys
import zlib

# Alto de las letras grandes ("PAOLINI"), en píxeles del PNG. Es la vara
# contra la que se mide cada contorno para decidir cuánto simplificarlo.
ALTO_REF = 180.0


# ---------------------------------------------------------------- PNG

def read_png(path):
    """Devuelve (ancho, alto, bytearray RGBA). Sólo 8 bits, color tipo 6."""
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit('no es un PNG')

    off, idat = 8, bytearray()
    while off < len(data):
        ln, typ = struct.unpack('>I4s', data[off:off + 8])
        body = data[off + 8:off + 8 + ln]
        if typ == b'IHDR':
            w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', body)
            if (depth, ctype, interlace) != (8, 6, 0):
                raise SystemExit('esperaba RGBA de 8 bits sin entrelazar')
        elif typ == b'IDAT':
            idat += body
        off += 12 + ln

    raw = zlib.decompress(bytes(idat))
    stride, bpp = w * 4, 4
    out = bytearray(w * h * 4)
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        ft = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if ft == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        elif ft != 0:
            raise SystemExit('filtro PNG desconocido: %d' % ft)
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, out


def split_masks(px, w, h):
    """Separa el trazo blanco del subrayado rojo y promedia el rojo real."""
    white = bytearray(w * h)
    red = bytearray(w * h)
    rs = gs = bs = n = 0
    for i in range(w * h):
        r, g, b, a = px[i * 4:i * 4 + 4]
        if a < 128:
            continue
        if r > 90 and r - max(g, b) > 40:
            red[i] = 1
            rs += r
            gs += g
            bs += b
            n += 1
        else:
            white[i] = 1
    color = '#%02X%02X%02X' % (rs // n, gs // n, bs // n) if n else '#E0323F'
    return white, red, color


# ------------------------------------------------------------ contornos

def boundary_loops(mask, w, h):
    """Bordes de los píxeles prendidos, encadenados en bucles cerrados.

    Cada píxel prendido aporta un lado por cada vecino apagado, orientado de
    modo que la figura queda siempre del mismo lado. Así los agujeros (la
    panza de la O, de la A, de la R) salen como bucles propios y se recortan
    solos con `fill-rule="evenodd"`.
    """
    edges = {}

    def add(p, q):
        edges.setdefault(p, []).append(q)

    for y in range(h):
        row = y * w
        for x in range(w):
            if not mask[row + x]:
                continue
            if y == 0 or not mask[row - w + x]:
                add((x, y), (x + 1, y))
            if x == w - 1 or not mask[row + x + 1]:
                add((x + 1, y), (x + 1, y + 1))
            if y == h - 1 or not mask[row + w + x]:
                add((x + 1, y + 1), (x, y + 1))
            if x == 0 or not mask[row + x - 1]:
                add((x, y + 1), (x, y))

    loops = []
    for start in list(edges):
        while edges.get(start):
            loop, p = [start], start
            while True:
                nxts = edges.get(p)
                if not nxts:
                    break
                q = nxts.pop()
                if not nxts:
                    del edges[p]
                if q == start:
                    break
                loop.append(q)
                p = q
            if len(loop) >= 8:
                loops.append(loop)
    return loops


def smooth_loop(loop, k, rounds=3, corner_deg=38.0):
    """Promedia el contorno sin tocar las esquinas.

    Los vértices donde el contorno dobla de verdad se detectan mirando la
    dirección `k` puntos antes y después, y quedan clavados: sin eso el
    promedio redondearía los ángulos rectos de la L o de la P.
    """
    n = len(loop)
    if k < 2 or n < 4 * k:
        return loop

    pts = list(loop)
    lim = math.cos(math.radians(corner_deg))
    corner = [False] * n
    for i in range(n):
        ax = pts[i][0] - pts[i - k][0]
        ay = pts[i][1] - pts[i - k][1]
        bx = pts[(i + k) % n][0] - pts[i][0]
        by = pts[(i + k) % n][1] - pts[i][1]
        la = (ax * ax + ay * ay) ** 0.5
        lb = (bx * bx + by * by) ** 0.5
        if la and lb and (ax * bx + ay * by) / (la * lb) < lim:
            corner[i] = True

    m = 2 * k + 1
    for _ in range(rounds):
        out = []
        for i in range(n):
            if corner[i]:
                out.append(pts[i])
                continue
            sx = sy = 0.0
            for j in range(i - k, i + k + 1):
                p = pts[j % n]
                sx += p[0]
                sy += p[1]
            out.append((sx / m, sy / m))
        pts = out
    return pts


def _dp(pts, tol):
    """Douglas-Peucker sobre una cadena abierta."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        norm = (dx * dx + dy * dy) ** 0.5
        best, bi = -1.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            if norm == 0:
                d = ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
            else:
                d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, bi = d, k
        if best > tol:
            keep[bi] = True
            stack.append((i, bi))
            stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]


def simplify_loop(loop, tol):
    """DP sobre un bucle: se corta en los dos puntos más separados.

    Cortar en dos deja que los dos extremos también se puedan mover; si se
    hiciera de un tirón desde el índice 0, ese vértice quedaría clavado y en
    una curva se nota como un pico.
    """
    n = len(loop)
    if n < 4:
        return loop
    x0, y0 = loop[0]
    far = max(range(n),
              key=lambda i: (loop[i][0] - x0) ** 2 + (loop[i][1] - y0) ** 2)
    a = _dp(loop[:far + 1], tol)
    b = _dp(loop[far:] + [loop[0]], tol)
    return a[:-1] + b[:-1]


def clean_loops(loops, tol, adaptive=True):
    """Suaviza y endereza cada bucle con fuerza proporcional a su tamaño.

    La tolerancia no puede ser una sola para todo el logo: la que endereza
    "PAOLINI", que mide 180px de alto, convierte las letras de
    "AUTOMOTORES", que miden unos 50px, en polígonos toscos. Cada contorno
    se mide contra ALTO_REF y se simplifica en esa proporción.
    """
    out = []
    for loop in loops:
        if adaptive:
            ys = [p[1] for p in loop]
            esc = min(1.0, max(0.3, (max(ys) - min(ys)) / ALTO_REF))
        else:
            esc = 1.0
        k = max(2, int(round(7 * esc)))
        pts = simplify_loop(smooth_loop(loop, k), tol * esc)
        if len(pts) >= 3:
            out.append(pts)
    return out


def trace(px, w, h, tol):
    """Del PNG a los bucles finales, listos para dibujar."""
    white, red, color = split_masks(px, w, h)
    wl = clean_loops(boundary_loops(white, w, h), tol)
    # El subrayado es una barra recta: se endereza de una, sin escalar por
    # su alto, que es de sólo una docena de píxeles.
    rl = clean_loops(boundary_loops(red, w, h), tol, adaptive=False)
    return wl, rl, color


# ------------------------------------------------------------------ svg

def fmt(v):
    return ('%.2f' % v).rstrip('0').rstrip('.')


def path_data(loops):
    parts = []
    for pts in loops:
        parts.append('M' + ' '.join('%s,%s' % (fmt(x), fmt(y))
                                    for x, y in pts) + 'Z')
    return ''.join(parts)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    tol = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0

    w, h, px = read_png(src)
    wl, rl, color = trace(px, w, h, tol)

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
        'role="img" aria-label="Automotores Paolini">'
        '<path fill="#FFFFFF" fill-rule="evenodd" d="%s"/>'
        '<path fill="%s" fill-rule="evenodd" d="%s"/>'
        '</svg>\n' % (w, h, path_data(wl), color, path_data(rl))
    )
    open(dst, 'w').write(svg)
    print('tol %s | %d bucles blancos + %d rojos | rojo %s | %d bytes'
          % (tol, len(wl), len(rl), color, len(svg)))


if __name__ == '__main__':
    main()
