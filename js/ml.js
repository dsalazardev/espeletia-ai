// Reconocimiento por cámara, 100 % en el celular.
// MobileNetV2 (ONNX, ~9 MB) convierte cada imagen en una "huella" de 1280 números.
// El equipo enseña cada clase con fotos reales del páramo y se clasifica por vecinos más cercanos (k-NN).
import * as db from './db.js';
import { E } from './estado.js';
import { cargarModelo, embedImagen, anotar } from './motor.js';

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const SIZE = 224;
const K = 7;

let listo = false, cargando = null;
let samples = []; // { clase, v: Float32Array, c: Float32Array, base?: true }  base = vienen del paquete del parque (models/parque.json)
let base = null;
// Cabeza calibrada (models/parque.json → lente.cabeza). Antes de comparar, a cada huella se le resta la huella
// promedio de la base y se vuelve a normalizar: las huellas de MobileNetV2 no tienen negativos y «todo se parece a
// todo» (similitud 0,56 dentro de una clase y 0,50 entre clases); centradas, la diferencia se duplica (SimpleShot).
// La certeza pasa a ser la parte de los votos de los 7 vecinos, y el umbral sale de medir con fotos apartadas.
// Sin cabeza (paquetes viejos), se usa la fórmula de antes con simMin/simOk de paquete.json.
let cabeza = null; // { centro: Float32Array, temperatura, umbral }
const canvas = document.createElement('canvas');
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

export function load(onStatus = () => {}) {
  if (listo) return Promise.resolve();
  cargando ??= (async () => {
    onStatus('Cargando el modelo de la cámara…');
    await Promise.all([cargarModelo('vision'), loadSamples()]);
    listo = true;
    onStatus('');
  })().catch((e) => { cargando = null; anotar('Lente (modelo de visión)', e); throw e; });
  return cargando;
}

export const ready = () => listo;

async function loadSamples() {
  const rows = await db.all('muestras');
  if (base === null) {
    const C = E.parque?.lente?.cabeza;
    cabeza = C?.centro ? { centro: new Float32Array(deB64(C.centro).buffer), temperatura: C.temperatura || 10, umbral: C.umbral, curva: C.curva || [], crudo: C } : null;
    base = E.parque?.lente ? decodificar(E.parque.lente).map((x) => ({ ...x, base: true })) : [];
  }
  samples = [...base, ...rows.map((r) => ({ clase: r.clase, v: new Float32Array(r.v) }))];
  for (const m of samples) m.c ??= centrar(m.v);
}

function centrar(v) {
  if (!cabeza) return v;
  const c = new Float32Array(v.length); let n = 0;
  for (let i = 0; i < v.length; i++) { c[i] = v[i] - cabeza.centro[i]; n += c[i] * c[i]; }
  n = Math.sqrt(n) || 1; for (let i = 0; i < c.length; i++) c[i] /= n;
  return c;
}

// Certeza para mostrar: cuánto acertó de verdad la Lente, con fotos apartadas, cuando dio esa parte de los votos.
// (Que los 7 vecinos voten igual no es «100 % seguro»: medido, acierta ≈ 97 %.)
function certeza(votos) {
  const c = cabeza?.curva;
  if (!c?.length) return votos;
  if (votos <= c[0][0]) return Math.min(votos, c[0][1]);
  for (let i = 1; i < c.length; i++) {
    if (votos <= c[i][0]) { const [x0, y0] = c[i - 1], [x1, y1] = c[i]; return y0 + (y1 - y0) * (votos - x0) / ((x1 - x0) || 1); }
  }
  return c[c.length - 1][1];
}

// Umbral calibrado del paquete del parque, o null para usar el de paquete.json (camara.umbral)
export const umbral = () => (cabeza && typeof cabeza.umbral === 'number' ? cabeza.umbral : null);

// ---------- Formato compacto: vectores int8 con una escala por vector, en base64 ----------
const DIM = 1280;
function aB64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function deB64(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
export function codificar(lista = samples) {
  const n = lista.length, q = new Int8Array(n * DIM), es = new Float32Array(n);
  lista.forEach((m, k) => {
    let mx = 0; for (let d = 0; d < DIM; d++) mx = Math.max(mx, Math.abs(m.v[d]));
    const e = mx / 127 || 1; es[k] = e;
    for (let d = 0; d < DIM; d++) q[k * DIM + d] = Math.round(m.v[d] / e);
  });
  const L = { dim: DIM, clases: lista.map((m) => m.clase), vectores: aB64(new Uint8Array(q.buffer)), escalas: aB64(new Uint8Array(es.buffer)) };
  // Se conserva la cabeza de la base: el centro sigue sirviendo; el umbral conviene medirlo otra vez (lente_base.py)
  if (cabeza) L.cabeza = cabeza.crudo;
  return L;
}
function decodificar(L) {
  const q = new Int8Array(deB64(L.vectores).buffer), es = new Float32Array(deB64(L.escalas).buffer);
  return L.clases.map((clase, k) => {
    const v = new Float32Array(DIM); let n = 0;
    for (let d = 0; d < DIM; d++) { v[d] = q[k * DIM + d] * es[k]; n += v[d] * v[d]; }
    n = Math.sqrt(n) || 1; for (let d = 0; d < DIM; d++) v[d] /= n;
    return { clase, v };
  });
}

// Recorta el centro de la imagen (como lo que ve el visitante en el visor) y la pasa a 224×224.
function toTensor(source) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  const side = Math.min(w, h) * 0.8;
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const f = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    f[i] = (data[i * 4] / 255 - MEAN[0]) / STD[0];
    f[plane + i] = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1];
    f[2 * plane + i] = (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2];
  }
  return f;
}

