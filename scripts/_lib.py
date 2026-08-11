from pathlib import Path
import json

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"


def build_bundle():
    """Regenera data/bundle.js embebiendo todos los data/*.csv como texto plano.

    El sitio NO hace fetch() de los .csv en tiempo de ejecución (así funciona
    abriendo index.html directo desde el disco, sin servidor local). Los .csv
    son la fuente de verdad legible/versionable; bundle.js es lo que el
    navegador realmente carga. Por eso este paso corre siempre que se toca
    cualquier CSV, sea por el script de .txt o por el de Excel.
    """
    csvs = sorted(DATA_DIR.glob("*.csv"))
    if not csvs:
        print("  [!] No hay CSVs en data/, no genero bundle.js")
        return
    lines = ["window.CSV_DATA = {};"]
    for csv_path in csvs:
        key = csv_path.stem
        text = csv_path.read_text(encoding="utf-8")
        lines.append(f"window.CSV_DATA[{json.dumps(key)}] = {json.dumps(text)};")
    bundle_path = DATA_DIR / "bundle.js"
    bundle_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n  [OK] data/bundle.js regenerado a partir de {len(csvs)} CSV ({bundle_path.stat().st_size} bytes)")


def print_series_js_snippet(results):
    print("\nListo. Pegá esto en data/series.js, reemplazando 'last' en cada serie que actualizaste:\n")
    for key, first_ym, last_ym in results:
        print(f'  {key}: last: "{last_ym}"')
    print("\n(El 'first' no cambia salvo que te hayan mandado una revisión con más historia.")
    print(" La cinta de empalmes se estira sola hasta el nuevo 'last', no hace falta tocar 'segments'.)")
