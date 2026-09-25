"""Letras geométricas del logo de Paolini (estilo Eurostile Extended).

Todo se construye derecho (sin inclinar) con la línea de base en y=0 e y hacia
arriba; la inclinación se aplica al final con un shear. Unidades: píxeles de
la referencia (flyer de 1350px), con decimales.
"""
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely import affinity
import numpy as np


def rrect(x0, y0, x1, y1, r=(0, 0, 0, 0), n=32):
    """Rectángulo con radio por esquina: (sup-izq, sup-der, inf-der, inf-izq)."""
    tl, tr, br, bl = [max(0.0, min(v, (x1 - x0) / 2 - 1e-6, (y1 - y0) / 2 - 1e-6)) for v in r]
    pts = []
    def arc(cx, cy, rad, a0, a1):
        if rad <= 1e-6:
            pts.append((cx, cy)); return
        for a in np.linspace(a0, a1, n):
            pts.append((cx + rad * np.cos(a), cy + rad * np.sin(a)))
    arc(x1 - tr, y1 - tr, tr, 0, np.pi / 2) if tr else pts.append((x1, y1))
    arc(x0 + tl, y1 - tl, tl, np.pi / 2, np.pi) if tl else pts.append((x0, y1))
    arc(x0 + bl, y0 + bl, bl, np.pi, 1.5 * np.pi) if bl else pts.append((x0, y0))
    arc(x1 - br, y0 + br, br, 1.5 * np.pi, 2 * np.pi) if br else pts.append((x1, y0))
    return Polygon(pts)


def R4(r): return (r, r, r, r)


# ---------- letras ----------
# p: dict con H (alto), sw (trazo vertical), sh (trazo horizontal), Ro, Ri (radios),
#    más los específicos de cada letra.

def g_I(x, w, p):
    return box(x, 0, x + p['sw'], p['H'])


def g_L(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']
    return unary_union([box(x, 0, x + sw, H), box(x, 0, x + w, sh)])


def g_O(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']
    return rrect(x, 0, x + w, H, R4(p['Ro'])).difference(
        rrect(x + sw, sh, x + w - sw, H - sh, R4(p['Ri'])))


def g_P(x, w, p, leg=False):
    H, sw, sh = p['H'], p['sw'], p['sh']
    yb = p['pb'] * H
    stem = box(x, 0, x + sw, H)
    bowl = rrect(x, yb, x + w, H, (0, p['Ro'], p['Ro'], 0)).difference(
        rrect(x + sw, yb + sh, x + w - sw, H - sh, (0, p['Ri'], p['Ri'], 0)))
    parts = [stem, bowl]
    if leg:
        # pierna recta de la R, desde la panza hasta la base
        lx = x + p['rl'] * w; d = p['rd']
        parts.append(Polygon([(lx, yb + sh), (lx + d, yb + sh), (x + w, 0), (x + w - d, 0)]))
        parts = [unary_union(parts).intersection(box(x, 0, x + w, H))]
    return unary_union(parts)


def g_R(x, w, p):
    return g_P(x, w, p, leg=True)


def g_A(x, w, p):
    H, sh = p['H'], p['sh']
    ta, da, yc = p['ta'], p['da'], p['yc'] * H
    cx = x + w / 2
    outer = Polygon([(x, 0), (x + w, 0), (cx + ta / 2, H), (cx - ta / 2, H)])
    # contraforma: lados paralelos a las patas, corridos hacia adentro da en horizontal
    k = (w / 2 - ta / 2) / H           # corrimiento en x por unidad de alto
    yi = (w / 2 - da) / k               # alto donde se cruzan las patas interiores
    hollow = Polygon([(x + da, 0), (x + w - da, 0), (cx, yi)])
    up = hollow.intersection(box(x, yc + sh, x + w, H))
    dn = hollow.intersection(box(x, -1, x + w, yc))
    return outer.difference(up).difference(dn)


def g_N(x, w, p):
    H, sw = p['H'], p['sw']; d = p['dn']
    diag = Polygon([(x, H), (x + d, H), (x + w, 0), (x + w - d, 0)])
    return unary_union([box(x, 0, x + sw, H), box(x + w - sw, 0, x + w, H), diag]).intersection(box(x, 0, x + w, H))


def g_M(x, w, p):
    H, sw = p['H'], p['sw']; d = p['dm']; ym = p['ym'] * H; cx = x + w / 2
    l = Polygon([(x, H), (x + d, H), (cx + d / 2, ym), (cx - d / 2, ym)])
    r = Polygon([(x + w - d, H), (x + w, H), (cx + d / 2, ym), (cx - d / 2, ym)])
    return unary_union([box(x, 0, x + sw, H), box(x + w - sw, 0, x + w, H), l, r]).intersection(box(x, 0, x + w, H))


def g_U(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']
    o = rrect(x, 0, x + w, H + 50, (0, 0, p['Ro'], p['Ro']))
    i = rrect(x + sw, sh, x + w - sw, H + 60, (0, 0, p['Ri'], p['Ri']))
    return o.difference(i).intersection(box(x, 0, x + w, H))


def g_T(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']; cx = x + w / 2
    return unary_union([box(x, H - sh, x + w, H), box(cx - sw / 2, 0, cx + sw / 2, H)])


def g_E(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']; ym = p['em'] * H
    o = rrect(x, 0, x + w, H, (p['Ro'], 0, 0, p['Ro']))
    i = rrect(x + sw, sh, x + w + 5, H - sh, (p['Ri'], 0, 0, p['Ri']))
    e = o.difference(i)
    return unary_union([e, box(x, ym - sh / 2, x + w * p['ew'], ym + sh / 2)])


def g_S(x, w, p):
    H, sw, sh = p['H'], p['sw'], p['sh']; ym = p['sm'] * H
    Ro, Ri = p['Ro'], p['Ri']
    up = rrect(x, ym - sh / 2, x + w, H, R4(Ro)).difference(rrect(x + sw, ym + sh / 2, x + w - sw, H - sh, R4(Ri)))
    up = up.difference(box(x + w - sw - 1, ym + sh / 2, x + w + 1, H - sh - p['st']))
    lo = rrect(x, 0, x + w, ym + sh / 2, R4(Ro)).difference(rrect(x + sw, sh, x + w - sw, ym - sh / 2, R4(Ri)))
    lo = lo.difference(box(x - 1, sh + p['st'], x + sw + 1, ym - sh / 2))
    return unary_union([up, lo])


LETTERS = dict(A=g_A, U=g_U, T=g_T, O=g_O, M=g_M, R=g_R, E=g_E, S=g_S, P=g_P, L=g_L, I=g_I, N=g_N)


def word(text, xs, ws, p):
    return unary_union([LETTERS[c](x, w, p) for c, x, w in zip(text, xs, ws)])


def to_image_space(geom, shear, baseline):
    """Inclina y pasa a coordenadas de imagen (y hacia abajo)."""
    g = affinity.affine_transform(geom, [1, shear, 0, 1, 0, 0])
    return affinity.affine_transform(g, [1, 0, 0, -1, 0, baseline])
