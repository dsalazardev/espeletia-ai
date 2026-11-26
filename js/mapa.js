// Mapa del sendero (dibujado como un pliego topográfico), geocercas por GPS y bitácora del recorrido.
import { E, bus, estaciones, cromos, tiene, ganar, visitar, ponerPosicion, texto, bloqueo } from './estado.js';
import { t } from './i18n.js';
import { $, $$, h, esc, distancia, fmtDist, vibrar, aviso, animar, atraparFoco, ahorro } from './util.js';
import * as bit from './bitacora.js';
import { formCodigo } from './guia.js';
import * as relieve from './relieve.js';
import * as m3d from './mapa3d.js';
import * as sendero from './sendero.js';
let modo = 'plano';
let resaltaVolcan = 0;

let watch = null, reintento = null, quiere = false, negado = false;
let ctx = { llegada: async () => {}, preguntar: () => {}, preguntarFicha: () => {}, abrirSobres: () => {} };

export function iniciarMapa(c) {
  ctx = { ...ctx, ...c };
  bus.addEventListener('posicion', () => { revisar(); if (!$('#v-mapa').hidden) { pintar(); m3d.pedirDibujo(); } });
  bus.addEventListener('cambio', () => { if (!$('#v-mapa').hidden) { pintar(); m3d.pedirDibujo(); } });
  // Plano / 3D (el 3D solo si hay relieve real y el teléfono tiene WebGL)
  $$('#mapa-modo [data-m]').forEach((b) => (b.onclick = () => ponerModo(b.dataset.m)));
  chip(t('mapa.gpsApagado'), false);
  // Tocar una estación (en el dibujo o en la lista) abre su hoja
  const abrirDe = (ev) => { const el = ev.target.closest('[data-est]'); if (el) abrirEstacion(el.dataset.est); };
  $('#mapa').addEventListener('click', abrirDe);
  $('#estaciones').addEventListener('click', abrirDe);
  // El navegador no entrega posiciones con la app en segundo plano: se pausa el GPS (ahorra batería)
  // y, al volver, se pide la posición de inmediato para revisar si llegaron a una estación.
  document.addEventListener('visibilitychange', () => {
    if (!quiere) return;
    if (document.hidden) detener();
    else { detener(); arrancar(); ahora(); }
  });
  bit.cargar();
  relieve.cargar().then((d) => { $('#mapa-modo').hidden = !(d && m3d.soportado()) || ahorro(); if (!$('#v-mapa').hidden) pintar(); });
}

// ---------- GPS ----------
export function iniciarGPS() {
  quiere = true;
  arrancar();
}

