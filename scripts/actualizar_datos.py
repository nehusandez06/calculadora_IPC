#!/usr/bin/env python3
"""
Actualiza los data/*.csv de la calculadora a partir de exports nuevos del IPCBA.

Uso:
    python3 scripts/actualizar_datos.py /ruta/a/los/nuevos/*.txt

Los archivos de entrada deben tener el mismo formato que los originales:
UTF-16, separados por tabulador, primera columna = fecha serial de Excel,
resto de columnas = índice por rubro con decimales en coma.

El nombre del archivo (sin extensión) determina a qué serie corresponde
-- ver FILENAME_TO_KEY más abajo. Si IDECBA/GCBA te manda el archivo con
otro nombre, renombralo antes o agregá el alias al diccionario.

El script SOBRESCRIBE por completo el CSV correspondiente (no pega filas
sueltas), así que siempre pasale el export completo más reciente, no un
delta de un solo mes.
"""
import csv
import sys
import glob
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _lib import DATA_DIR, build_bundle, print_series_js_snippet

FILENAME_TO_KEY = {
    "gba_sl_ipcba_gba_nacional": "gba_sl_ipcba_gba_nacional",
    "gba_sl-j_ipcba_gba_nacional": "gba_slj_ipcba_gba_nacional",
    "gba_sl_ipcba_gba": "gba_sl_ipcba_gba",
    "gba_sl_ipcba_gba_nacional_nacional2021": "gba_sl_ipcba_gba_nacional_nacional2021",
    "gba_sl_ipcba12": "gba_sl_ipcba12",
    "gba_sl_ipcba13": "gba_sl_ipcba13",
}


def exceldate_to_ym(n):
    d = datetime(1899, 12, 30) + timedelta(days=int(n))
    return f"{d.year:04d}-{d.month:02d}"


def parse_num(s):
    s = s.strip()
    if not s:
        return None
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def read_txt(path: Path):
    # probamos utf-16 primero (formato original de IDECBA), después utf-8
    for enc in ("utf-16", "utf-8-sig", "utf-8"):
        try:
            with open(path, encoding=enc) as f:
                text = f.read()
            if "\t" in text:
                break
        except (UnicodeError, UnicodeDecodeError):
            continue
    else:
        raise ValueError(f"No pude leer {path} con utf-16/utf-8")
    rows = [r for r in csv.reader(text.splitlines(), delimiter="\t") if r and r[0].strip()]
    return rows


def convert(path: Path):
    stem = path.stem
    key = FILENAME_TO_KEY.get(stem.lower())
    if key is None:
        print(f"  [!] No reconozco el nombre '{path.name}' — lo salteo. "
              f"Agregalo a FILENAME_TO_KEY si corresponde a una serie válida.")
        return None

    rows = read_txt(path)
    header = rows[0]
    cols = header[1:]
    out_rows = []
    for row in rows[1:]:
        ym = exceldate_to_ym(row[0])
        vals = [parse_num(row[i + 1]) if i + 1 < len(row) else None for i in range(len(cols))]
        out_rows.append((ym, vals))

    out_path = DATA_DIR / f"{key}.csv"
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ym"] + cols)
        for ym, vals in out_rows:
            w.writerow([ym] + ["" if v is None else v for v in vals])

    first_ym, last_ym = out_rows[0][0], out_rows[-1][0]
    print(f"  [OK] {path.name} -> data/{key}.csv  ({len(out_rows)} filas, {first_ym} a {last_ym})")
    return key, first_ym, last_ym


def main(argv):
    if not argv:
        print("Sin archivos nuevos: solo voy a regenerar data/bundle.js a partir "
              "de los CSV que ya están en data/.\n")
        build_bundle()
        return

    paths = []
    for pattern in argv:
        paths.extend(Path(p) for p in glob.glob(pattern))
    if not paths:
        print("No encontré ningún archivo con esos patrones.")
        sys.exit(1)

    print(f"Procesando {len(paths)} archivo(s)...\n")
    results = []
    for p in paths:
        r = convert(p)
        if r:
            results.append(r)

    if not results:
        return

    build_bundle()
    print_series_js_snippet(results)


if __name__ == "__main__":
    main(sys.argv[1:])
