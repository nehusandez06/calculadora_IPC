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

## Cómo agregar una serie nueva más adelante

Regenerá `data/bundle.js` a partir de tus CSV (hay un script de una línea en los
comentarios de este README... en realidad, avisame y te lo actualizo yo). En
`data/series.js`, agregá una entrada al objeto `SERIES` con `label`, `short`,
`first`, `last`, `columns` (deben calzar exacto con el header de tu CSV) y
`segments` (tramos de empalme con su fecha de corte y descripción). Sumá la key al
array `SERIE_ORDER` en `app.js` y al objeto `CSV_DATA` en `data/bundle.js` (el texto
completo del CSV como string). El resto (selector, cinta, validación de fechas)
se arma solo.

Los `data/*.csv` sueltos quedan en la carpeta solo como referencia/backup de la
limpieza de datos — el sitio en sí lee todo de `data/bundle.js`, no de esos CSV.