function arrancar() {
  if (!('geolocation' in navigator)) { chip(t('mapa.gpsSin'), false); return; }
  if (watch !== null || document.hidden) return;
  clearTimeout(reintento);
  chip(t('mapa.gpsBuscando'), false);
  watch = navigator.geolocation.watchPosition(recibir, fallo, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
}

function detener() {
  if (watch !== null) navigator.geolocation.clearWatch(watch);
  watch = null;
}

function ahora() {
  navigator.geolocation?.getCurrentPosition(recibir, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}

function recibir(p) {
  negado = false;
  procesar({ lat: p.coords.latitude, lon: p.coords.longitude, precision: p.coords.accuracy, altitud: p.coords.altitude, altPrec: p.coords.altitudeAccuracy, t: p.timestamp });
}

function fallo(err) {
  detener();
  if (err.code === 1) { negado = true; chip(t('mapa.gpsSinPermiso'), false); if (!$('#v-mapa').hidden) pintar(); return; }
  // Sin señal o tiempo agotado: Chrome no reintenta solo, así que se reintenta aquí
  chip(t('mapa.gpsSin'), false);
  clearTimeout(reintento);
  reintento = setTimeout(arrancar, 8000);
}

// Punto de entrada de cada posición (también lo usan las pruebas y la simulación)
export async function procesar(pos) {
  const alt = await bit.registrar(pos);
  ponerPosicion({ lat: pos.lat, lon: pos.lon, precision: pos.precision, altitud: alt && !alt.estimada ? alt.alt : null, altura: alt });
  chip(t('mapa.gpsOk', { m: Math.round(pos.precision) }), pos.precision < 50);
}

function chip(txt, ok) { const c = $('#gps-chip'); c.textContent = txt; c.classList.toggle('ok', ok); }

function revisar() {
  const p = E.posicion;
  if (!p || p.precision > 120) return; // posición muy imprecisa: esperar
  for (const e of estaciones()) {
    if (distancia(p, e) <= e.radio + Math.min(p.precision, 30)) llegar(e);
  }
}

export async function llegar(e, { simulado = false } = {}) {
  const nueva = await visitar(e.id);
  const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id);
  if (c && !tiene(c.id)) {
    await ganar(c.id, { estacionId: e.id });
    vibrar([200, 120, 200]); // el sobre espera en el álbum, para no interrumpir la caminata
    aviso(t('sobre.caminando', { nombre: texto(c).nombre }), 4500);
    await ctx.llegada(c.id, { simulado });
  } else if (nueva) {
    aviso(t('mapa.llegaste', { est: e.nombre }));
  }
  if (nueva) ctx.alLlegar?.(e, c || null); // el chat ofrecerá hablar de este lugar
  if (!$('#v-mapa').hidden) pintar();
}

// Desde el chat: «Ver en el mapa». Estación → su hoja; 'volcan' → resalta el volcán; '_' → solo el mapa.
export async function mostrar(lugar) {
  if (modo !== 'plano') await ponerModo('plano');
  pintar();
  if (estaciones().some((e) => e.id === lugar)) { abrirEstacion(lugar); return; }
  if (lugar === 'volcan') {
    resaltaVolcan = Date.now() + 4200; pintar(); // pintar() lo marca mientras dure, aunque se redibuje
    setTimeout(() => { if (Date.now() >= resaltaVolcan) pintar(); }, 4300);
  }
}

export function simular(e) {
  return procesar({ lat: e.lat, lon: e.lon, precision: 8, altitud: e.altura, altPrec: 10, t: Date.now() }).then(() => llegar(e, { simulado: true }));
}

// ---------- Dibujo ----------
// Curvas decorativas alrededor del volcán: dan textura de pliego sin descargar mapas.
// No son el relieve real (eso necesitaría un modelo de elevación del terreno; ver LEEME).
function curvas(cx, cy, escala) {
  let s = '';
  for (let k = 1; k <= 22; k++) {
    const r = k * 26 * escala;
    let d = '';
    for (let a = 0; a <= 64; a++) {
      const ang = (a / 64) * Math.PI * 2;
      const ruido = 1 + 0.08 * Math.sin(ang * 3 + k) + 0.05 * Math.sin(ang * 5 - k * 1.7) + 0.03 * Math.cos(ang * 9 + k * 0.6);
      const x = cx + Math.cos(ang) * r * ruido * 1.15, y = cy + Math.sin(ang) * r * ruido * 0.9;
      d += `${a ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    s += `<path class="curva${k % 4 === 0 ? ' maestra' : ''}" d="${d}Z"/>`;
  }
  return s;
}

const W = 360, H = 440, M = 26; // tamaño del pliego y margen interior
const M_POR_GRADO = 111320;
const fmtAlt = (m) => `${Math.round(m).toLocaleString(E.lang === 'es' ? 'es-CO' : 'en-US')} m`;
function fmtDur(ms) {
  const min = Math.round(ms / 60000);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

function escalaBarra(esc2) {
  // metros por píxel → la longitud «redonda» que ocupe entre 50 y 110 px
  const mpp = M_POR_GRADO / esc2;
  const opciones = [50, 100, 200, 250, 500, 1000, 2000];
  const m = opciones.find((x) => x / mpp >= 50) || 2000;
  const px = m / mpp;
  const x = 16, y = H - 18;
  return `<g class="escala"><path d="M${x} ${y - 5} V${y} H${x + px} V${y - 5}"/><text x="${x + px / 2}" y="${y - 8}" text-anchor="middle">${m >= 1000 ? `${m / 1000} km` : `${m} m`}</text></g>`;
}

function norte() {
  return `<g class="norte" transform="translate(${W - 24} 30)"><path d="M0 -14 L6 6 L0 2 L-6 6Z"/><text y="20" text-anchor="middle">N</text></g>`;
}

// Punto donde el segmento centro→(x,y) corta el borde interior del pliego
function alBorde(x, y) {
  const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy;
  const kx = dx ? ((dx > 0 ? W - M : M) - cx) / dx : Infinity;
  const ky = dy ? ((dy > 0 ? H - M : M) - cy) / dy : Infinity;
  const k = Math.min(kx, ky);
  return [cx + dx * k, cy + dy * k, Math.atan2(dy, dx)];
}

export function pintar() {
  const ests = estaciones();
  const v = E.paquete.volcan;
  const pts = ests.map((e) => [e.lat, e.lon]).concat(sendero.puntos().map((q) => [q.lat, q.lon]));
  const cerca = E.posicion && Math.min(...ests.map((e) => distancia(E.posicion, e))) < 1500;
  if (cerca) pts.push([E.posicion.lat, E.posicion.lon]);
  // Con relieve real, el volcán entra en el pliego (es lo que da el contexto). Sin relieve, solo se deja
  // sitio más allá del fin del recorrido para el tramo vedado y la flecha del volcán.
  const rel = relieve.listo();
  const fin = ests.find((e) => e.finAutorizado) || ests[ests.length - 1];
  // Con el sendero real el pliego se ajusta al camino (4 km de norte a sur): si además entrara el volcán, el recorrido
  // quedaría diminuto en una esquina. El volcán aparece entonces como flecha en el borde, con su distancia.
  if (sendero.hay()) pts.push([fin.lat + (v.lat - fin.lat) * 0.12, fin.lon + (v.lon - fin.lon) * 0.12]);
  else if (rel) pts.push([v.lat - 0.004, v.lon]);
  else pts.push([fin.lat + (v.lat - fin.lat) * 0.35, fin.lon + (v.lon - fin.lon) * 0.35]);
  const la = pts.map((p) => p[0]), lo = pts.map((p) => p[1]);
  const [minLa, maxLa, minLo, maxLo] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  const esc2 = Math.min(190 / ((maxLo - minLo) || 1e-3), 300 / ((maxLa - minLa) || 1e-3));
  // Centrado en el pliego
  const ox = (W - (maxLo - minLo) * esc2) / 2, oy = 54 + (300 - (maxLa - minLa) * esc2) / 2;
  const xy = (a, o) => [ox + (o - minLo) * esc2, oy + (maxLa - a) * esc2];
  const [vx, vy] = xy(v.lat, v.lon);
  let s = `<rect class="pliego-fondo" width="${W}" height="${H}"/>`;
  const cx = Math.min(460, Math.max(-100, vx)), cy = Math.min(560, Math.max(-120, vy));
  if (rel) {
    // Relieve real: tinte por altura, sombreado y curvas cada 100 m (Copernicus DEM, ver herramientas/relieve.py)
    const m = rel.meta, [ix, iy] = xy(m.lat1, m.lon0), [jx, jy] = xy(m.lat1 - m.h * m.paso, m.lon0 + m.w * m.paso);
    s += `<image class="relieve" href="${rel.imagen}" x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${(jx - ix).toFixed(1)}" height="${(jy - iy).toFixed(1)}" preserveAspectRatio="none"/>`;
  } else s += `<g class="curvas" aria-hidden="true">${curvas(cx, cy, 1)}</g>`;
  s += `<g class="pliegues"><path d="M120 0 V${H} M240 0 V${H} M0 ${H / 2} H${W}"/></g>`;
  const camino = ests.map((e) => xy(e.lat, e.lon));
  // El camino real si el paquete lo trae (carreteable de OpenStreetMap); si no, estaciones unidas en línea recta
  const trazo = sendero.hay() ? sendero.puntos().map((q) => xy(q.lat, q.lon)) : camino;
  const dTrazo = `M${trazo.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}`;
  s += `<path class="ruta-sombra" d="${dTrazo}"/>`;
  s += `<path class="ruta" d="${dTrazo}"/>`;

  // Fin del recorrido autorizado: un tramo vedado hacia el volcán y una barrera
  const iFin = ests.findIndex((e) => e.finAutorizado);
  if (iFin >= 0) {
    const [fx, fy] = camino[iFin];
    const ang = Math.atan2(vy - fy, vx - fx), L = 46;
    const bx = fx + Math.cos(ang) * L, by = fy + Math.sin(ang) * L;
    // Etiqueta en dos líneas, junto al tramo vedado y del lado donde quepa (unos 105 px de ancho)
    const mx = fx + Math.cos(ang) * L * 0.5, my = fy + Math.sin(ang) * L * 0.5;
    // Si el volcán queda fuera del pliego, su flecha va en el borde hacia ese lado: la etiqueta se pone del otro
    const volcanFueraDerecha = !(vx > M && vx < W - M && vy > M && vy < H - M) && vx > fx;
    const derechaCabe = mx + 14 + 105 < W - 6 && !volcanFueraDerecha;
    const tx = derechaCabe ? mx + 14 : mx - 14, anchor = derechaCabe ? 'start' : 'end';
    const [l1, l2] = t('mapa.finAutorizado2').split('|');
    s += `<g class="vedado"><path class="vedado-linea" d="M${fx} ${fy} L${bx} ${by}"/>
      <g transform="translate(${bx} ${by}) rotate(${(ang * 180) / Math.PI + 90})"><rect x="-11" y="-3" width="22" height="6" rx="1.5"/><path d="M-7 -3 l4 6 M0 -3 l4 6" class="vedado-rayas"/></g>
      <text class="vedado-txt" x="${tx.toFixed(1)}" y="${(my + 6).toFixed(1)}" text-anchor="${anchor}"><tspan>${esc(l1)}</tspan><tspan x="${tx.toFixed(1)}" dy="12">${esc(l2 || '')}</tspan></text></g>`;
  }

  // Volcán: en el pliego si cabe; si no, una flecha en el borde con su distancia
  const desde = cerca ? E.posicion : (iFin >= 0 ? ests[iFin] : ests[ests.length - 1]);
  const dV = distancia(desde, v);
  if (vx > M && vx < W - M && vy > M && vy < H - M) {
    s += `<g class="volcan${Date.now() < resaltaVolcan ? ' resaltado' : ''}" transform="translate(${vx} ${vy})"><path d="M-14 8 L-4 -10 H4 L14 8Z"/><text y="22" text-anchor="middle">${esc(v.nombre)}</text></g>`;
  } else {
    const [bx, by, ang] = alBorde(vx, vy);
    const derecha = bx > W / 2, abajo = by > H / 2;
    s += `<g class="volcan volcan-borde${Date.now() < resaltaVolcan ? ' resaltado' : ''}"><g transform="translate(${bx} ${by}) rotate(${(ang * 180) / Math.PI})"><path d="M8 0 L-6 -7 L-3 0 L-6 7Z"/></g>
      <text x="${bx + (derecha ? -12 : 12)}" y="${by + (abajo ? -10 : 18)}" text-anchor="${derecha ? 'end' : 'start'}">${esc(v.nombre)} · ${esc(fmtDist(dV, E.lang))}</text></g>`;
  }

  // Rastro del recorrido (solo si estás cerca: es tu caminata dentro del parque)
  if (cerca) {
    const r = bit.lista().filter((p) => distancia(p, E.posicion) < 4000).map((p) => xy(p.lat, p.lon));
    if (r.length > 1) s += `<path class="rastro" d="M${r.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}"/>`;
  }

  ests.forEach((e, i) => {
    const [x, y] = camino[i];
    const r = Math.max(10, (e.radio / M_POR_GRADO) * esc2);
    const hecha = E.visitadas[e.id];
    const izq = x > 210;
    s += `<circle class="geo" cx="${x}" cy="${y}" r="${r}"/>`;
    s += `<g class="pin${hecha ? ' hecha' : ''}" data-est="${e.id}" transform="translate(${x} ${y})"><title>${esc(e.nombre)}</title><circle class="toque" r="22"/><circle r="12"/><text y="4.5" text-anchor="middle">${i + 1}</text></g>`;
    s += `<text class="pin-nombre" x="${izq ? x - 18 : x + 18}" y="${y + 4}" text-anchor="${izq ? 'end' : 'start'}">${esc(e.nombre)}</text>`;
  });
  if (cerca) {
    const [x, y] = xy(E.posicion.lat, E.posicion.lon);
    const halo = Math.min(60, Math.max(8, (E.posicion.precision / M_POR_GRADO) * esc2));
    s += `<g class="yo" transform="translate(${x} ${y})"><circle class="yo-halo" r="${halo.toFixed(1)}"/><circle class="yo-onda" r="9"/><circle class="yo-punto" r="6"/><title>${esc(t('mapa.aqui'))}</title></g>`;
  } else if (E.posicion) {
    // En dos líneas si no cabe (en inglés se salía por la izquierda del pliego)
    const nota = t('mapa.lejos'), x = (W - 44) / 2, corte = nota.indexOf(': ');
    s += nota.length > 48 && corte > 0
      ? `<text class="nota-mapa" x="${x}" y="22" text-anchor="middle"><tspan x="${x}">${esc(nota.slice(0, corte + 1))}</tspan><tspan x="${x}" dy="14">${esc(nota.slice(corte + 2))}</tspan></text>`
      : `<text class="nota-mapa" x="${x}" y="28" text-anchor="middle">${esc(nota)}</text>`;
  }
  s += escalaBarra(esc2) + norte();
  $('#mapa').innerHTML = s;

  // Atribución de Copernicus: corta en el teléfono, completa en Ajustes → Créditos y licencias
  const mf = $('#mapa-fuente');
  if (!rel) mf.textContent = '';
  else if (!mf.querySelector('button')) {
    mf.innerHTML = `<button type="button" class="link">${esc(t('mapa.atribucionCorta'))}</button>`;
    mf.querySelector('button').onclick = () => import('./ajustes.js').then((m) => m.abrirCreditos());
  } else mf.querySelector('button').textContent = t('mapa.atribucionCorta');
  pintarGpsAyuda();
  pintarBitacora();
  pintarLista(ests);
}

function pintarGpsAyuda() {
  const box = $('#gps-ayuda');
  box.hidden = !negado;
  if (!negado) return;
  // Plan B sin GPS: elegir la estación a mano en la lista; su hoja pide el código del guía (spec escalera-degradacion-ui)
  box.innerHTML = `<p>${esc(t('mapa.permisoAyuda'))}</p><p>${esc(t('mapa.sinGpsManual'))}</p>
    <div class="acciones"><button class="btn btn-linea btn-mini" type="button" data-r>${esc(t('mapa.reintentar'))}</button>
    <button class="btn btn-flor btn-mini" type="button" data-m>${esc(t('mapa.elegirEstacion'))}</button></div>`;
  $('[data-r]', box).onclick = () => { negado = false; quiere = true; detener(); arrancar(); pintarGpsAyuda(); };
  $('[data-m]', box).onclick = () => {
    const ests = estaciones(), sig = ests.find((e) => !E.visitadas[e.id]) || ests[0];
    const li = $(`#estaciones [data-est="${sig.id}"]`);
    li?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    abrirEstacion(sig.id);
  };
}

function pintarLista(ests) {
  const ol = $('#estaciones');
  ol.innerHTML = '';
  let porCamino = false;
  ests.forEach((e, i) => {
    const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id);
    const hecha = E.visitadas[e.id] || (c && tiene(c.id));
    const dd = E.posicion ? sendero.distanciaA(E.posicion, e) : null;
    if (dd?.porSendero) porCamino = true;
    const d = dd ? fmtDist(dd.m, E.lang) : '—';
    const li = h(`<li class="${hecha ? 'hecha' : ''}"><button type="button" class="est-btn" data-est="${e.id}">
        <span class="est-num">${i + 1}</span>
        <span class="est-txt"><b>${esc(e.nombre)}</b>${e.porConfirmar ? `<small>${esc(t('mapa.porConfirmar'))}</small>` : ''}<small>${e.altura ? fmtAlt(e.altura) : ''}${e.finAutorizado ? ` · ${esc(t('mapa.finCorto'))}` : ''}</small></span>
        <span class="est-dist">${hecha ? esc(t('mapa.visitada')) : esc(d)}</span>
      </button></li>`);
    ol.appendChild(li);
  });
  const nota = $('#estaciones-nota');
  nota.textContent = E.posicion ? t(porCamino ? 'mapa.porSendero' : 'mapa.lineaRecta') : '';
}

// ---------- Bitácora ----------
function pintarBitacora() {
  const box = $('#bitacora');
  const r = bit.resumen(), a = E.posicion?.altura || bit.alturaActual();
  if (!r && !a) { box.hidden = true; return; }
  box.hidden = false;
  const perf = bit.perfil();
  let spark = '';
  if (perf.length > 1) {
    const w = 300, hh = 54, xs = perf.map((p) => p.x), ys = perf.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs) || 1, Math.min(...ys), Math.max(...ys)];
    const X = (x) => 4 + ((x - x0) / ((x1 - x0) || 1)) * (w - 8), Y = (y) => hh - 6 - ((y - y0) / ((y1 - y0) || 1)) * (hh - 16);
    const d = perf.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
    spark = `<svg class="perfil" viewBox="0 0 ${w} ${hh}" role="img" aria-label="${esc(t('bit.perfil', { min: fmtAlt(y0), max: fmtAlt(y1) }))}"><path class="perfil-area" d="${d} L${X(perf[perf.length - 1].x)} ${hh} L${X(perf[0].x)} ${hh}Z"/><path class="perfil-linea" d="${d}"/><text x="4" y="10">${fmtAlt(y1)}</text><text x="4" y="${hh - 1}">${fmtAlt(y0)}</text></svg>`;
  }
  const dato = (k, v, extra = '') => `<div class="bit-dato${extra}"><span>${esc(t(k))}</span><b>${v}</b></div>`;
  const altTxt = a ? `${a.estimada ? '≈ ' : ''}${fmtAlt(a.alt)}` : '—';
  box.innerHTML = `<header><h3>${esc(t('bit.titulo'))}</h3><button class="link" type="button" id="bit-borrar">${esc(t('bit.borrar'))}</button></header>
    <div class="bit-datos">
      ${dato('bit.alturaAhora', altTxt, ' grande')}
      ${r?.altMax != null ? dato('bit.altMax', `${r.alturaGps ? '' : '≈ '}${fmtAlt(r.altMax)}`) : ''}
      ${r?.subida ? dato('bit.subida', `+${fmtAlt(r.subida)}`) : ''}
      ${r ? dato('bit.distancia', esc(fmtDist(r.distancia, E.lang))) : ''}
      ${r && r.duracion > 60000 ? dato('bit.tiempo', esc(fmtDur(r.duracion))) : ''}
    </div>
    ${spark}
    ${a && a.alt >= 3500 ? `<button class="chip chip-altura" type="button" id="bit-altura">${esc(t('bit.altura', { alt: fmtAlt(a.alt) }))}</button>` : ''}
    <p class="bit-nota">${esc(t(a?.estimada ? 'bit.notaEstimada' : 'bit.nota'))}</p>`;
  $('#bit-borrar', box).onclick = async () => { if (confirm(t('bit.borrarSeguro'))) { await bit.borrar(); pintar(); } };
  const ch = $('#bit-altura', box);
  if (ch) ch.onclick = () => ctx.preguntarFicha('mal_altura');
}

