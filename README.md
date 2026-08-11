# Calculadora de IPC (series empalmadas 1965–2026)

Sitio estático (HTML/CSS/JS puro, sin build ni dependencias de npm) con 6 series de IPC
argentino empalmadas, cada una con distinta fuente en el tramo 2007–2012 y distinto
punto de corte hacia GBA/Nacional después de 2016.

## Cómo subirlo a GitHub Pages

1. Creá un repo nuevo (o usá uno existente) y copiá todo el contenido de esta carpeta
   (`index.html`, `style.css`, `app.js`, `data/`) a la raíz del repo — o a `/docs` si
   preferís esa convención.
2. `git add . && git commit -m "calculadora IPC" && git push`
3. En GitHub: **Settings → Pages → Deploy from a branch**, elegí la rama y la carpeta
   (`/` o `/docs` según dónde lo hayas puesto).
4. Listo, queda en `https://<usuario>.github.io/<repo>/`.

No hace falta configurar CORS ni servidor: los datos ya vienen embebidos en
`data/bundle.js` (ver más abajo), así que funciona igual local que en GitHub Pages.

## Estructura

- `index.html` — estructura de la página.
- `style.css` — identidad visual (boletín estadístico: Fraunces + IBM Plex Sans/Mono,
  paleta papel/verde billete).
- `app.js` — toda la lógica: selector de serie/rubro, validación de fechas contra
  el rango real de datos, cálculo de variación y monto equivalente, cinta visual
  de empalmes, gráfico en escala logarítmica.
- `data/series.js` — metadata estática de las 6 series (labels, columnas, segmentos
  de empalme con sus fechas de corte). Esto alimenta tanto los selectores como la
  cinta visual.
- `data/bundle.js` — los 6 CSV completos, embebidos como strings dentro de un
  objeto `window.CSV_DATA`. Se cargan con un `<script>` normal, no con `fetch()`,
  así el sitio funciona **tanto abriendo el HTML directo (doble clic) como
  servido por GitHub Pages** — evita el problema de que los navegadores bloquean
  `fetch()` a archivos locales por seguridad (protocolo `file://`).

## ⚠️ Importante: fechas como `<select>`, no como `<input type="month">`

Los campos "Desde"/"Hasta" son selects con los meses realmente disponibles para
el rubro elegido — no un date-picker nativo. Esto es a propósito: `input
type="month"` no anda en Firefox (cae a texto libre) y eso rompía la validación.
Con el select es imposible mandar una fecha que no exista en los datos.

## Cómo actualizar cuando salen datos nuevos

Hay tres formas, de la más a la menos recomendable. Las tres regeneran
`data/bundle.js` solas al final.

### 1. Directo de las fuentes oficiales (la recomendada)

Lee los archivos tal cual se descargan de INDEC e IDECBA, sin pasar por tu
Excel ni por exports manuales. Empalma automáticamente calibrando contra lo
que ya tenés en `data/`.

```
python3 scripts/actualizar_desde_fuentes_oficiales.py \
  --indec sh_ipc_MM_AA.xls \
  --idecba-aperturas IPCBA_base_2021100-Principales_aperturas_indices.xlsx \
  --idecba-bs-svcios IPCBA_base_2021100-Evol_gral_bs_svcios.xlsx \
  --idecba-estac-reg-resto IPCBA_base_2021100-Evol_gral_estac_reg_resto.xlsx
```

Pasále solo los archivos que tengas nuevos (todos los flags son opcionales).
De dónde sale cada uno:

- `--indec`: la "serie histórica" de INDEC (`sh_ipc_MM_AA.xls`), tal cual se
  descarga de indec.gob.ar. Actualiza `gba_sl_ipcba_gba_nacional` y
  `gba_slj_ipcba_gba_nacional` (bloque "Total nacional") y `gba_sl_ipcba_gba`
  (bloque "Región GBA").