// La huella (1280 números, normalizada) la calcula el worker: aquí solo se prepara la imagen.
export async function embed(source) {
  return embedImagen(toTensor(source));
}

export async function addSample(clase, source) {
  const v = await embed(source);
  await db.put('muestras', undefined, { clase, v: Array.from(v) });
  samples.push({ clase, v, c: centrar(v) });
  return counts();
}

export function counts({ soloBase = false } = {}) {
  const c = {};
  for (const s of samples) if (!soloBase || s.base) c[s.clase] = (c[s.clase] || 0) + 1;
  return c;
}

// Enseñar con fotos de la galería: cada archivo se convierte en un ejemplo de la clase
export async function addSampleImagen(clase, archivo) {
  const bmp = await createImageBitmap(archivo);
  try { return await addSample(clase, bmp); } finally { bmp.close?.(); }
}

// Borra lo enseñado en este teléfono (lo publicado en el paquete del parque se queda)
export async function clearSamples(clase) {
  const keep = samples.filter((s) => !s.base && clase && s.clase !== clase);
  await db.clear('muestras');
  for (const s of keep) await db.put('muestras', undefined, { clase: s.clase, v: Array.from(s.v) });
  samples = [...base, ...keep];
  return counts();
}

// Devuelve { clase, confianza, similitud } o null si no hay entrenamiento.
// La confianza combina tres cosas:
//  1) qué parte de los vecinos más cercanos votan por la clase ganadora,
//  2) si hay suficientes ejemplos,
//  3) qué tan parecida es la imagen al ejemplo más cercano (piso de similitud).
// El punto 3 evita que, con una sola clase entrenada, todo parezca esa clase.
// Calibración con fotos reales: escenas distintas ≈ 0,34–0,56; misma escena ≈ 0,76–0,95.
// Con la cámara en vivo (`seguido`), la huella es el promedio de los últimos cuadros: un cuadro movido
// o con un reflejo no cambia la respuesta, y la confianza sube cuando el visitante sostiene el teléfono.
// Medido con 128 fotos de Commons fuera del modelo base (docs/cambios/2026-11-25-r2-lente-vision.md).
const CUADROS = 3;
let recientes = [];
export function olvidarCuadros() { recientes = []; }
function promedio(q) {
  // Si la escena cambió mucho (otra cosa en el visor), se empieza de nuevo en vez de mezclar
  const ult = recientes[recientes.length - 1];
  if (ult) { let d = 0; for (let i = 0; i < q.length; i++) d += q[i] * ult[i]; if (d < 0.75) recientes = []; }
  recientes.push(q); if (recientes.length > CUADROS) recientes.shift();
  const m = new Float32Array(q.length);
  for (const r of recientes) for (let i = 0; i < q.length; i++) m[i] += r[i];
  let n = 0; for (let i = 0; i < m.length; i++) n += m[i] * m[i];
  n = Math.sqrt(n) || 1; for (let i = 0; i < m.length; i++) m[i] /= n;
  return m;
}

export async function classify(source, { simMin = 0.5, simOk = 0.68, seguido = false } = {}) {
  if (!samples.length) return null;
  const crudo = seguido ? promedio(await embed(source)) : await embed(source);
  const q = centrar(crudo);
  const scored = samples.map((s) => {
    let d = 0; const v = s.c || s.v;
    for (let i = 0; i < q.length; i++) d += q[i] * v[i];
    return { clase: s.clase, sim: d };
  }).sort((a, b) => b.sim - a.sim).slice(0, K);
  const votes = {};
  let total = 0;
  const temp = cabeza ? cabeza.temperatura : 10;
  for (const s of scored) {
    const w = Math.exp(s.sim * temp);
    votes[s.clase] = (votes[s.clase] || 0) + w;
    total += w;
  }
  const [clase, peso] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  const mejor = scored.find((s) => s.clase === clase).sim;
  const cobertura = Math.min(1, scored.length / K);
  // Con cabeza calibrada, la certeza son los votos (el umbral ya se midió con fotos apartadas).
  const parecido = cabeza ? 1 : Math.max(0, Math.min(1, (mejor - simMin) / (simOk - simMin)));
  const confianza = (peso / total) * cobertura * parecido;
  return { clase, confianza, certeza: cabeza ? certeza(confianza) : confianza, similitud: mejor, votos: peso / total };
}

// Importar: un paquete del parque (parque.json) o un modelo antiguo (v1). Queda como enseñado en este teléfono.
export async function importModel(text) {
  const data = JSON.parse(text);
  let lista;
  if (data.tipo === 'paramo-parque' && data.lente) lista = decodificar(data.lente);
  else if (data.tipo === 'paramo-knn') lista = data.muestras.map((m) => ({ clase: m.c, v: m.v }));
  else throw new Error('Este archivo no es un paquete del parque ni un modelo de la Lente.');
  await db.clear('muestras');
  for (const m of lista) await db.put('muestras', undefined, { clase: m.clase, v: Array.from(m.v) });
  await loadSamples();
  return data;
}
