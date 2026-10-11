#!/usr/bin/env python3
"""Carga de autos por foto.

Uso:  key usar openai -- python3 scripts/cargar-autos/cargar.py EXCEL FOTOS_DIR

Por cada foto un modelo de visión lee la patente y reconoce marca/modelo/color.
Después se cruza con el Excel: primero por patente (exacta, o a 1 carácter de
distancia), y si la patente no se ve, por marca + modelo + color. Lo dudoso
queda en "revisar" en vez de adivinarse. Escribe src/data/inventario.json y
copia cada foto a public/autos/<patente>.jpg.
"""
import base64, json, os, re, shutil, sys, urllib.request, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

MODELO_VISION = "gpt-4.1-mini"
RAIZ = Path(__file__).resolve().parents[2]
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
COLUMNAS = ["marca", "modelo", "precio", "anio", "patente", "km", "color"]


def leer_excel(ruta):
    z = zipfile.ZipFile(ruta)
    comp = ["".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t"))
            for si in ET.fromstring(z.read("xl/sharedStrings.xml"))]
    filas = []
    for row in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(f"{{{NS['m']}}}row"):
        celdas = {}
        for c in row:
            col = re.match(r"[A-Z]+", c.get("r")).group()
            v = c.find("m:v", NS)
            if v is None:
                continue
            celdas[col] = comp[int(v.text)] if c.get("t") == "s" else float(v.text)
        if not celdas:
            continue
        d = {k: celdas.get(chr(65 + i)) for i, k in enumerate(COLUMNAS)}
        for k in ("marca", "modelo", "color", "patente"):
            d[k] = re.sub(r"\s+", " ", d[k] or "").strip()
        for k in ("precio", "anio", "km"):
            d[k] = int(d[k]) if d[k] is not None else None
        filas.append(d)
    return filas


def norm_patente(p):
    return re.sub(r"[^A-Z0-9]", "", (p or "").upper())


def dist(a, b):
    if len(a) != len(b):
        return 99
    return sum(x != y for x, y in zip(a, b))


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def mirar(foto, key):
    b64 = base64.b64encode(foto.read_bytes()).decode()
    cuerpo = {
        "model": MODELO_VISION,
        "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": [
            {"type": "text", "text":
             "Foto de un auto a la venta en Argentina. Devolvé JSON con: "
             "patente (la que se lea en la chapa, formato 'AB 123 CD' o 'ABC 123'; "
             "null si no se ve o no estás seguro), marca, modelo (y versión si se "
             "distingue), color (en español, una palabra), "
             "confianza_modelo (0 a 1). No inventes la patente."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"}}]}],
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        json.dumps(cuerpo).encode(),
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(json.loads(r.read())["choices"][0]["message"]["content"])


def cruzar(visto, filas, usados):
    libres = [f for f in filas if f["patente"] not in usados]
    p = norm_patente(visto.get("patente"))
    if p:
        for f in libres:
            if norm_patente(f["patente"]) == p:
                return f, "patente", 1.0
        cerca = [f for f in libres if dist(norm_patente(f["patente"]), p) == 1]
        if len(cerca) == 1:
            return cerca[0], "patente (1 letra dudosa)", 0.85
    marca, modelo, color = norm(visto.get("marca")), norm(visto.get("modelo")), norm(visto.get("color"))
    punt = []
    for f in libres:
        s = 0
        if marca and marca == norm(f["marca"]):
            s += 1
        fm = norm(f["modelo"])
        if modelo and (modelo in fm or fm in modelo or fm[:5] == modelo[:5]):
            s += 2
        if color and color == norm(f["color"]):
            s += 1
        punt.append((s, f))
    punt.sort(key=lambda t: -t[0])
    if punt and punt[0][0] >= 3 and (len(punt) == 1 or punt[0][0] > punt[1][0]):
        return punt[0][1], "marca+modelo+color", 0.6
    return None, "sin match", 0.0


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    key = os.environ.get("OPENAI_API_KEY") or sys.exit("falta OPENAI_API_KEY (usá `key usar openai --`)")
    filas = leer_excel(sys.argv[1])
    fotos = sorted(p for p in Path(sys.argv[2]).iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
    destino = RAIZ / "public" / "autos"
    destino.mkdir(parents=True, exist_ok=True)
    usados, ok, revisar = set(), [], []
    for foto in fotos:
        visto = mirar(foto, key)
        f, como, conf = cruzar(visto, filas, usados)
        print(f"{foto.name}: vio {visto.get('patente')} / {visto.get('marca')} {visto.get('modelo')} {visto.get('color')} -> "
              f"{f['patente'] + ' ' + f['modelo'] if f else 'NO MATCH'} [{como}]")
        if f and conf >= 0.85:
            usados.add(f["patente"])
            nombre = norm_patente(f["patente"]).lower() + ".jpg"
            shutil.copy(foto, destino / nombre)
            ok.append({**f, "foto": f"/autos/{nombre}", "reconocido_por": como})
        else:
            revisar.append({"foto": foto.name, "visto": visto, "candidato": f, "motivo": como})
    faltan = [f for f in filas if f["patente"] not in usados]
    salida = RAIZ / "src" / "data" / "inventario.json"
    salida.write_text(json.dumps({"autos": ok, "revisar": revisar, "sin_foto": faltan}, ensure_ascii=False, indent=2))
    print(f"\n{len(ok)} cargados, {len(revisar)} para revisar, {len(faltan)} del Excel sin foto -> {salida}")


main()