// ---------- Hoja de una estación ----------
export function abrirEstacion(id) {
  const ests = estaciones();
  const i = ests.findIndex((e) => e.id === id);
  const e = ests[i];
  if (!e) return;
  const c = cromos().find((k) => k.tipo === 'gps' && k.estacion === e.id);
  const hecha = E.visitadas[e.id] || (c && tiene(c.id));
  const capa = $('#capa-estacion');
  const tx = c ? texto(c) : null;
  // Igual que la lista: por el sendero si el visitante está en él; si no, en línea recta
  const dd = E.posicion ? sendero.distanciaA(E.posicion, e) : null;
  const d = dd ? fmtDist(dd.m, E.lang) : null;
  const hora = E.visitadas[e.id] ? new Date(E.visitadas[e.id]).toLocaleTimeString(E.lang === 'es' ? 'es-CO' : 'en-US', { hour: 'numeric', minute: '2-digit' }) : null;
  capa.innerHTML = '';
  const hoja = h(`<div class="hoja hoja-estacion">
      <div class="hoja-asa" aria-hidden="true"></div>
      <p class="est-hoja-num">${esc(t('mapa.estacionN', { n: i + 1 }))}${e.altura ? ` · ${fmtAlt(e.altura)}` : ''}</p>
      <h2 id="est-titulo">${esc(e.nombre)}</h2>
      ${e.porConfirmar ? `<p class="sub">${esc(t('mapa.porConfirmar'))}</p>` : ''}
      <p class="est-hoja-estado">${hecha ? esc(hora ? t('mapa.visitadaA', { h: hora }) : t('mapa.visitada')) : esc(d ? t(dd.porSendero ? 'mapa.aDistSendero' : 'mapa.aDist', { d }) : t('mapa.sinPosicion'))}</p>
      ${tx ? `<div class="est-hoja-cromo"><p class="est-hoja-et">${esc(hecha ? t('mapa.tuCromo') : t('mapa.cromoAqui'))}</p><p><b>${esc(tx.nombre)}</b>${hecha ? `<br>${esc(tx.dato)}` : ''}</p></div>` : ''}
      ${e.finAutorizado ? `<p class="est-hoja-aviso">${esc(t('mapa.finAviso'))}</p>` : ''}
      <div class="est-hoja-acc"></div>
      <button class="btn btn-flor btn-ancho" data-x>${esc(t('cerrar'))}</button>
    </div>`);
  const acc = $('.est-hoja-acc', hoja);
  if (c?.ficha) {
    const b = h(`<button class="btn btn-linea">${esc(t('det.preguntar'))}</button>`);
    b.onclick = () => { cerrar(); ctx.preguntar(c.id); };
    acc.appendChild(b);
  }
  // Pausa de aclimatación de esta estación (issue #18)
  const ac = cromos().find((k) => k.tipo === 'aclimatacion' && k.estacion === e.id && !tiene(k.id));
  if (ac && ctx.pausa) {
    const b = h(`<button class="btn btn-flor" data-aclim>${esc(t('accion.aclimatarMin', { min: Math.max(1, Math.round(ac.segundos / 60)) }))}</button>`);
    b.onclick = () => {
      if (bloqueo(ac)) { aviso(t('como.aclimEstacion', { est: e.nombre }), 4000); return; }
      cerrar(); ctx.pausa(ac);
    };
    acc.appendChild(b);
  }
  if (E.ajustes.demo && !hecha) {
    const b = h(`<button class="btn btn-linea">${esc(t('mapa.simular'))}</button>`);
    b.onclick = () => { cerrar(); simular(e); };
    acc.appendChild(b);
  }
  if (!hecha) {
    const det = h(`<details class="plan-b"><summary>${esc(t('planb.gps'))}</summary></details>`);
    det.appendChild(formCodigo(`e:${e.id}`, async (r) => {
      if (r.ganado) { cerrar(); ctx.abrirSobres(); return; }
      aviso(t(r.msg, r.vars), 3500); cerrar(); pintar();
    }));
    acc.appendChild(det);
  }
  capa.appendChild(hoja);
  capa.hidden = false;
  const soltar = atraparFoco(capa);
  animar(hoja, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1)' });
  function cerrar() { capa.hidden = true; capa.innerHTML = ''; soltar(); document.removeEventListener('keydown', esc_); }
  function esc_(ev) { if (ev.key === 'Escape') cerrar(); }
  document.addEventListener('keydown', esc_);
  $('[data-x]', hoja).onclick = cerrar;
  capa.onclick = (ev) => { if (ev.target === capa) cerrar(); };
}