- `--idecba-aperturas` / `--idecba-bs-svcios` / `--idecba-estac-reg-resto`:
  los tres reportes "IPCBA base 2021=100" de IDECBA (Principales aperturas,
  Evolución bienes/servicios, Evolución estacionales/regulados/resto).
  Actualizan `gba_sl_ipcba13`.

Cómo empalma: para cada serie busca el último mes que ya tenés en
`data/<serie>.csv`, lo compara contra el mismo mes en el archivo nuevo, y
calcula el factor de escala entre ambos. Si da ~1.0 (esperable, si es
continuación real de la misma serie) aplica ese factor a los meses
*posteriores* a tu último dato y los agrega ya empalmados. Si el factor se
aleja de 1.0, **no toca nada** y avisa — mejor eso que empalmar mal.

**`gba_sl_ipcba12` (12 divisiones) no se actualiza con este método** — IDECBA
dejó de publicar esa apertura con la base 2021=100, solo la de 13. Queda
congelada en su último dato real hasta que decidamos derivarla de la de 13
divisiones o retirarla del selector.

**`gba_sl_ipcba_gba_nacional_nacional2021` tampoco se toca acá** — usa tu
estimación propia (ENGHo 17-18) desde 2022. El día que armes el archivo "tipo
INDEC" con tus valores, en principio entra por el mismo `--indec` (mismo
formato de fila/columna que la serie histórica oficial).

### 2. Desde tu Excel maestro

```
python3 scripts/actualizar_desde_excel.py /ruta/a/Inflación.xlsx
```

Lee directo de las hojas del libro (`Pond2`, `Pond`, `GBA-SL-IPCBA-GBA`,
`Pond2021`, `IPCBA`, `IPCBA12` — ver `SHEET_MAP` en el script). Cada hoja
repite el bloque de columnas varias veces al costado (variación % mensual,
nivel encadenado, etc.); el script calibra solo cuál repetición es el nivel
real, probando cada bloque contra el CSV que ya tenés.

Dos salvedades que aprendimos con el primer uso real:

- **Nunca toma el mes calendario en curso ni posteriores** — no puede haber
  dato oficial publicado de un mes que todavía no terminó.
- Si alguna hoja tiene proyección/estimación propia mezclada más allá de la
  fecha real (nos pasó con "San Luis-Jujuy" y con "13 divisiones"), usá
  `SIBLING_MAP` dentro del script: recorta la serie hija a lo que su serie
  madre ya tiene validado, en vez de creerse cualquier fecha con datos.

### 3. Desde exports `.txt` sueltos (la manual, para casos puntuales)

```
python3 scripts/actualizar_datos.py /ruta/a/los/nuevos/*.txt
```

Mismo formato `.txt` UTF-16 tab-delimitado de siempre. Reconoce el archivo
por nombre (`FILENAME_TO_KEY` en el script) y regenera el CSV correspondiente.

---

Corriendo `python3 scripts/actualizar_datos.py` sin argumentos, en cualquier
momento, solo regenera `data/bundle.js` a partir de los CSV que ya están —
útil si tocás un CSV a mano.

## Cómo agregar una serie nueva más adelante

En `data/series.js`, agregá una entrada al objeto `SERIES` con `label`, `short`,
`first`, `last`, `columns` (deben calzar exacto con el header de tu CSV) y
`segments` (tramos de empalme con su fecha de corte y descripción). Sumá la key
al array `SERIE_ORDER` en `app.js`, y agregá el mapeo correspondiente en el
script de actualización que vayas a usar para esa serie. Corré el script una
vez — te arma el CSV y te regenera `data/bundle.js` solo. El resto (selector,
cinta, validación de fechas) se arma solo.

Los `data/*.csv` sueltos quedan en la carpeta solo como referencia/backup
legible de la limpieza de datos — el sitio en sí lee todo de `data/bundle.js`,
no de esos CSV. Si alguna vez tocás un CSV a mano, acordate de correr
`python3 scripts/actualizar_datos.py` (sin argumentos alcanza) para que
`bundle.js` quede sincronizado — si no, el sitio sigue mostrando los datos
viejos aunque el CSV esté bien.
