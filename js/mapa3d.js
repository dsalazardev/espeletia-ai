// Vista 3D del sector: el relieve real (Copernicus DEM) con la imagen del pliego como textura, y encima
// la ruta, las estaciones, el fin del recorrido autorizado, el volcán y tu posición.
// WebGL simple, sin librerías (~60.000 vértices). Solo dibuja cuando algo cambia (girar, acercar, una
// posición nueva): quieto no gasta batería. Se gira con un dedo, se acerca con dos (o la rueda).
import { E, estaciones } from './estado.js';
import { t } from './i18n.js';
import { distancia } from './util.js';
import * as relieve from './relieve.js';
import * as bit from './bitacora.js';
import * as sendero from './sendero.js';

const EXAGERAR = 1.5;             // exageración vertical: el relieve se lee mejor
const KM = 111.32;                // km por grado (en esta latitud cos(lat) ≈ 0,996)
let gl = null, prog = null, buf = null, nIdx = 0, tex = null, listo = false;
let cv = null, cv2 = null, c2 = null, d = null, centro = null;
let cam = { yaw: -2.5, pitch: 0.62, dist: 9.5, tx: 0, tz: 0 };
let pend = false, alTocar = () => {};
const punteros = new Map();
let gesto = null;

export const soportado = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } };

// ---------- matrices ----------
function perspectiva(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]; }
function mirar(o, c, up) {
  const z = norm([o[0] - c[0], o[1] - c[1], o[2] - c[2]]), x = norm(cruz(up, z)), y = cruz(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -punto(x, o), -punto(y, o), -punto(z, o), 1];
}
function mult(a, b) { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; }
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// lat/lon/altura → coordenadas del mundo (km): x al este, y arriba, z al sur
function mundo(lat, lon, alt) {
  const m = d.meta;
  return [(lon - centro.lon) * KM, ((alt ?? relieve.altura(lat, lon) ?? m.min) - m.min) / 1000 * EXAGERAR, -(lat - centro.lat) * KM];
}

const VS = `attribute vec3 p; attribute vec2 uv; attribute vec3 n; uniform mat4 mvp; uniform vec3 ojo;
varying vec2 vuv; varying float luz; varying float dist;
void main(){ gl_Position = mvp * vec4(p,1.0); vuv = uv; luz = 0.82 + 0.25*max(dot(normalize(n), normalize(vec3(-0.5,0.9,-0.4))),0.0); dist = distance(p, ojo); }`;
const FS = `precision mediump float; uniform sampler2D tx; uniform vec3 niebla; uniform float lejos;
varying vec2 vuv; varying float luz; varying float dist;
void main(){ vec3 c = texture2D(tx, vuv).rgb * luz; float f = clamp((dist - lejos*0.45)/(lejos*0.9), 0.0, 0.75); gl_FragColor = vec4(mix(c, niebla, f), 1.0); }`;

function compilar(tipo, src) { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }

