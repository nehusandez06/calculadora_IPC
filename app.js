// ---------- estado ----------
const SERIE_ORDER = [
  "gba_sl_ipcba_gba_nacional",
  "gba_slj_ipcba_gba_nacional",
  "gba_sl_ipcba_gba",
  "gba_sl_ipcba_gba_nacional_nacional2021",
  "gba_sl_ipcba12",
  "gba_sl_ipcba13",
];

const cache = {}; // key -> {header, rows, colRange: {colName:{first,last,firstIdx,lastIdx}}}
let currentKey = SERIE_ORDER[0];
let currentRubro = null;

// ---------- utils ----------
const fmtMoney = n => n.toLocaleString('es-AR', {maximumFractionDigits: 2});
function fmtPct(n){
  const sign = n >= 0 ? '+' : '−';
  const abs = Math.abs(n);
  if (abs < 100000) return sign + abs.toLocaleString('es-AR',{maximumFractionDigits:1});
  return sign + abs.toExponential(2).replace('+','');
}

function ymToMonthInput(ym){ return ym; } // ya viene "YYYY-MM"
function cmpYm(a,b){ return a.localeCompare(b); }

// Parser CSV mínimo pero correcto: respeta comillas dobles (así los headers
// con comas adentro, como "Vivienda, agua, electricidad...", no rompen el
// alineamiento de columnas).
function parseCSVLine(line){
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i=0; i<line.length; i++){
    const ch = line[i];
    if (inQuotes){
      if (ch === '"'){
        if (line[i+1] === '"'){ cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"'){ inQuotes = true; }
      else if (ch === ','){ out.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const header = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  return {header, rows};
}

function computeColRanges(header, rows){
  const ranges = {};
  for (let c = 1; c < header.length; c++){
    let firstIdx=-1, lastIdx=-1;
    for (let r=0; r<rows.length; r++){
      const v = rows[r][c];
      if (v !== undefined && v !== ''){
        if (firstIdx===-1) firstIdx=r;
        lastIdx=r;
      }
    }
    ranges[header[c]] = {firstIdx, lastIdx,
      first: firstIdx>=0 ? rows[firstIdx][0] : null,
      last: lastIdx>=0 ? rows[lastIdx][0] : null};
  }
  return ranges;
}

async function loadSerie(key){
  if (cache[key]) return cache[key];
  const text = (window.CSV_DATA || {})[key];
  if (!text){
    throw new Error(`No se encontraron los datos de la serie "${key}" (data/bundle.js no se cargó).`);
  }
  const {header, rows} = parseCSV(text);
  const colRange = computeColRanges(header, rows);
  const ymIndex = {};
  rows.forEach((row,i) => ymIndex[row[0]] = i);
  const data = {header, rows, colRange, ymIndex};
  cache[key] = data;
  return data;
}

function rowValue(data, ym, rubro){
  const idx = data.ymIndex[ym];
  if (idx === undefined) return null;
  const colIdx = data.header.indexOf(rubro);
  const v = data.rows[idx][colIdx];
  return v === '' || v === undefined ? null : parseFloat(v);
}

// ---------- UI: picker de series ----------
function renderSeriePicker(){
  const el = document.getElementById('seriePicker');
  el.innerHTML = '';
  SERIE_ORDER.forEach(key => {
    const s = SERIES[key];
    const card = document.createElement('label');
    card.className = 'series-card' + (key===currentKey ? ' active' : '');
    card.innerHTML = `
      <input type="radio" name="serie" value="${key}" ${key===currentKey?'checked':''}>
      <div class="name">${s.label}</div>
      <div class="desc">${s.short} · ${s.first} a ${s.last}</div>
    `;
    card.addEventListener('click', () => selectSerie(key));
    el.appendChild(card);
  });
}

function markActiveCard(){
  document.querySelectorAll('.series-card').forEach(c => {
    const input = c.querySelector('input');
    c.classList.toggle('active', input.value === currentKey);
  });
}

// ---------- UI: cinta de empalmes ----------
function renderRibbon(key, activeFrom=null, activeTo=null){
  const s = SERIES[key];
  const ribbon = document.getElementById('ribbon');
  const legend = document.getElementById('ribbonLegend');
  ribbon.innerHTML = '';
  legend.innerHTML = '';

  const totalStart = s.first, totalEnd = s.last;
  const totalSpan = monthsBetween(totalStart, totalEnd);
  let prev = totalStart;

  const palette = ['#D8D2BE','#CBC4AC','#BEB598','#B1A783','#A49A6F','#978C5C'];

  s.segments.forEach((seg, i) => {
    const span = monthsBetween(prev, seg.to);
    const widthPct = Math.max(0.6, (span/totalSpan)*100);
    const div = document.createElement('div');
    div.className = 'seg';
    div.style.width = widthPct + '%';
    div.style.background = palette[i % palette.length];

    const overlap = activeFrom && rangesOverlap(prev, seg.to, activeFrom, activeTo);
    if (overlap) div.classList.add('active');

    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.textContent = `${prev} a ${seg.to} — ${seg.label}`;
    div.appendChild(tip);
    ribbon.appendChild(div);

    const dot = document.createElement('span');
    dot.className = 'ribbon-legend-item';
    dot.innerHTML = `<span class="dot" style="background:${palette[i % palette.length]}"></span>${seg.label} (${prev}–${seg.to})`;
    legend.appendChild(dot);

    prev = nextMonth(seg.to);
  });
}

function monthsBetween(a,b){
  const [ay,am] = a.split('-').map(Number);
  const [by,bm] = b.split('-').map(Number);
  return (by-ay)*12 + (bm-am);
}
function nextMonth(ym){
  let [y,m] = ym.split('-').map(Number);
  m += 1; if (m>12){m=1;y+=1;}
  return `${y}-${String(m).padStart(2,'0')}`;
}
function rangesOverlap(s1,e1,s2,e2){
  return cmpYm(s1,e2) <= 0 && cmpYm(s2,e1) <= 0;
}

// ---------- UI: form de rubro/fechas ----------
function populateRubroSelect(key){
  const sel = document.getElementById('rubroSelect');
  sel.innerHTML = '';
  SERIES[key].columns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c.trim();
    sel.appendChild(opt);
  });
  currentRubro = SERIES[key].columns[0];
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function ymLabel(ym){
  const [y,m] = ym.split('-').map(Number);
  return `${MESES[m-1]} ${y}`;
}

async function updateDateBounds(){
  currentRubro = document.getElementById('rubroSelect').value;
  const data = await loadSerie(currentKey);
  const range = data.colRange[currentRubro];
  const desde = document.getElementById('desdeInput');
  const hasta = document.getElementById('hastaInput');

  const prevDesde = desde.value, prevHasta = hasta.value;

  const opts = [];
  for (let i = range.firstIdx; i <= range.lastIdx; i++){
    opts.push(data.rows[i][0]);
  }
  const buildOptions = (sel, selectedYm) => {
    sel.innerHTML = '';
    opts.forEach(ym => {
      const o = document.createElement('option');
      o.value = ym; o.textContent = ymLabel(ym);
      sel.appendChild(o);
    });
    if (opts.includes(selectedYm)) sel.value = selectedYm;
  };
  buildOptions(desde, prevDesde || range.first);
  buildOptions(hasta, prevHasta || range.last);
  if (!opts.includes(desde.value)) desde.value = range.first;
  if (!opts.includes(hasta.value)) hasta.value = range.last;

  document.getElementById('desdeHelp').textContent = `Datos disponibles: ${ymLabel(range.first)} a ${ymLabel(range.last)}`;
  document.getElementById('hastaHelp').textContent = `Datos disponibles: ${ymLabel(range.first)} a ${ymLabel(range.last)}`;
}

async function selectSerie(key){
  currentKey = key;
  markActiveCard();
  populateRubroSelect(key);
  const errEl = document.getElementById('globalError');
  errEl.style.display = 'none';
  try{
    await loadSerie(key);
    await updateDateBounds();
    renderRibbon(key);
  } catch(e){
    errEl.textContent = 'No se pudieron cargar los datos: ' + e.message;
    errEl.style.display = 'block';
  }
  document.getElementById('result').classList.remove('show');
  document.getElementById('chartWrap').style.display = 'none';
}

// ---------- cálculo ----------
async function calcular(){
  let data;
  try{
    data = await loadSerie(currentKey);
  } catch(e){
    const errEl = document.getElementById('globalError');
    errEl.textContent = 'No se pudieron cargar los datos: ' + e.message;
    errEl.style.display = 'block';
    return;
  }
  const rubro = document.getElementById('rubroSelect').value;
  currentRubro = rubro;
  const desde = document.getElementById('desdeInput').value;
  const hasta = document.getElementById('hastaInput').value;
  const monto = parseFloat(document.getElementById('montoInput').value) || 0;

  const help1 = document.getElementById('desdeHelp');
  const help2 = document.getElementById('hastaHelp');
  help1.classList.remove('warn'); help2.classList.remove('warn');

  if (!desde || !hasta){ return; }
  if (cmpYm(desde, hasta) > 0){
    help2.textContent = 'La fecha "hasta" debe ser posterior a "desde".';
    help2.classList.add('warn');
    return;
  }

  const v1 = rowValue(data, desde, rubro);
  const v2 = rowValue(data, hasta, rubro);
  if (v1 === null || v2 === null){
    help1.textContent = 'No hay dato para ese rubro en alguna de las dos fechas.';
    help1.classList.add('warn');
    return;
  }

  const ratio = v2/v1;
  const pct = (ratio - 1) * 100;
  const equivalente = monto * ratio;

  const headline = document.getElementById('resultHeadline');
  const pctClass = pct >= 0 ? 'pct' : 'pct neg';
  headline.innerHTML = `<span class="${pctClass}">${fmtPct(pct)}%</span> entre ${desde} y&nbsp;${hasta}`;

  document.getElementById('resultSub').textContent =
    `${SERIES[currentKey].label} — rubro: ${rubro.trim()}`;

  const bd = document.getElementById('resultBreakdown');
  bd.innerHTML = `
    <div class="k">$${fmtMoney(monto)} en ${desde} equivalen a</div><div class="v">$${fmtMoney(equivalente)} en ${hasta}</div>
    <div class="k">Índice en ${desde}</div><div class="v">${v1.toExponential(4)}</div>
    <div class="k">Índice en ${hasta}</div><div class="v">${v2.toExponential(4)}</div>
    <div class="k">Multiplicador</div><div class="v">×${ratio.toLocaleString('es-AR',{maximumSignificantDigits:6})}</div>
  `;
  document.getElementById('result').classList.add('show');

  renderRibbon(currentKey, desde, hasta);
  drawChart(data, rubro, desde, hasta);
}

// ---------- gráfico ----------
function drawChart(data, rubro, desde, hasta){
  const wrap = document.getElementById('chartWrap');
  wrap.style.display = 'block';
  const canvas = document.getElementById('chartCanvas');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || wrap.clientWidth;
  const cssH = 220;
  canvas.width = cssW*dpr; canvas.height = cssH*dpr;
  canvas.style.height = cssH+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,cssW,cssH);

  const colIdx = data.header.indexOf(rubro);
  const points = [];
  data.rows.forEach(row => {
    if (cmpYm(row[0], desde) >= 0 && cmpYm(row[0], hasta) <= 0){
      const v = row[colIdx];
      if (v !== '' && v !== undefined) points.push({ym: row[0], v: parseFloat(v)});
    }
  });
  if (points.length < 2) return;

  const logs = points.map(p => Math.log10(p.v));
  const minL = Math.min(...logs), maxL = Math.max(...logs);
  const pad = {l:54, r:14, t:14, b:26};
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;

  ctx.strokeStyle = '#C9C2AC';
  ctx.lineWidth = 1;
  ctx.font = '11px IBM Plex Mono, monospace';
  ctx.fillStyle = '#6b6656';
  const nTicks = 4;
  for (let i=0;i<=nTicks;i++){
    const l = minL + (maxL-minL)*i/nTicks;
    const y = pad.t + plotH - (plotH*i/nTicks);
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+plotW,y); ctx.stroke();
    const val = Math.pow(10,l);
    ctx.fillText(val.toExponential(1), 2, y+4);
  }

  ctx.strokeStyle = '#2F6F4E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p,i) => {
    const x = pad.l + plotW * (i/(points.length-1));
    const l = Math.log10(p.v);
    const y = pad.t + plotH - plotH*(l-minL)/(maxL-minL || 1);
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = '#6b6656';
  ctx.fillText(points[0].ym, pad.l, cssH-6);
  const lastLabel = points[points.length-1].ym;
  ctx.fillText(lastLabel, pad.l+plotW-lastLabel.length*6.2, cssH-6);
}

// ---------- hero ----------
async function renderHero(){
  const key = SERIE_ORDER[0];
  const data = await loadSerie(key);
  const first = SERIES[key].first, last = SERIES[key].last;
  const v1 = rowValue(data, first, 'Nivel general');
  const v2 = rowValue(data, last, 'Nivel general');
  const ratio = v2/v1;
  const el = document.getElementById('heroStat');
  el.innerHTML = `
    <div class="item"><span class="num">×${ratio.toExponential(2)}</span><span class="lbl">suba acumulada ${first} → ${last}</span></div>
    <div class="item"><span class="num">6</span><span class="lbl">series con empalmes distintos</span></div>
    <div class="item"><span class="num">5</span><span class="lbl">cambios de metodología en el camino</span></div>
  `;
}

// ---------- init ----------
async function init(){
  renderSeriePicker();
  await selectSerie(currentKey);
  renderHero();
  document.getElementById('rubroSelect').addEventListener('change', updateDateBounds);
  document.getElementById('calcBtn').addEventListener('click', calcular);
}
init();