async function ponerModo(m) {
  modo = m;
  $$('#mapa-modo [data-m]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
  const v3 = $('#vista3d');
  $('#mapa').style.visibility = m === '3d' ? 'hidden' : '';
  v3.hidden = m !== '3d';
  if (m === '3d') {
    const ok = await m3d.iniciar($('#mapa3d'), $('#mapa3d-capa'), { onTocar: abrirEstacion }).catch((e) => { console.error(e); return false; });
    if (!ok) { aviso(t('mapa.sin3d')); ponerModo('plano'); $('#mapa-modo').hidden = true; return; }
    m3d.volar();
  }
}

export function entrar() {
  // El ahorro de energía pudo cambiar en Ajustes: sin 3D mientras esté activo
  $('#mapa-modo').hidden = !(relieve.listo() && m3d.soportado()) || ahorro();
  if (ahorro() && modo === '3d') ponerModo('plano');
  iniciarGPS();
  pintar();
  animar($('.pliego'), [
    { transform: 'perspective(900px) rotateX(55deg) scaleY(.6)', opacity: 0, clipPath: 'inset(0 0 60% 0)' },
    { transform: 'perspective(900px) rotateX(0) scaleY(1)', opacity: 1, clipPath: 'inset(0 0 0 0)' },
  ], { duration: 560, easing: 'cubic-bezier(.2,.8,.25,1)' });
}