export async function iniciar(canvas, overlay, { onTocar } = {}) {
  if (listo) return true;
  alTocar = onTocar || alTocar;
  d = await relieve.cargar();
  if (!d) return false;
  cv = canvas; cv2 = overlay; c2 = cv2.getContext('2d');
  gl = cv.getContext('webgl', { antialias: true }) || cv.getContext('experimental-webgl');
  if (!gl) return false;
  const m = d.meta, w = m.w, h = m.h;
  centro = { lat: m.lat1 - (m.h * m.paso) / 2, lon: m.lon0 + (m.w * m.paso) / 2 };
  // Malla: posición, coordenada de textura y normal por vértice
  const v = new Float32Array(w * h * 8);
  const alto = (i, j) => (d.z[Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))] - m.min) / 1000 * EXAGERAR;
  const pasoKm = m.paso * KM;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 8;
    const lon = m.lon0 + (i + 0.5) * m.paso, lat = m.lat1 - (j + 0.5) * m.paso;
    v[k] = (lon - centro.lon) * KM; v[k + 1] = alto(i, j); v[k + 2] = -(lat - centro.lat) * KM;
    v[k + 3] = (i + 0.5) / w; v[k + 4] = (j + 0.5) / h;
    const nx = alto(i - 1, j) - alto(i + 1, j), nz = alto(i, j - 1) - alto(i, j + 1);
    const nn = norm([nx, 2 * pasoKm, -nz]);
    v[k + 5] = nn[0]; v[k + 6] = nn[1]; v[k + 7] = nn[2];
  }
  const idx = new Uint16Array((w - 1) * (h - 1) * 6);
  let q = 0;
  for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) { const a = j * w + i, b = a + 1, c = a + w, e = c + 1; idx.set([a, c, b, b, c, e], q); q += 6; }
  nIdx = idx.length;
  prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  // Textura: la imagen del pliego (tinte, sombreado y curvas reales)
  const img = new Image(); img.src = d.imagen; await img.decode();
  tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.DEPTH_TEST);
  // La cámara mira al centro del recorrido
  const ests = estaciones();
  const cLat = ests.reduce((a, e) => a + e.lat, 0) / ests.length, cLon = ests.reduce((a, e) => a + e.lon, 0) / ests.length;
  const [cx, , cz] = mundo(cLat, cLon, 0);
  cam.tx = cx; cam.tz = cz;
  gestos();
  listo = true;
  return true;
}

export function pedirDibujo() { if (!pend && listo) { pend = true; requestAnimationFrame(dibujar); } }

function ojoYvista() {
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv2.width = cv.width; cv2.height = cv.height;
  }
  const ty = (relieve.altura(centro.lat - cam.tz / KM, centro.lon + cam.tx / KM) ?? d.meta.min) - d.meta.min;
  const blanco = [cam.tx, ty / 1000 * EXAGERAR, cam.tz];
  const ojo = [blanco[0] + cam.dist * Math.cos(cam.pitch) * Math.sin(cam.yaw), blanco[1] + cam.dist * Math.sin(cam.pitch), blanco[2] + cam.dist * Math.cos(cam.pitch) * Math.cos(cam.yaw)];
  const vp = mult(perspectiva(0.85, W / H, 0.05, 60), mirar(ojo, blanco, [0, 1, 0]));
  return { vp, ojo, W, H, dpr };
}

// Proyecta un punto del mundo a la pantalla (píxeles CSS); null si queda detrás de la cámara
function proyectar(vp, p, W, H) {
  const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
  if (w <= 0.01) return null;
  return [(x / w * 0.5 + 0.5) * W, (1 - (y / w * 0.5 + 0.5)) * H];
}

let ultimo = null;
function dibujar() {
  pend = false;
  if (!listo || !cv.clientWidth) return;
  const { vp, ojo, W, H, dpr } = ojoYvista();
  gl.viewport(0, 0, cv.width, cv.height);
  gl.clearColor(0.87, 0.9, 0.89, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const at = (nombre, n, off) => { const l = gl.getAttribLocation(prog, nombre); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 32, off); };
  at('p', 3, 0); at('uv', 2, 12); at('n', 3, 20);
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'mvp'), false, new Float32Array(vp));
  gl.uniform3fv(gl.getUniformLocation(prog, 'ojo'), ojo);
  gl.uniform3fv(gl.getUniformLocation(prog, 'niebla'), [0.87, 0.9, 0.89]);
  gl.uniform1f(gl.getUniformLocation(prog, 'lejos'), cam.dist * 2.2);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(gl.getUniformLocation(prog, 'tx'), 0);
  gl.drawElements(gl.TRIANGLES, nIdx, gl.UNSIGNED_SHORT, 0);
  capa(vp, W, H, dpr);
}

