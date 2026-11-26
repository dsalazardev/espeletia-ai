// Bitácora del recorrido: altura, distancia y tiempo, guardados solo en este teléfono.
//
// Qué se registra y qué no:
// - Solo puntos DENTRO del parque (a menos de 3 km de alguna estación): el viaje en bus no se guarda.
// - Solo mientras la app está abierta: con la pantalla apagada el navegador no entrega posiciones.
// - Puntos con precisión de 50 m o mejor; un punto nuevo cada 15 m de avance o cada 2 minutos.
// - Saltos imposibles caminando (más de 3 m/s) no suman distancia.
//
// La altura: el GPS de muchos teléfonos la da (con su margen de error); se suaviza con la mediana de
// las últimas lecturas para que no salte. Si el teléfono no la da, se estima con la altura del terreno
// en ese punto según el modelo de elevación (js/relieve.js) o, fuera de él, con la de la estación más
// cercana (si está a menos de 400 m), y se marca como «≈ estimada».
import * as db from './db.js';
import { estaciones } from './estado.js';
import { distancia } from './util.js';
import * as relieve from './relieve.js';

const MAX_PUNTOS = 3000;
let puntos = [];      // { t, lat, lon, alt|null, est:boolean }
let alturas = [];     // últimas lecturas de altura del GPS (para la mediana)
let actual = null;    // { alt, estimada, prec }
let cargada = null;

export const cargar = () => (cargada ??= db.get('kv', 'recorrido').then((p) => { puntos = Array.isArray(p) ? p : []; }));
const guardar = () => db.put('kv', 'recorrido', puntos);

const mediana = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

function cercana(p) {
  let mejor = null, dmin = Infinity;
  for (const e of estaciones()) { const d = distancia(p, e); if (d < dmin) { dmin = d; mejor = e; } }
  return { e: mejor, d: dmin };
}

// Recibe una posición { lat, lon, precision, altitud, altPrec, t } y devuelve la altura a mostrar
// ({ alt, estimada, prec } o null). Guarda el punto si corresponde.
export async function registrar(p) {
  await cargar();
  const { e, d } = cercana(p);
  // Altura: del GPS si viene y es razonable (entre 2.000 y 6.000 m y con margen ≤ 60 m)
  if (p.altitud != null && p.altitud > 2000 && p.altitud < 6000 && (p.altPrec == null || p.altPrec <= 60)) {
    alturas.push(p.altitud); if (alturas.length > 5) alturas.shift();
    actual = { alt: Math.round(mediana(alturas)), estimada: false, prec: p.altPrec ?? null };
  } else {
    await relieve.cargar();
    const zr = relieve.altura(p.lat, p.lon);
    if (zr != null) actual = { alt: Math.round(zr), estimada: true, fuente: 'relieve', prec: null };
    else if (e?.altura && d < 400) actual = { alt: e.altura, estimada: true, fuente: 'estacion', prec: null };
    else actual = null;
  }

  if (p.precision > 50 || d > 3000) return actual; // impreciso o fuera del parque: no se guarda
  const t = p.t || Date.now();
  const ult = puntos[puntos.length - 1];
  const mov = ult ? distancia(ult, p) : Infinity;
  if (!ult || mov >= 15 || t - ult.t >= 120000) {
    puntos.push({ t, lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6), alt: actual?.alt ?? null, est: !!actual?.estimada });
    if (puntos.length > MAX_PUNTOS) puntos.splice(0, puntos.length - MAX_PUNTOS);
    guardar();
  }
  return actual;
}

export const alturaActual = () => actual;

// La jornada actual: los puntos desde la última pausa de más de 3 horas (otro día u otra visita).
// Antes se sumaba todo el historial: al volver otro día, el salto entre el último punto de ayer y el primero de hoy
// contaba como distancia caminada (2 km en 24 h pasan el filtro de velocidad) y «máximo de hoy» mezclaba días.
const PAUSA_JORNADA = 3 * 3600e3;
function jornada() {
  let i = puntos.length - 1;
  while (i > 0 && puntos[i].t - puntos[i - 1].t <= PAUSA_JORNADA) i--;
  return puntos.slice(Math.max(0, i));
}

// Lo que se dibuja (mapa, 3D y PDF): la jornada actual, para no unir con una línea el final de ayer y el inicio de hoy
export const lista = () => jornada();

export function resumen() {
  const puntos = jornada();
  if (!puntos.length) return null;
  let dist = 0, subida = 0, altMax = null, altMin = null, refAlt = null, gps = false;
  for (let i = 0; i < puntos.length; i++) {
    const p = puntos[i];
    if (i) {
      const a = puntos[i - 1], d = distancia(a, p), dt = (p.t - a.t) / 1000;
      if (d >= 15 && (dt <= 0 || d / dt <= 3)) dist += d; // descarta saltos del GPS
    }
    if (p.alt != null) {
      altMax = altMax == null ? p.alt : Math.max(altMax, p.alt);
      altMin = altMin == null ? p.alt : Math.min(altMin, p.alt);
      if (!p.est) gps = true;
      // Subida acumulada con umbral de 5 m para no sumar el ruido del GPS
      if (refAlt == null) refAlt = p.alt;
      else if (p.alt - refAlt >= 5) { subida += p.alt - refAlt; refAlt = p.alt; }
      else if (refAlt - p.alt >= 5) refAlt = p.alt;
    }
  }
  return {
    inicio: puntos[0].t, fin: puntos[puntos.length - 1].t,
    duracion: puntos[puntos.length - 1].t - puntos[0].t,
    distancia: Math.round(dist), subida: Math.round(subida),
    altMax, altMin, alturaGps: gps, puntos: puntos.length,
  };
}

// Perfil de altura para dibujar: [{ x: metros recorridos, y: altura }]
export function perfil() {
  const puntos = jornada();
  const out = []; let acum = 0;
  for (let i = 0; i < puntos.length; i++) {
    if (i) { const d = distancia(puntos[i - 1], puntos[i]); if (d >= 15) acum += d; }
    if (puntos[i].alt != null) out.push({ x: acum, y: puntos[i].alt });
  }
  return out;
}

export async function borrar() { puntos = []; alturas = []; actual = null; await guardar(); }