// Lo de encima (ruta, estaciones, etiquetas) se dibuja en 2D, proyectado: siempre nítido y legible
let ocupado = [];
function capa(vp, W, H, dpr) {
  c2.setTransform(dpr, 0, 0, dpr, 0, 0);
  c2.clearRect(0, 0, W, H);
  ocupado = [];
  const pendientes = []; // etiquetas: se colocan al final, evitando que se monten
  const ests = estaciones();
  const P = (lat, lon, sobre = 0.012) => { const p = mundo(lat, lon); p[1] += sobre; return proyectar(vp, p, W, H); };
  // Ruta entre estaciones, siguiendo el terreno (un punto cada ~40 m)
  // Con el sendero real (OpenStreetMap) se sigue el camino; si no, línea recta entre estaciones
  const ruta = [], nodos = sendero.hay() ? sendero.puntos() : ests;
  for (let i = 0; i < nodos.length - 1; i++) {
    const a = nodos[i], b = nodos[i + 1], n = Math.max(1, Math.round(distancia(a, b) / 40));
    for (let k = i ? 1 : 0; k <= n; k++) { const f = k / n; ruta.push(P(a.lat + (b.lat - a.lat) * f, a.lon + (b.lon - a.lon) * f)); }
  }
  const trazo = (pts, color, ancho, guion = []) => {
    c2.beginPath(); let abierto = false;
    for (const q of pts) { if (!q) { abierto = false; continue; } if (abierto) c2.lineTo(q[0], q[1]); else { c2.moveTo(q[0], q[1]); abierto = true; } }
    c2.strokeStyle = color; c2.lineWidth = ancho; c2.setLineDash(guion); c2.lineCap = 'round'; c2.lineJoin = 'round'; c2.stroke(); c2.setLineDash([]);
  };
  trazo(ruta, 'rgba(244,196,49,.85)', 7); trazo(ruta, '#1d2b38', 2.2, [1, 6]);
  // Tu rastro
  const r = bit.lista().map((p) => P(p.lat, p.lon, 0.006));
  if (r.length > 1) trazo(r, 'rgba(60,154,158,.95)', 3.5);
  // Tramo vedado hacia el volcán
  const v = E.paquete.volcan, fin = ests.find((e) => e.finAutorizado);
  if (fin) {
    const ved = []; for (let k = 0; k <= 12; k++) { const f = (k / 12) * 0.45; ved.push(P(fin.lat + (v.lat - fin.lat) * f, fin.lon + (v.lon - fin.lon) * f)); }
    trazo(ved, '#d8492b', 2.5, [5, 4]);
    const q = ved[ved.length - 1]; if (q) pendientes.push({ x: q[0], y: q[1], txt: t('mapa.finAutorizado'), color: '#b8341b', tam: 10.5, prio: 3 });
  }
  // Volcán
  const pv = P(v.lat, v.lon, 0.03);
  if (pv) { c2.fillStyle = '#1d2b38'; c2.beginPath(); c2.moveTo(pv[0], pv[1] - 10); c2.lineTo(pv[0] + 9, pv[1] + 5); c2.lineTo(pv[0] - 9, pv[1] + 5); c2.fill(); pendientes.push({ x: pv[0], y: pv[1] - 4, txt: v.nombre, color: '#1d2b38', tam: 12, prio: 2 }); }
  // Estaciones
  ultimo = [];
  ests.forEach((e, i) => {
    const q = P(e.lat, e.lon); if (!q) return;
    const hecha = E.visitadas[e.id];
    c2.beginPath(); c2.arc(q[0], q[1], 11, 0, 7); c2.fillStyle = hecha ? '#2f6b4f' : '#f4c431'; c2.fill(); c2.lineWidth = 2.5; c2.strokeStyle = hecha ? '#f4c431' : '#2f6b4f'; c2.stroke();
    c2.fillStyle = hecha ? '#f4c431' : '#2f6b4f'; c2.font = '800 12px "Bricolage Grotesque", sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(String(i + 1), q[0], q[1] + 0.5);
    pendientes.push({ x: q[0], y: q[1], txt: e.nombre, color: '#1d2b38', tam: 11.5, prio: 1 });
    ocupado.push([q[0] - 12, q[1] - 12, q[0] + 12, q[1] + 12]);
    ultimo.push({ id: e.id, x: q[0], y: q[1] });
  });
  // Etiquetas por prioridad: estaciones, volcán y fin del recorrido; cada una prueba varios lados
  pendientes.sort((a, b) => a.prio - b.prio);
  for (const l of pendientes) colocar(l, W, H);
  // Tú
  if (E.posicion && relieve.altura(E.posicion.lat, E.posicion.lon) != null) {
    const q = P(E.posicion.lat, E.posicion.lon, 0.008);
    if (q) { c2.beginPath(); c2.arc(q[0], q[1], 7, 0, 7); c2.fillStyle = '#3c9a9e'; c2.fill(); c2.lineWidth = 3; c2.strokeStyle = '#fff'; c2.stroke(); }
  }
}

function colocar({ x, y, txt, color, tam }, W, H) {
  c2.font = `700 ${tam}px "Atkinson Hyperlegible", sans-serif`;
  const w = c2.measureText(txt).width + 6, h = tam + 4;
  const lados = [[16 + w / 2, 0], [0, -20], [-16 - w / 2, 0], [0, 20]];
  for (const [dx, dy] of lados) {
    const cx = x + dx, cy = y + dy, r = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
    if (r[0] < 2 || r[2] > W - 2 || r[1] < 2 || r[3] > H - 2) continue;
    if (ocupado.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) continue;
    ocupado.push(r);
    etiqueta(cx, cy, txt, color, tam);
    return;
  }
}

function etiqueta(x, y, txt, color, tam) {
  c2.font = `700 ${tam}px "Atkinson Hyperlegible", sans-serif`; c2.textAlign = 'center'; c2.textBaseline = 'middle';
  c2.lineWidth = 4; c2.strokeStyle = 'rgba(238,242,239,.92)'; c2.strokeText(txt, x, y); c2.fillStyle = color; c2.fillText(txt, x, y);
}

// ---------- Gestos: un dedo gira, dos dedos acercan (y mueven), rueda acerca, toque abre una estación ----------
function gestos() {
  const el = cv2;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    gesto = { x0: e.clientX, y0: e.clientY, movio: false, sep: sep(), yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist };
  });
  el.addEventListener('pointermove', (e) => {
    if (!punteros.has(e.pointerId)) return;
    const prev = punteros.get(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 1) {
      const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
      if (Math.abs(e.clientX - gesto.x0) + Math.abs(e.clientY - gesto.y0) > 6) gesto.movio = true;
      cam.yaw -= dx * 0.008; cam.pitch = Math.min(1.35, Math.max(0.2, cam.pitch + dy * 0.006));
    } else if (punteros.size === 2 && gesto.sep) {
      gesto.movio = true;
      cam.dist = Math.min(22, Math.max(1.2, gesto.dist * gesto.sep / (sep() || 1)));
    }
    pedirDibujo();
  });
  const fin = (e) => {
    if (punteros.size === 1 && gesto && !gesto.movio && ultimo) {
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const hit = ultimo.find((p) => Math.hypot(p.x - x, p.y - y) < 22);
      if (hit) alTocar(hit.id);
    }
    punteros.delete(e.pointerId);
    if (punteros.size === 1) { gesto.sep = 0; gesto.dist = cam.dist; }
  };
  el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', (e) => punteros.delete(e.pointerId));
  el.addEventListener('wheel', (e) => { e.preventDefault(); cam.dist = Math.min(22, Math.max(1.2, cam.dist * Math.exp(e.deltaY * 0.0015))); pedirDibujo(); }, { passive: false });
  addEventListener('resize', pedirDibujo);
}
function sep() { const v = [...punteros.values()]; return v.length === 2 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0; }

// Entrada con un vuelo corto: la cámara baja desde arriba hasta una vista oblicua desde Brisas
export function volar() {
  if (!listo) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pedirDibujo(); return; }
  const a = { pitch: 1.3, dist: 15, yaw: cam.yaw + 0.9 }, b = { pitch: 0.62, dist: 9.5, yaw: cam.yaw };
  const t0 = performance.now(), dur = 1600;
  const paso = (now) => {
    const f = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - f, 3);
    cam.pitch = a.pitch + (b.pitch - a.pitch) * e; cam.dist = a.dist + (b.dist - a.dist) * e; cam.yaw = a.yaw + (b.yaw - a.yaw) * e;
    dibujar();
    if (f < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

export const estado = () => ({ listo, cam: { ...cam }, estaciones: ultimo?.length || 0, pts: ultimo || [] });
